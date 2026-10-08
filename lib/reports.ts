import {
  CalendarRange,
  CalendarX2,
  TrendingUp,
  Users,
  UtensilsCrossed,
  Wallet,
  type LucideIcon,
} from "lucide-react"
import { isAfter, isValid, parseISO } from "date-fns"
import type {
  BookingsReportFilters,
  MealPlanReportFilters,
  PaymentsReportFilters,
  ReportDateRange,
} from "@/lib/api/reports"
import { BOOKING_STATUSES, getMealPlanLabel } from "@/lib/bookings"
import { formatCurrency, formatCurrencyUsd, formatDate } from "@/lib/format"
import { PAYMENT_STATUSES } from "@/lib/payments"
import { CURRENCIES, MEAL_PLANS } from "@/lib/schemas/bookings"
import { PAYMENT_METHODS } from "@/lib/schemas/payments"
import { ROOM_TYPES } from "@/lib/schemas/units"
import type {
  BookingsReport,
  BookingsReportBooking,
  CancellationsReport,
  Guest,
  GuestsReport,
  MealPlanReport,
  PaymentsReport,
  PaymentsReportPayment,
  RevenueReport,
} from "@/lib/types"

/** URL segment of each report: `/reports/<slug>`. */
export type ReportSlug =
  | "bookings"
  | "meal-plans"
  | "cancellations"
  | "guests"
  | "revenue"
  | "payments"

export interface ReportType {
  slug: ReportSlug
  title: string
  description: string
  icon: LucideIcon
}

/** The reports offered on `/reports`, in display order. */
export const REPORT_TYPES: readonly ReportType[] = [
  {
    slug: "bookings",
    title: "Bookings",
    description:
      "Full bookings report filterable by date, status, room type, meal plan. Includes summary counts and totals.",
    icon: CalendarRange,
  },
  {
    slug: "meal-plans",
    title: "Meal Plans",
    description:
      "Meal plan report: bookings and meal revenue per plan (Bed Only, Bed & Breakfast, Half Board, Full Board), filterable by date, meal plan, booking status and residency.",
    icon: UtensilsCrossed,
  },
  {
    slug: "cancellations",
    title: "Cancellations",
    description:
      "Cancellations report all cancelled bookings with fees and refunds. Breakdown: system auto-cancelled vs staff cancelled, paid vs unpaid at time of cancel.",
    icon: CalendarX2,
  },
  {
    slug: "guests",
    title: "Guests",
    description:
      "Guests report total guests, new guests, blacklisted, top returning guests.",
    icon: Users,
  },
  {
    slug: "revenue",
    title: "Revenue",
    description:
      "Revenue report expected vs actual collected, payment method breakdown, cancellation fees collected, meal plan revenue, extra charges.",
    icon: TrendingUp,
  },
  {
    slug: "payments",
    title: "Payments",
    description:
      "Payments report all payments filterable by date, status, method. Breakdown by M-Pesa vs cash, verified vs pending vs rejected.",
    icon: Wallet,
  },
]

/** Raw `searchParams` of a report page, as Next hands them over. */
export type ReportSearchParams = Record<string, string | string[] | undefined>

/** `/reports/<slug>?…`, leaving out the params that are empty. */
export function getReportHref(slug: ReportSlug, params: object = {}) {
  const search = new URLSearchParams(
    Object.entries(params).filter(
      (entry): entry is [string, string] =>
        typeof entry[1] === "string" && entry[1] !== ""
    )
  ).toString()
  return search ? `/reports/${slug}?${search}` : `/reports/${slug}`
}

/** The param's value when it's one of `allowed`, else "". */
function pickParam(
  params: ReportSearchParams,
  key: string,
  allowed: readonly string[]
) {
  const value = params[key]
  return typeof value === "string" && allowed.includes(value) ? value : ""
}

/** The param when it's a real "yyyy-MM-dd" date, else "". */
function pickDateParam(params: ReportSearchParams, key: string) {
  const value = params[key]
  return typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    isValid(parseISO(value))
    ? value
    : ""
}

