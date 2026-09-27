import {
  addDays,
  differenceInCalendarDays,
  format,
  parseISO,
  startOfDay,
  startOfMonth,
} from "date-fns"
import type { OccupancyRange } from "@/lib/api/bookings"
import { formatCurrency } from "@/lib/format"
import type {
  Booking,
  BookingsOccupancyStats,
  BookingStatus,
} from "@/lib/types"

/** The fields a booking action dialog needs to name what it is about to do. */
export type BookingSubject = Pick<
  Booking,
  "booking_id" | "reference" | "guest_name" | "guest_id"
>

/** Every booking status the API knows, in lifecycle order (filter options). */
export const BOOKING_STATUSES: readonly BookingStatus[] = [
  "pending",
  "approved",
  "confirmed",
  "checked_in",
  "checked_out",
  "cancelled",
  "rejected",
]

const BOOKING_STATUS_BADGES: Record<BookingStatus, string> = {
  pending:
    "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  approved:
    "bg-brand-azure/15 text-brand-navy dark:bg-brand-azure/20 dark:text-sky-200",
  confirmed:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  checked_in:
    "bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-300",
  checked_out: "bg-muted text-muted-foreground",
  cancelled: "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300",
  rejected: "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300",
}

const PAYMENT_STATUS_BADGES: Record<string, string> = {
  fully_paid:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  deposit_paid:
    "bg-brand-azure/15 text-brand-navy dark:bg-brand-azure/20 dark:text-sky-200",
  paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  partial:
    "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  pending:
    "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  unpaid: "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300",
  refunded: "bg-muted text-muted-foreground",
}

const NEUTRAL_BADGE = "bg-muted text-muted-foreground"

/** Pill tone for a booking status; unknown slugs go neutral. */
export function getBookingStatusClasses(status: string) {
  return (
    BOOKING_STATUS_BADGES[status.toLowerCase() as BookingStatus] ??
    NEUTRAL_BADGE
  )
}

/** Pill tone for a payment status; unknown slugs go neutral. */
export function getPaymentStatusClasses(status: string) {
  return PAYMENT_STATUS_BADGES[status.toLowerCase()] ?? NEUTRAL_BADGE
}

/** Booking payment statuses that clear a guest for check-in. */
const CHECK_IN_PAYMENT_STATUSES = new Set(["deposit_paid", "fully_paid"])

/** Booking statuses a guest can no longer be checked in from. */
const NO_CHECK_IN_STATUSES = new Set([
  "checked_in",
  "checked_out",
  "cancelled",
  "rejected",
])

/**
 * A guest may check in once the deposit, or the full amount, is paid, and
 * only if they haven't already checked in or out and the booking is still
 * live.
 */
export function canCheckIn(
  booking: Pick<Booking, "payment_status" | "status">
) {
  return (
    CHECK_IN_PAYMENT_STATUSES.has(booking.payment_status.toLowerCase()) &&
    !NO_CHECK_IN_STATUSES.has(booking.status.toLowerCase())
  )
}

/** Booking statuses that can no longer be cancelled. */
const NO_CANCEL_STATUSES = new Set([
  "checked_in",
  "checked_out",
  "cancelled",
  "rejected",
])

/** A booking can be cancelled until the guest checks in (or it's closed). */
export function canCancel(booking: Pick<Booking, "status">) {
  return !NO_CANCEL_STATUSES.has(booking.status.toLowerCase())
}

/** Whether the guest is in the room right now. */
export function isCheckedIn(booking: Pick<Booking, "status">) {
  return booking.status.toLowerCase() === "checked_in"
}

/** Only a guest who is currently checked in can be checked out. */
export const canCheckOut = isCheckedIn

/**
 * Extending the stay and adding extra people only apply while the guest is
 * checked in.
 */
export const canChangeStay = isCheckedIn

/** The 1st of the current month through today, for the occupancy stats. */
export function getMonthToDateRange(today = new Date()): OccupancyRange {
  return {
    from_date: format(startOfMonth(today), "yyyy-MM-dd"),
    to_date: format(today, "yyyy-MM-dd"),
  }
}

const percent = new Intl.NumberFormat("en-KE", {
  style: "percent",
  maximumFractionDigits: 1,
})

/** 1.7 → "1.7%"; the API already reports a percentage, not a ratio. */
export function formatPercent(value: number) {
  return percent.format(value / 100)
}

/**
 * The occupancy fields that get a card. `currently_occupied` is left out on
 * purpose: the units page already shows it.
 */
export type BookingStatKey = keyof Omit<
  BookingsOccupancyStats,
  "from_date" | "to_date" | "currently_occupied"
