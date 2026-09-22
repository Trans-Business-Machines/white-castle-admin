import { cn } from "cn"
import { humanizeSlug } from "@/lib/format"
import {
  getBookingStatusClasses,
  getPaymentStatusClasses,
} from "@/lib/bookings"

const pillClassName =
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap"

interface StatusBadgeProps {
  /** Status slug from the API, e.g. "checked_in". */
  status: string
  className?: string
}

/** Tinted pill whose colour follows the booking status (see `lib/bookings.ts`). */
function BookingStatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(pillClassName, getBookingStatusClasses(status), className)}
    >
      {humanizeSlug(status)}
    </span>
  )
}

/** Tinted pill for a booking's payment status. */
function PaymentStatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(pillClassName, getPaymentStatusClasses(status), className)}
    >
      {humanizeSlug(status)}
    </span>
  )
}

export { BookingStatusBadge, PaymentStatusBadge }