export const EMPTY_PAYMENTS_REPORT_FILTERS: PaymentsReportFilters = {
  from_date: "",
  to_date: "",
  status: "",
  method: "",
}

export const EMPTY_BOOKINGS_REPORT_FILTERS: BookingsReportFilters = {
  from_date: "",
  to_date: "",
  status: "",
  room_type: "",
  meal_plan: "",
  currency: "",
}

export const EMPTY_REPORT_DATE_RANGE: ReportDateRange = {
  from_date: "",
  to_date: "",
}

/**
 * Reads `from_date` / `to_date` out of the URL. Malformed dates are dropped,
 * and a "to" before "from" is ignored.
 */
export function parseReportDateRange(
  params: ReportSearchParams
): ReportDateRange {
  const from_date = pickDateParam(params, "from_date")
  const to_date = pickDateParam(params, "to_date")
  return {
    from_date,
    to_date:
      from_date && to_date && isAfter(parseISO(from_date), parseISO(to_date))
        ? ""
        : to_date,
  }
}

/**
 * Reads the bookings report filters out of the URL. Anything unknown or
 * malformed is dropped rather than sent, so a hand-edited link still
 * produces a valid request.
 */
export function parseBookingsReportFilters(
  params: ReportSearchParams
): BookingsReportFilters {
  return {
    ...parseReportDateRange(params),
    status: pickParam(params, "status", BOOKING_STATUSES),
    room_type: pickParam(
      params,
      "room_type",
      ROOM_TYPES.map((type) => type.value)
    ),
    meal_plan: pickParam(
      params,
      "meal_plan",
      MEAL_PLANS.map((plan) => plan.value)
    ),
    currency: pickParam(
      params,
      "currency",
      CURRENCIES.map((currency) => currency.value)
    ),
  }
}

/** Reads the payments report filters (period, status, method) out of the URL. */
export function parsePaymentsReportFilters(
  params: ReportSearchParams
): PaymentsReportFilters {
  return {
    ...parseReportDateRange(params),
    status: pickParam(params, "status", PAYMENT_STATUSES),
    method: pickParam(
      params,
      "method",
      PAYMENT_METHODS.map((method) => method.value)
    ),
  }
}

export const EMPTY_MEAL_PLAN_REPORT_FILTERS: MealPlanReportFilters = {
  from_date: "",
  to_date: "",
  meal_plan: "",
  status: "",
  currency: "",
}

/** Reads the meal plan report filters out of the URL; unknown values are dropped. */
export function parseMealPlanReportFilters(
  params: ReportSearchParams
): MealPlanReportFilters {
  return {
    ...parseReportDateRange(params),
    meal_plan: pickParam(
      params,
      "meal_plan",
      MEAL_PLANS.map((plan) => plan.value)
    ),
    status: pickParam(params, "status", BOOKING_STATUSES),
    currency: pickParam(
      params,
      "currency",
      CURRENCIES.map((currency) => currency.value)
    ),
  }
}

/** "1 Oct 2026 – 31 Oct 2026", "From 1 Oct 2026", "Up to …" or "All dates". */
export function formatReportPeriod(from: string, to: string) {
  if (from && to) return `${formatDate(from)} – ${formatDate(to)}`
  if (from) return `From ${formatDate(from)}`
  if (to) return `Up to ${formatDate(to)}`
  return "All dates"
}

type BookingsReportSummary = BookingsReport["summary"]

type BookingsReportStatKey = {
  [K in keyof BookingsReportSummary]: BookingsReportSummary[K] extends number
    ? K
    : never
}[keyof BookingsReportSummary]

/** 1234 → "1,234". */
export const formatCount = (value: number) => value.toLocaleString("en-KE")

/**
 * Formats a summary figure, or "—" when the response doesn't carry it, so a
 * renamed or dropped backend field blanks one card instead of the page.
 */
