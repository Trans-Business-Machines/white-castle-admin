import {
  endOfMonth,
  format,
  isAfter,
  isMatch,
  isSameMonth,
  isSameYear,
  parseISO,
  startOfDay,
  startOfMonth,
  subMonths,
} from "date-fns"
import type { ReportRange } from "@/lib/api/reports"
import { formatPercent, getMonthToDateRange } from "@/lib/bookings"
import { formatCurrency } from "@/lib/format"
import type { BookingsOccupancyStats, RevenueReport } from "@/lib/types"

/** Search-param names the dashboard keeps its date range under. */
const FROM_PARAM = "from"
const TO_PARAM = "to"

const ISO_DATE = "yyyy-MM-dd"

function isIsoDate(value: string | null): value is string {
  return value !== null && isMatch(value, ISO_DATE)
}

/**
 * Reads `?from&to` into a report range, falling back to month-to-date when
 * either date is missing or malformed, the start is in the future, or the
 * range is inverted. Same rule as the Change dates dialog, so a hand-typed
 * URL can't bypass it. Past windows (last month) and future ends (expected
 * revenue) are both fine.
 */
export function parseReportRange(
  params: Pick<URLSearchParams, "get">,
  today = new Date()
): ReportRange {
  const from = params.get(FROM_PARAM)
  const to = params.get(TO_PARAM)
  if (!isIsoDate(from) || !isIsoDate(to)) return getMonthToDateRange(today)
  const start = parseISO(from)
  if (isAfter(start, startOfDay(today)) || isAfter(start, parseISO(to))) {
    return getMonthToDateRange(today)
  }
  return { from_date: from, to_date: to }
}

/** The whole of the previous calendar month, for the "Last month" preset. */
export function getLastMonthRange(today = new Date()): ReportRange {
  const lastMonth = subMonths(today, 1)
  return {
    from_date: format(startOfMonth(lastMonth), ISO_DATE),
    to_date: format(endOfMonth(lastMonth), ISO_DATE),
  }
}

/** True when the range is the default window, so the URL can stay clean. */
export function isMonthToDate(range: ReportRange, today = new Date()) {
  const base = getMonthToDateRange(today)
  return range.from_date === base.from_date && range.to_date === base.to_date
}

/** Query string for a range; "" for the default so `/dashboard` stays canonical. */
export function toReportSearch(range: ReportRange, today = new Date()) {
  if (isMonthToDate(range, today)) return ""
  const params = new URLSearchParams({
    [FROM_PARAM]: range.from_date,
    [TO_PARAM]: range.to_date,
  })
  return `?${params.toString()}`
}

/**
 * "1 – 22 Sep 2026", "28 Aug – 22 Sep 2026" or "30 Dec 2025 – 3 Jan 2026":
 * shared parts are only spelled once.
 */
export function formatReportRange(range: ReportRange) {
  const from = parseISO(range.from_date)
  const to = parseISO(range.to_date)
  const end = format(to, "dd MMM yyyy")
  if (isSameMonth(from, to)) return `${format(from, "dd MMM")} - ${end}`
  if (isSameYear(from, to)) return `${format(from, "dd MMM")} - ${end}`
  return `${format(from, "d MMM yyyy")} - ${end}`
}

/** Both reports, as the dashboard's cards read from either. */
export interface DashboardReports {
  occupancy: BookingsOccupancyStats
  revenue: RevenueReport
}

/**
 * Headline cards, in display order. Each reads whichever report carries its
 * figure; the label gives the number its unit or its companion figure.
 */
export const DASHBOARD_STAT_CARDS: ReadonlyArray<{
  key: string
  title: string
  titleClassName: string
  text: (reports: DashboardReports) => string
  label: (reports: DashboardReports) => string
}> = [
  {
    key: "revenue",
    title: "Revenue",
    titleClassName: "text-emerald-700 dark:text-emerald-300",
    text: ({ occupancy }) => formatCurrency(occupancy.revenue_kes),
    label: () => "Earned in this period",
  },
  {
    key: "occupancy_rate",
    title: "Occupancy rate",
    titleClassName: "text-amber-700 dark:text-amber-300",
    text: ({ occupancy }) => formatPercent(occupancy.occupancy_rate_pct),
    label: () => "Of rooms across the period",
  },
  {
    key: "expected_revenue",
    title: "Expected revenue",
    titleClassName: "text-brand-azure dark:text-sky-300",
    text: ({ revenue }) => formatCurrency(revenue.total_revenue_expected),
    label: ({ revenue }) =>
      `${formatCurrency(revenue.total_deposit_expected)} in deposits`,
  },
  {
    key: "bookings",
    title: "Bookings",
    titleClassName: "text-brand-navy dark:text-sky-200",
    text: ({ revenue }) => String(revenue.total_bookings),
    label: ({ occupancy }) => `${occupancy.confirmed_bookings} confirmed`,
  },
]

export type PaymentMixKey = "fully_paid" | "deposit_only" | "unpaid"

/**
 * Slice colours for the payment-mix donut, as CSS variables so they follow
 * the theme. Azure / teal / amber were validated for colour-blind separation
 * (ΔE ≥ 15 on every pair) — swap with care.
 */
export const PAYMENT_MIX_COLORS: Record<PaymentMixKey, string> = {
  fully_paid: "var(--color-brand-azure)",
  deposit_only: "var(--color-brand-teal)",
  unpaid: "var(--color-amber-600)",
}

export interface PaymentMixSlice {
  key: PaymentMixKey
  label: string
  value: number
}

/**
 * Bookings by how much they've paid. The API only reports fully paid and
 * deposit-only counts, so whatever is left of `total_bookings` is treated as
 * unpaid (clamped at zero in case the counts overlap).
 */
export function getPaymentMix(report: RevenueReport): PaymentMixSlice[] {
  const unpaid = Math.max(
    0,
    report.total_bookings -
      report.fully_paid_bookings -
      report.deposit_only_bookings
  )
  return [
    {
      key: "fully_paid",
      label: "Fully paid",
      value: report.fully_paid_bookings,
    },
    {
      key: "deposit_only",
      label: "Deposit only",
      value: report.deposit_only_bookings,
    },
    { key: "unpaid", label: "Unpaid", value: unpaid },
  ]
}

/** Share of a total as a 0–100 figure; 0 when there is nothing to divide by. */
export function toShare(value: number, total: number) {
  return total > 0 ? Math.min(100, (value / total) * 100) : 0
}

/**
 * How much of the money expected from the period's bookings has come in,
 * with the deposit total as the first milestone staff care about.
 */
export function getCollectionProgress({
  occupancy,
  revenue,
}: DashboardReports) {
  const collected = occupancy.revenue_kes
  const expected = revenue.total_revenue_expected
  const deposits = revenue.total_deposit_expected
  return {
    collected,
    expected,
    deposits,
    outstanding: Math.max(0, expected - collected),
    collectedPct: toShare(collected, expected),
    depositsPct: toShare(deposits, expected),
  }
}
