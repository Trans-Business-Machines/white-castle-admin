import { humanizeSlug } from "@/lib/format"
import { PAYMENT_METHODS, PAYMENT_TYPES } from "@/lib/schemas/payments"

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