export function formatStat(value: unknown, format: (value: number) => string) {
  return typeof value === "number" && Number.isFinite(value)
    ? format(value)
    : "—"
}

/** Summary cards of the bookings report, in display order. */
export const BOOKINGS_REPORT_STAT_CARDS: ReadonlyArray<{
  key: BookingsReportStatKey
  title: string
  /** Line under the figure; may read other summary fields. */
  label: string | ((summary: BookingsReportSummary) => string)
  titleClassName: string
  format: (value: number) => string
  /** A revenue card's currency: hidden when the report is filtered to the other one. */
  currency?: "KES" | "USD"
}> = [
  {
    key: "total",
    title: "Bookings",
    label: (summary) =>
      `${formatStat(summary.resident_bookings, formatCount)} resident · ${formatStat(summary.non_resident_bookings, formatCount)} non-resident`,
    titleClassName: "text-brand-navy dark:text-sky-200",
    format: formatCount,
  },
  {
    key: "total_revenue_kes",
    title: "Resident revenue",
    label: "booking value in KES",
    titleClassName: "text-emerald-700 dark:text-emerald-300",
    format: formatCurrency,
    currency: "KES",
  },
  {
    key: "total_revenue_usd",
    title: "Non-resident revenue",
    label: "booking value in USD",
    titleClassName: "text-teal-700 dark:text-teal-300",
    format: formatCurrencyUsd,
    currency: "USD",
  },
  {
    key: "total_guests",
    title: "Guests",
    label: (summary) =>
      `${formatStat(summary.total_children_under_5, formatCount)} under 5 · ${formatStat(summary.total_children_6_to_12, formatCount)} aged 6–12`,
    titleClassName: "text-violet-700 dark:text-violet-300",
    format: formatCount,
  },
  {
    key: "total_nights",
    title: "Nights",
    label: "nights booked",
    titleClassName: "text-brand-azure dark:text-sky-300",
    format: formatCount,
  },
  {
    key: "breakfast_bookings",
    title: "Breakfast",
    label: "bookings on a breakfast plan",
    titleClassName: "text-amber-700 dark:text-amber-300",
    format: formatCount,
  },
]

/** The cards to show for a report filtered to `currency` ("" = both). */
export function getBookingsReportStatCards(currency: string) {
  return BOOKINGS_REPORT_STAT_CARDS.filter(
    (card) => !currency || !card.currency || card.currency === currency
  )
}

/** `by_meal_plan` as `[plan, count]` pairs in `MEAL_PLANS` order, unknown plans last. */
export function getMealPlanBreakdown(
  byMealPlan: Record<string, number> | undefined
) {
  const order: readonly string[] = MEAL_PLANS.map((plan) => plan.value)
  const rank = (plan: string) => {
    const index = order.indexOf(plan)
    return index === -1 ? order.length : index
  }
  return Object.entries(byMealPlan ?? {}).sort(([a], [b]) => rank(a) - rank(b))
}

/** "KES" → "Resident (KES)"; anything else as-is. */
export function getCurrencyLabel(currency: string) {
  return (
    CURRENCIES.find((option) => option.value === currency)?.label ?? currency
  )
}

/**
 * `by_status` as `[status, count]` pairs in lifecycle order
 * (`BOOKING_STATUSES`), with any status the API adds later at the end.
 */
export function getStatusBreakdown(
  byStatus: Record<string, number> | undefined
) {
  const rank = (status: string) => {
    const index = (BOOKING_STATUSES as readonly string[]).indexOf(status)
    return index === -1 ? BOOKING_STATUSES.length : index
  }
  return Object.entries(byStatus ?? {}).sort(([a], [b]) => rank(a) - rank(b))
}

/** Case-insensitive match on reference, guest name or email. */
export function matchesBookingsReportSearch(
  booking: BookingsReportBooking,
  search: string
) {
  const term = search.trim().toLowerCase()
  if (!term) return true
  return [booking.reference, booking.guest_name, booking.guest_email].some(
    (value) => value?.toLowerCase().includes(term)
  )
}

