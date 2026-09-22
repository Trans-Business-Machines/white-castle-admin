import { format, isAfter, isBefore, startOfToday } from "date-fns"
import { z } from "zod"
import type {
  CancelBookingPayload,
  CreateBookingPayload,
  Guest,
  RejectBookingPayload,
} from "@/lib/types"

/** Upper bound for the adults / children counters. */
export const MAX_OCCUPANTS = 20

const dateField = (emptyMessage: string) =>
  z
    .date()
    .nullable()
    .refine((value) => Boolean(value), emptyMessage)

export const bookingSchema = z
  .object({
    room_id: z.string().min(1, "Choose a room."),
    guest_id: z.string().min(1, "Choose a guest."),
    check_in_date: dateField("Pick a check-in date.").refine(
      (value) => value === null || !isBefore(value, startOfToday()),
      "Check-in can't be in the past."
    ),
    check_out_date: dateField("Pick a check-out date."),
    adults: z
      .number({ error: "Enter the number of adults." })
      .int("Use a whole number.")
      .min(1, "At least one adult must stay.")
      .max(MAX_OCCUPANTS, `Keep adults at ${MAX_OCCUPANTS} or fewer.`),
    children: z
      .number({ error: "Enter the number of children." })
      .int("Use a whole number.")
      .min(0, "Children can't be negative.")
      .max(MAX_OCCUPANTS, `Keep children at ${MAX_OCCUPANTS} or fewer.`),
    special_requests: z
      .string()
      .trim()
      .max(1000, "Keep special requests under 1000 characters."),
  })
  .refine(
    (values) =>
      !values.check_in_date ||
      !values.check_out_date ||
      isAfter(values.check_out_date, values.check_in_date),
    {
      message: "Check-out must be after check-in.",
      path: ["check_out_date"],
    }
  )

export type BookingValues = z.infer<typeof bookingSchema>

function toIsoDate(date: Date | null) {
  // The schema rejects null before submit; this only guards the types.
  if (!date) throw new Error("Booking dates are required.")
  return format(date, "yyyy-MM-dd")
}

/**
 * Shapes form values into the body `POST /bookings/create` expects. The
 * form stores the chosen guest's id; their contact details are copied from
 * the guest record here.
 */
export function toBookingPayload(
  values: BookingValues,
  guest: Guest
): CreateBookingPayload {
  return {
    room_id: values.room_id,
    check_in_date: toIsoDate(values.check_in_date),
    check_out_date: toIsoDate(values.check_out_date),
    adults: values.adults,
    children: values.children,
    special_requests: values.special_requests.trim(),
    guest_name: guest.full_name,
    guest_email: guest.email ?? "",
    guest_phone: guest.phone ?? "",
  }
}

/**
 * Rejecting and cancelling both ask for one free-text reason; only the
 * field names in the body they post differ.
 */
export const bookingReasonSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(5, "Give a reason of at least 5 characters.")
    .max(500, "Keep the reason under 500 characters."),
})

export type BookingReasonValues = z.infer<typeof bookingReasonSchema>

/**
 * Shapes the reason form into the body `PATCH /bookings/{id}/reject`
 * expects. `rejectedBy` is the signed-in staff member's `user_id`.
 */
export function toRejectBookingPayload(
  values: BookingReasonValues,
  rejectedBy: string
): RejectBookingPayload {
  return {
    rejection_reason: values.reason.trim(),
    rejected_by: rejectedBy,
  }
}

/**
 * Shapes the reason form into the body `PATCH /bookings/{id}/cancel`
 * expects. `cancelledBy` is the signed-in staff member's `user_id`.
 */
export function toCancelBookingPayload(
  values: BookingReasonValues,
  cancelledBy: string
): CancelBookingPayload {
  return {
    cancellation_reason: values.reason.trim(),
    cancelled_by: cancelledBy,
  }
}