>

/** Text colour for each booking stat's title. */
const STAT_TITLE_CLASSES: Record<BookingStatKey, string> = {
  total_rooms: "text-brand-navy dark:text-sky-200",
  confirmed_bookings: "text-brand-azure dark:text-sky-300",
  revenue_kes: "text-emerald-700 dark:text-emerald-300",
  occupancy_rate_pct: "text-amber-700 dark:text-amber-300",
}

/**
 * Cards rendered for `GET /bookings/occupancy`, in display order. Keys mirror
 * the numeric fields of `BookingsOccupancyStats` so a new field in the API
 * shape fails the typecheck here until it gets a card.
 */
export const BOOKING_STAT_CARDS: ReadonlyArray<{
  key: BookingStatKey
  title: string
  label: string
  titleClassName: string
  format: (value: number) => string
}> = [
  {
    key: "total_rooms",
    title: "Total rooms",
    label: "On the property",
    titleClassName: STAT_TITLE_CLASSES.total_rooms,
    format: String,
  },
  {
    key: "confirmed_bookings",
    title: "Bookings",
    label: "Confimed this month",
    titleClassName: STAT_TITLE_CLASSES.confirmed_bookings,
    format: String,
  },
  {
    key: "revenue_kes",
    title: "Revenue",
    label: "This month",
    titleClassName: STAT_TITLE_CLASSES.revenue_kes,
    format: formatCurrency,
  },
  {
    key: "occupancy_rate_pct",
    title: "Occupancy rate",
    label: "This month",
    titleClassName: STAT_TITLE_CLASSES.occupancy_rate_pct,
    format: formatPercent,
  },
]

/** How far ahead a pending request's check-in counts as "arriving soon". */
export const ARRIVING_SOON_DAYS = 7

/** Figures shown above the `/requests` table, derived from the pending list. */
export interface BookingRequestStats {
  pending: number
  requested_value: number
  arriving_soon: number
  /** Whole days the oldest request has waited; `null` when nothing is pending. */
  oldest_wait_days: number | null
}

export type BookingRequestStatKey = keyof BookingRequestStats

/**
 * Totals for the pending requests. There is no stats endpoint for them, so
 * they come from the same list the table renders.
 */
export function getBookingRequestStats(
  requests: readonly Booking[],
  today = new Date()
): BookingRequestStats {
  const start = startOfDay(today)
  const soonLimit = addDays(start, ARRIVING_SOON_DAYS)
  let requestedValue = 0
  let arrivingSoon = 0
  let oldest: Date | null = null

  for (const request of requests) {
    requestedValue += request.total_amount
    const checkIn = parseISO(request.check_in_date)
    if (checkIn >= start && checkIn <= soonLimit) arrivingSoon += 1
    const created = parseISO(request.created_at)
    if (!oldest || created < oldest) oldest = created
  }

  return {
    pending: requests.length,
    requested_value: requestedValue,
    arriving_soon: arrivingSoon,
    oldest_wait_days: oldest ? differenceInCalendarDays(today, oldest) : null,
  }
}

/** 0 → "Today", 1 → "1 day", 5 → "5 days"; "—" when nothing is waiting. */
function formatWaitDays(days: number | null) {
  if (days === null) return "0"
  if (days <= 0) return "Today"
  return days === 1 ? "1 day" : `${days} days`
}

/** Cards rendered above the `/requests` table, in display order. */
export const BOOKING_REQUEST_STAT_CARDS: ReadonlyArray<{
  key: BookingRequestStatKey
  title: string
  label: string
  titleClassName: string
  value: (stats: BookingRequestStats) => string
}> = [
  {
    key: "pending",
    title: "Pending requests",
    label: "Waiting for approval",
    titleClassName: "text-amber-700 dark:text-amber-300",
    value: (stats) => String(stats.pending),
  },
  {
    key: "requested_value",
    title: "Requested value",
    label: "If every request is approved",
    titleClassName: "text-emerald-700 dark:text-emerald-300",
    value: (stats) => formatCurrency(stats.requested_value),
  },
  {
    key: "arriving_soon",
    title: "Arriving soon",
    label: `Check in within ${ARRIVING_SOON_DAYS} days`,
    titleClassName: "text-brand-azure dark:text-sky-300",
    value: (stats) => String(stats.arriving_soon),
  },
  {
    key: "oldest_wait_days",
    title: "Longest wait",
    label: "Oldest request pending",
    titleClassName: "text-rose-700 dark:text-rose-300",
    value: (stats) => formatWaitDays(stats.oldest_wait_days),
  },
]