/** A stat card's content, worked out from a report. */
export interface ReportStatCard {
  key: string
  title: string
  text: string
  label: string
  titleClassName: string
}

/**
 * The revenue report's headline cards. Every figure goes through
 * `formatStat`, so a field the response lacks reads "—". The balance is
 * expected less collected, so a negative one is shown as the amount
 * collected above what was expected rather than as a negative figure.
 */
export function getRevenueStatCards(
  revenue: RevenueReport["revenue"]
): ReportStatCard[] {
  const balance = revenue.balance_outstanding_kes
  return [
    {
      key: "expected_kes",
      title: "Expected (KES)",
      text: formatStat(revenue.total_expected_kes, formatCurrency),
      label: "booked by residents",
      titleClassName: "text-brand-navy dark:text-sky-200",
    },
    {
      key: "expected_usd",
      title: "Expected (USD)",
      text: formatStat(revenue.total_expected_usd, formatCurrencyUsd),
      label: "booked by non-residents",
      titleClassName: "text-teal-700 dark:text-teal-300",
    },
    {
      key: "collected",
      title: "Collected",
      text: formatStat(revenue.total_collected_kes, formatCurrency),
      label: "payments received in KES",
      titleClassName: "text-emerald-700 dark:text-emerald-300",
    },
    {
      key: "balance",
      title: "Balance",
      text: formatStat(balance, (value) => formatCurrency(Math.abs(value))),
      label: balance > 0 ? "still to collect" : "collected above expected",
      titleClassName:
        balance > 0
          ? "text-rose-700 dark:text-rose-300"
          : "text-emerald-700 dark:text-emerald-300",
    },
    {
      key: "meal_plans",
      title: "Meal plans",
      text: formatStat(revenue.meal_plan_revenue_kes, formatCurrency),
      label: "breakfast, half and full board",
      titleClassName: "text-amber-700 dark:text-amber-300",
    },
    {
      key: "children",
      title: "Children charges",
      text: formatStat(revenue.children_charges_kes, formatCurrency),
      label: "children aged 6–12",
      titleClassName: "text-brand-azure dark:text-sky-300",
    },
    {
      key: "extras",
      title: "Extra charges",
      text: formatStat(revenue.extra_charges_kes, formatCurrency),
      label: "extensions and extra guests",
      titleClassName: "text-violet-700 dark:text-violet-300",
    },
  ]
}

/** One part of a part-to-whole bar; `className` is the segment's fill. */
export interface ShareSegment {
  key: string
  label: string
  value: number
  className: string
  /** Secondary figure under the label, e.g. "26 payments". */
  detail?: string
}

/** Fill for whatever a breakdown's named parts don't account for. */
const OTHER_FILL = "bg-slate-500"

/**
 * Adds an "Other" segment when the named parts fall short of `total`, so
 * the bar and its shares always describe the whole figure.
 */
function withRemainder(segments: ShareSegment[], total: number) {
  const named = segments.reduce((sum, segment) => sum + segment.value, 0)
  const rest = total - named
  return rest > 0
    ? [
        ...segments,
        { key: "other", label: "Other", value: rest, className: OTHER_FILL },
      ]
    : segments
}

/** Money collected per payment method (M-Pesa, cash, then any remainder). */
export function getPaymentMethodSegments(
  methods: RevenueReport["payment_methods"]
) {
  return withRemainder(
    [
      {
        key: "mpesa",
        label: "M-Pesa",
        value: methods.mpesa,
        className: "bg-brand-azure dark:bg-sky-600",
      },
      {
        key: "cash",
        label: "Cash",
        value: methods.cash,
        className: "bg-amber-600",
      },
    ],
    methods.total
  )
}

