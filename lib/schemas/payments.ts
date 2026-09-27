import { z } from "zod"
import type {
  Booking,
  CompletePaymentParams,
  CreatePaymentPayload,
  RejectPaymentPayload,
} from "@/lib/types"

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
  { value: "cash", label: "Cash" },
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

/** Cash leaves no transaction reference, so the field is off for it. */
export function isCashMethod(method: string) {
  return method === "cash"
}

const paymentFields = z.object({
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
    .max(100, "Keep the reference under 100 characters."),
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

/** Requires a transaction reference for every method except cash. */
const hasReferenceUnlessCash = (values: {
  method: string
  reference: string
}) => isCashMethod(values.method) || values.reference.length > 0

const referenceRequiredIssue = {
  message: "Enter the transaction reference.",
  path: ["reference"],
  // Still runs while other fields are invalid, so the error shows up
  // alongside theirs instead of only once everything else passes.
  when: (payload: z.core.ParsePayload) =>
    paymentFields.shape.reference.safeParse(
      (payload.value as { reference?: unknown }).reference
    ).success,
}

export const paymentSchema = paymentFields.refine(
  hasReferenceUnlessCash,
  referenceRequiredIssue
)

export type PaymentValues = z.infer<typeof paymentSchema>

export const emptyPaymentValues: PaymentValues = {
  booking_id: "",
  booking_ref: "",
  amount: Number.NaN,
  method: "" as PaymentValues["method"],
  payment_type: "" as PaymentValues["payment_type"],
  reference: "",
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
    reference: isCashMethod(values.method) ? "" : values.reference.trim(),
    payment_type: values.payment_type,
    recorded_by: recordedBy,
  }
}

/**
 * Settling the balance on a deposit: the amount, how it was paid and (for
 * M-Pesa) the transaction reference. The booking comes from the deposit.
 */
export const completePaymentSchema = paymentFields
  .pick({ amount: true, method: true, reference: true })
  .refine(hasReferenceUnlessCash, referenceRequiredIssue)

export type CompletePaymentValues = z.infer<typeof completePaymentSchema>

export const emptyCompletePaymentValues: CompletePaymentValues = {
  amount: Number.NaN,
  method: "" as CompletePaymentValues["method"],
  reference: "",
}

/**
 * Shapes the form into the query params `POST /payments/complete/{ref}`
 * expects. Cash sends no `reference`; `recordedBy` is the signed-in staff
 * member's `user_id`.
 */
export function toCompletePaymentParams(
  values: CompletePaymentValues,
  recordedBy: string
): CompletePaymentParams {
  return {
    amount: values.amount,
    method: values.method,
    ...(isCashMethod(values.method)
      ? {}
      : { reference: values.reference.trim() }),
    recorded_by: recordedBy,
  }
}

/** Rejecting a payment asks for one free-text reason, kept on the record. */
export const rejectPaymentSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(5, "Give a reason of at least 5 characters.")
    .max(500, "Keep the reason under 500 characters."),
})

export type RejectPaymentValues = z.infer<typeof rejectPaymentSchema>

/**
 * Shapes the reason form into the body `PATCH /payments/{id}/reject`
 * expects. `rejectedBy` is the signed-in staff member's `user_id`.
 */
export function toRejectPaymentPayload(
  values: RejectPaymentValues,
  rejectedBy: string
): RejectPaymentPayload {
  return {
    rejection_reason: values.reason.trim(),
    rejected_by: rejectedBy,
  }
}

/** A booking can be paid for while nothing has been settled against it yet. */
export const UNPAID_STATUS = "unpaid"

export function isUnpaidBooking(booking: Booking) {
  return booking.payment_status.toLowerCase() === UNPAID_STATUS
}
