import { z } from "zod"
import type { Booking, CreatePaymentPayload, Payment } from "@/lib/types"

/** Image types accepted as proof of payment (an M-Pesa or bank screenshot). */
export const EVIDENCE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const

export const EVIDENCE_MAX_BYTES = 2 * 1024 * 1024

/** Returns a message when `file` can't be uploaded as proof of payment. */
export function getEvidenceError(file: File) {
  if (!(EVIDENCE_TYPES as readonly string[]).includes(file.type)) {
    return "Use a JPG, PNG or WebP image."
  }
  if (file.size > EVIDENCE_MAX_BYTES) {
    return "Keep the image under 2 MB."
  }
  return null
}

export const PAYMENT_METHODS = [
  { value: "mpesa", label: "M-Pesa" },
  { value: "credit_card", label: "Credit card" },
  { value: "debit_card", label: "Debit card" },
] as const

export const PAYMENT_TYPES = [
  { value: "full_payment", label: "Full payment" },
  { value: "deposit", label: "Deposit" },
] as const

const methodValues = PAYMENT_METHODS.map((method) => method.value) as [
  (typeof PAYMENT_METHODS)[number]["value"],
  ...(typeof PAYMENT_METHODS)[number]["value"][],
]

const typeValues = PAYMENT_TYPES.map((type) => type.value) as [
  (typeof PAYMENT_TYPES)[number]["value"],
  ...(typeof PAYMENT_TYPES)[number]["value"][],
]

export const paymentSchema = z.object({
  // Both come from the booking combobox: the API wants the id and the
  // reference, and picking one booking fills in both.
  booking_id: z.string().min(1, "Choose a booking."),
  booking_ref: z.string().min(1, "Choose a booking."),
  amount: z
    .number({ error: "Enter the amount paid." })
    .positive("The amount must be greater than 0."),
  method: z.enum(methodValues, { error: "Choose how the guest paid." }),
  payment_type: z.enum(typeValues, { error: "Choose the payment type." }),
  reference: z
    .string()
    .trim()
    .min(1, "Enter the transaction reference.")
    .max(100, "Keep the reference under 100 characters."),
  notes: z.string().trim().max(1000, "Keep notes under 1000 characters."),
  /** Proof of payment; uploaded after the payment record is created. */
  evidence: z
    .array(z.custom<File>((value) => value instanceof File))
    .max(1, "Attach one proof image.")
    .superRefine((files, ctx) => {
      for (const file of files) {
        const message = getEvidenceError(file)
        if (message) {
          ctx.addIssue({ code: "custom", message: `${file.name}: ${message}` })
        }
      }
    }),
})

export type PaymentValues = z.infer<typeof paymentSchema>

export const emptyPaymentValues: PaymentValues = {
  booking_id: "",
  booking_ref: "",
  amount: Number.NaN,
  method: "" as PaymentValues["method"],
  payment_type: "" as PaymentValues["payment_type"],
  reference: "",
  notes: "",
  evidence: [],
}

/**
 * Shapes form values into the body `POST /payments/create` expects.
 * `recordedBy` is the signed-in staff member's `user_id`; the proof image
 * is left out because it goes to `/payments/{id}/evidence` afterwards.
 */
export function toPaymentPayload(
  values: PaymentValues,
  recordedBy: string
): CreatePaymentPayload {
  return {
    booking_id: values.booking_id,
    booking_ref: values.booking_ref,
    amount: values.amount,
    method: values.method,
    reference: values.reference.trim(),
    payment_type: values.payment_type,
    notes: values.notes.trim(),
    recorded_by: recordedBy,
  }
}

/** Only values the form knows how to render survive a round trip. */
function knownValue<T extends string>(
  options: ReadonlyArray<{ value: T }>,
  slug: string | undefined
) {
  return options.some((option) => option.value === slug) ? (slug as T) : ""
}

/**
 * Pre-fills the form from an existing payment row, so recording another
 * payment against the same booking only means changing the amount. The
 * transaction reference and proof always start empty — they belong to one
 * transaction, never to the next.
 */
export function toPaymentFormValues(payment: Payment): PaymentValues {
  return {
    ...emptyPaymentValues,
    booking_id: payment.booking_id,
    booking_ref: payment.booking_ref,
    amount: payment.amount,
    method: knownValue(
      PAYMENT_METHODS,
      payment.method
    ) as PaymentValues["method"],
    payment_type: knownValue(
      PAYMENT_TYPES,
      payment.payment_type
    ) as PaymentValues["payment_type"],
    notes: payment.notes ?? "",
  }
}

/** A booking can be paid for while nothing has been settled against it yet. */
export const UNPAID_STATUS = "unpaid"

export function isUnpaidBooking(booking: Booking) {
  return booking.payment_status.toLowerCase() === UNPAID_STATUS
}