/** Bookings in the period by the guest's residency (KES vs USD pricing). */
export function getBookingResidencySegments(
  bookings: RevenueReport["bookings"]
) {
  return withRemainder(
    [
      {
        key: "resident",
        label: "Residents",
        value: bookings.resident_kes,
        className: "bg-brand-azure dark:bg-sky-600",
        detail: "priced in KES",
      },
      {
        key: "non_resident",
        label: "Non-residents",
        value: bookings.non_resident_usd,
        className: "bg-violet-600",
        detail: "priced in USD",
      },
    ],
    bookings.total
  )
}

/** Bookings in the period by how much of them has been paid. */
export function getBookingPaymentSegments(bookings: RevenueReport["bookings"]) {
  return withRemainder(
    [
      {
        key: "fully_paid",
        label: "Fully paid",
        value: bookings.fully_paid,
        className: "bg-emerald-600",
      },
      {
        key: "deposit_only",
        label: "Deposit only",
        value: bookings.deposit_only,
        className: "bg-brand-azure dark:bg-sky-600",
      },
      {
        key: "unpaid",
        label: "Unpaid",
        value: bookings.unpaid,
        className: "bg-rose-600",
      },
    ],
    bookings.total
  )
}

/** "1 payment" / "26 payments". */
export function formatPaymentCount(count: number) {
  return `${formatCount(count)} ${count === 1 ? "payment" : "payments"}`
}

/** The payments report's headline cards: everything, then each status. */
export function getPaymentsReportStatCards(
  summary: PaymentsReport["summary"]
): ReportStatCard[] {
  return [
    {
      key: "total",
      title: "All payments",
      text: formatCurrency(summary.total_amount),
      label: formatPaymentCount(summary.total_payments),
      titleClassName: "text-brand-navy dark:text-sky-200",
    },
    {
      key: "verified",
      title: "Verified",
      text: formatCurrency(summary.verified.amount),
      label: formatPaymentCount(summary.verified.count),
      titleClassName: "text-emerald-700 dark:text-emerald-300",
    },
    {
      key: "pending",
      title: "Pending",
      text: formatCurrency(summary.pending.amount),
      label: formatPaymentCount(summary.pending.count),
      titleClassName: "text-amber-700 dark:text-amber-300",
    },
    {
      key: "rejected",
      title: "Rejected",
      text: formatCurrency(summary.rejected.amount),
      label: formatPaymentCount(summary.rejected.count),
      titleClassName: "text-rose-700 dark:text-rose-300",
    },
  ]
}

/** Amount per method (M-Pesa, cash, then any other method as "Other"). */
export function getPaymentsByMethodSegments(report: PaymentsReport) {
  const { mpesa, cash } = report.by_method
  return withRemainder(
    [
      {
        key: "mpesa",
        label: "M-Pesa",
        value: mpesa.amount,
        detail: formatPaymentCount(mpesa.count),
        className: "bg-brand-azure dark:bg-sky-600",
      },
      {
        key: "cash",
        label: "Cash",
        value: cash.amount,
        detail: formatPaymentCount(cash.count),
        className: "bg-amber-600",
      },
    ],
    report.summary.total_amount
  )
}

/** Amount per status: verified, pending, rejected. */
export function getPaymentsByStatusSegments(
  summary: PaymentsReport["summary"]
) {
  return withRemainder(
    [
      {
        key: "verified",
        label: "Verified",
        value: summary.verified.amount,
        detail: formatPaymentCount(summary.verified.count),
        className: "bg-emerald-600",
      },
      {
        key: "pending",
        label: "Pending",
        value: summary.pending.amount,
        detail: formatPaymentCount(summary.pending.count),
        className: "bg-amber-600",
      },
      {
        key: "rejected",
        label: "Rejected",
        value: summary.rejected.amount,
        detail: formatPaymentCount(summary.rejected.count),
        className: "bg-rose-600",
      },
    ],
    summary.total_amount
  )
}

