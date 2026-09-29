import { endOfMonth, format, startOfMonth } from "date-fns"
import type { DateRange } from "@/lib/api/payments"
import { getUrlFileId } from "@/lib/download"
import { formatCurrency, humanizeSlug } from "@/lib/format"
import { PAYMENT_METHODS, PAYMENT_TYPES } from "@/lib/schemas/payments"
import type { Booking, Payment, PaymentStats } from "@/lib/types"

/** The 1st through the last day of the current month. */
export function getCurrentMonthRange(today = new Date()): DateRange {
  return {
    date_from: format(startOfMonth(today), "yyyy-MM-dd"),
    date_to: format(endOfMonth(today), "yyyy-MM-dd"),
  }
}

/**
 * Statuses offered by the payments CSV export. These are the *booking*
 * payment statuses the export endpoint filters on, not the `pending` /
 * `verified` / `rejected` of a payment record.
 */
export const PAYMENT_EXPORT_STATUSES = [
  "unpaid",
  "deposit_paid",
  "fully_paid",
] as const

/**
 * Statuses offered by the payments filter, in lifecycle order: a recorded
 * payment waits on its proof being checked, then lands on `verified` or on
 * `rejected` with a `rejection_reason`. The badge map below tints a few more
 * slugs than this, so a status the API grows still renders in colour — but
 * only these three are offered as filters, because an unsupported value
 * would be rejected by the endpoint. Any unlisted slug renders neutral grey.
 */
export const PAYMENT_STATUSES = ["pending", "verified", "rejected"] as const

const PAYMENT_STATUS_BADGES: Record<string, string> = {
  pending:
    "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  verified:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  // Aliases for the same "money is in" state, so the tone holds whichever
  // slug the backend settles on.
  confirmed:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  completed:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  rejected: "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300",
  failed: "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300",
  refunded: "bg-muted text-muted-foreground",
}

const NEUTRAL_BADGE = "bg-muted text-muted-foreground"

/**
 * Where a payment sits in the payments list: pending (still needs a
 * decision) → verified → rejected. Aliases share their group's rank and
 * unknown slugs go last.
 */
const PAYMENT_STATUS_RANK: Record<string, number> = {
  pending: 0,
  verified: 1,
  confirmed: 1,
  completed: 1,
  rejected: 2,
  failed: 2,
}

function getPaymentRank(payment: Pick<Payment, "status">) {
  return PAYMENT_STATUS_RANK[payment.status.toLowerCase()] ?? 3
}

/**
 * A copy of `payments` in list order (`getPaymentRank`). The sort is stable,
 * so payments with the same status keep the API's order.
 */
export function sortPayments<T extends Pick<Payment, "status">>(
  payments: readonly T[]
) {
  return [...payments].sort((a, b) => getPaymentRank(a) - getPaymentRank(b))
}

/** Pill tone for a payment record's status; unknown slugs go neutral. */
export function getPaymentRecordStatusClasses(status: string) {
  return PAYMENT_STATUS_BADGES[status.toLowerCase()] ?? NEUTRAL_BADGE
}

/** "mpesa" → "M-Pesa"; an unknown slug falls back to a readable form. */
export function getPaymentMethodLabel(slug: string) {
  return (
    PAYMENT_METHODS.find((method) => method.value === slug)?.label ??
    humanizeSlug(slug)
  )
}

/** "full_payment" → "Full payment". */
export function getPaymentTypeLabel(slug: string) {
  return (
    PAYMENT_TYPES.find((type) => type.value === slug)?.label ??
    humanizeSlug(slug)
  )
}

/** Every recorded payment's amount, whatever its status. */
export function getPaymentsTotalAmount(stats: PaymentStats) {
  return stats.verified.amount + stats.pending.amount + stats.rejected.amount
}

/** The payments page's summary cards, in display order. */
export const PAYMENT_STAT_CARDS: ReadonlyArray<{
  key: string
  title: string
  titleClassName: string
  value: (stats: PaymentStats) => string
  label: (stats: PaymentStats) => string
}> = [
  {
    key: "total",
    title: "Total recorded",
    titleClassName: "text-brand-azure dark:text-sky-300",
    value: (stats) => formatCurrency(getPaymentsTotalAmount(stats)),
    label: (stats) => `${stats.total_payments} in total this month`,
  },
  {
    key: "verified",
    title: "Verified",
    titleClassName: "text-emerald-700 dark:text-emerald-300",
    value: (stats) => formatCurrency(stats.verified.amount),
    label: (stats) => `${stats.verified.count} confirmed this month`,
  },
  {
    key: "pending",
    title: "Pending",
    titleClassName: "text-amber-700 dark:text-amber-300",
    value: (stats) => formatCurrency(stats.pending.amount),
    label: (stats) => `${stats.pending.count} awaiting verification this month`,
  },
  {
    key: "rejected",
    title: "Rejected",
    titleClassName: "text-rose-700 dark:text-rose-300",
    value: (stats) => formatCurrency(stats.rejected.amount),
    label: (stats) => `${stats.rejected.count} turned down this month`,
  },
]

/** A shilling amount rounded to the cent, so 33% of 1,001 isn't 330.33000… */
function toCents(amount: number) {
  return Math.round(amount * 100) / 100
}

/**
 * What's left to pay on a booking once its deposit is in: the booking's
 * current total (which grows with extensions and extra guests) less the
 * deposit, never below 0.
 */
export function getRemainingBalance(
  booking: Pick<Booking, "total_amount">,
  deposit: Pick<Payment, "amount">
) {
  return Math.max(0, toCents(booking.total_amount - deposit.amount))
}

/**
 * The `file_id` for `GET /payments/evidence/{file_id}`: the last path
 * segment of the payment's `evidence_url`, or `null` when no proof is
 * attached.
 */
export function getEvidenceFileId(payment: Pick<Payment, "evidence_url">) {
  return getUrlFileId(payment.evidence_url)
}
