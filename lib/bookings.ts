import { format, startOfMonth } from "date-fns"
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