/** Case-insensitive match on booking reference or transaction reference. */
export function matchesPaymentsReportSearch(
  payment: PaymentsReportPayment,
  search: string
) {
  const term = search.trim().toLowerCase()
  if (!term) return true
  return [payment.booking_ref, payment.reference].some((value) =>
    value?.toLowerCase().includes(term)
  )
}

/** The guests report's headline cards. */
export function getGuestsReportStatCards(
  summary: GuestsReport["summary"]
): ReportStatCard[] {
  return [
    {
      key: "total",
      title: "Total guests",
      text: formatCount(summary.total_guests),
      label: "on record",
      titleClassName: "text-brand-navy dark:text-sky-200",
    },
    {
      key: "new",
      title: "New guests",
      text: formatCount(summary.new_guests_in_period),
      label: "added in this period",
      titleClassName: "text-brand-azure dark:text-sky-300",
    },
    {
      key: "returning",
      title: "Returning",
      text: formatCount(summary.returning_guests),
      label: "stayed more than once",
      titleClassName: "text-violet-700 dark:text-violet-300",
    },
    {
      key: "blacklisted",
      title: "Blacklisted",
      text: formatCount(summary.blacklisted),
      label: "barred from booking",
      titleClassName: "text-rose-700 dark:text-rose-300",
    },
    {
      key: "revenue",
      title: "Revenue",
      text: formatCurrency(summary.total_revenue_from_guests),
      label: "spent by these guests",
      titleClassName: "text-emerald-700 dark:text-emerald-300",
    },
  ]
}

/** The guest lists in the report, one tab each, in display order. */
export const GUESTS_REPORT_LISTS = [
  {
    key: "new_guests",
    label: "New guests",
    emptyMessage: "No new guests in this period.",
  },
  {
    key: "top_returning_guests",
    label: "Top returning",
    emptyMessage: "No returning guests in this period.",
  },
  {
    key: "blacklisted_guests",
    label: "Blacklisted",
    emptyMessage: "No guests are blacklisted.",
  },
] as const satisfies readonly {
  key: keyof GuestsReport
  label: string
  emptyMessage: string
}[]

export type GuestsReportListKey = (typeof GUESTS_REPORT_LISTS)[number]["key"]

/** Case-insensitive match on the guest's name, email or phone. */
export function matchesGuestSearch(guest: Guest, search: string) {
  const term = search.trim().toLowerCase()
  if (!term) return true
  return [guest.full_name, guest.email, guest.phone].some((value) =>
    value?.toLowerCase().includes(term)
  )
}

/** "1 booking" / "3 bookings". */
export function formatBookingCount(count: number) {
  return `${formatCount(count)} ${count === 1 ? "booking" : "bookings"}`
}

/** The cancellations report's headline cards. */
export function getCancellationsReportStatCards(
  summary: CancellationsReport["summary"]
): ReportStatCard[] {
  return [
    {
      key: "total",
      title: "Cancellations",
      text: formatCount(summary.total_cancellations),
      label: "bookings cancelled",
      titleClassName: "text-brand-navy dark:text-sky-200",
    },
    {
      key: "fees",
      title: "Fees collected",
      text: formatCurrency(summary.cancellation_fees_collected),
      label: "cancellation fees kept",
      titleClassName: "text-emerald-700 dark:text-emerald-300",
    },
    {
      key: "refunds",
      title: "Refunds issued",
      text: formatCurrency(summary.refunds_issued),
      label: "paid back to guests",
      titleClassName: "text-amber-700 dark:text-amber-300",
    },
    {
      key: "lost",
      title: "Revenue lost",
      text: formatCurrency(summary.revenue_lost_unpaid),
      label: "unpaid bookings cancelled",
      titleClassName: "text-rose-700 dark:text-rose-300",
    },
  ]
}

/** Cancellations by who made them: staff, or the system's auto-cancel. */
export function getCancelledBySegments(
  summary: CancellationsReport["summary"]
) {
  return withRemainder(
    [
      {
        key: "staff",
        label: "Staff",
        value: summary.staff_cancelled,
        className: "bg-brand-azure dark:bg-sky-600",
      },
      {
        key: "system",
        label: "System (auto-cancelled)",
        value: summary.system_auto_cancelled,
        className: "bg-violet-600",
      },
    ],
    summary.total_cancellations
  )
}

/** Cancellations by whether the booking had been paid when cancelled. */
export function getPaidAtCancellationSegments(
  summary: CancellationsReport["summary"]
) {
  return withRemainder(
    [
      {
        key: "paid",
        label: "Paid",
        value: summary.paid_at_cancellation,
        className: "bg-emerald-600",
      },
      {
        key: "unpaid",
        label: "Unpaid",
        value: summary.unpaid_at_cancellation,
        className: "bg-red-600",
      },
    ],
    summary.total_cancellations
  )
}

/**
 * The meal plan report's headline cards. Meal revenue is in KES; booking
 * value is split by currency, and the other currency's card is dropped
 * when the report is filtered to one.
 */
export function getMealPlanReportStatCards(
  summary: MealPlanReport["summary"],
  currency: string
): ReportStatCard[] {
  const cards: (ReportStatCard & { currency?: string })[] = [
    {
      key: "bookings",
      title: "Bookings",
      text: formatStat(summary.total_bookings, formatCount),
      label: "in this report",
      titleClassName: "text-brand-navy dark:text-sky-200",
    },
    {
      key: "guests",
      title: "Guests",
      text: formatStat(summary.total_guests, formatCount),
      label: "adults and children",
      titleClassName: "text-violet-700 dark:text-violet-300",
    },
    {
      key: "meal_revenue",
      title: "Meal revenue",
      text: formatStat(summary.total_meal_plan_revenue, formatCurrency),
      label: "from meal plans, on top of the room",
      titleClassName: "text-amber-700 dark:text-amber-300",
    },
    {
      key: "average",
      title: "Average",
      text: formatStat(summary.avg_meal_revenue_per_booking, formatCurrency),
      label: "meal revenue per meal plan booking",
      titleClassName: "text-brand-azure dark:text-sky-300",
    },
    {
      key: "revenue_kes",
      title: "Resident revenue",
      text: formatStat(summary.total_revenue_kes, formatCurrency),
      label: "booking value in KES",
      titleClassName: "text-emerald-700 dark:text-emerald-300",
      currency: "KES",
    },
    {
      key: "revenue_usd",
      title: "Non-resident revenue",
      text: formatStat(summary.total_revenue_usd, formatCurrencyUsd),
      label: "booking value in USD",
      titleClassName: "text-teal-700 dark:text-teal-300",
      currency: "USD",
    },
  ]
  return cards.filter(
    (card) => !currency || !card.currency || card.currency === currency
  )
}

/**
 * Bar fill per meal plan, in `MEAL_PLANS` order. Checked with the dataviz
 * palette validator in both modes (adjacent pairs pass; amber ↔ emerald is
 * in the CVD floor band, fine since the legend labels every segment).
 */
const MEAL_PLAN_FILLS: Record<string, string> = {
  room_only: "bg-brand-azure dark:bg-sky-600",
  bed_and_breakfast: "bg-amber-600",
  half_board: "bg-violet-600",
  full_board: "bg-emerald-600",
}

/**
 * A `by_plan` / `revenue_by_plan` record as bar segments in `MEAL_PLANS`
 * order; a plan the API adds later goes last, in grey. `exclude` drops
 * plans that don't belong in the breakdown (Bed Only has no meal revenue).
 */
export function getMealPlanSegments(
  byPlan: Record<string, number> | undefined,
  exclude: readonly string[] = []
): ShareSegment[] {
  return getMealPlanBreakdown(byPlan)
    .filter(([plan]) => !exclude.includes(plan))
    .map(([plan, value]) => ({
      key: plan,
      label: getMealPlanLabel(plan),
      value,
      className: MEAL_PLAN_FILLS[plan] ?? OTHER_FILL,
    }))
}
