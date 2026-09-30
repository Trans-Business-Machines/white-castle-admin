import { axiosInstance } from "@/lib/axios"
import type {
  BbSummaryReport,
  BookingsReport,
  CancellationsReport,
  DashboardReport,
  GuestsReport,
  PaymentsReport,
  RevenueReport,
} from "@/lib/types"

export const reportsQueryKey = ["reports"] as const
export const dashboardReportQueryKey = ["reports", "dashboard"] as const

/** GET /motel/reports/dashboard → today's counts, week/month totals and pending bookings. */
export async function fetchDashboardReport() {
  const response = await axiosInstance.get<DashboardReport>(
    "/motel/reports/dashboard"
  )
  return response.data
}

/** The period every report takes: "yyyy-MM-dd", or "" for open-ended. */
export interface ReportDateRange {
  from_date: string
  to_date: string
}

/** Drops the filters that are "" so they aren't sent at all. */
function toReportParams(filters: object) {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== "")
  )
}

/** Query params of `GET /motel/reports/bookings`; "" means "not filtered". */
export interface BookingsReportFilters extends ReportDateRange {
  status: string
  room_type: string
  meal_plan: string
}

export function bookingsReportQueryKey(filters: BookingsReportFilters) {
  return ["reports", "bookings", filters] as const
}

/** GET /motel/reports/bookings, sending only the filters that are set. */
export async function fetchBookingsReport(filters: BookingsReportFilters) {
  const response = await axiosInstance.get<BookingsReport>(
    "/motel/reports/bookings",
    { params: toReportParams(filters) }
  )
  return response.data
}

export function revenueReportQueryKey(range: ReportDateRange) {
  return ["reports", "revenue", range] as const
}

/** GET /motel/reports/revenue for the period (open ends left out). */
export async function fetchRevenueReport(range: ReportDateRange) {
  const response = await axiosInstance.get<RevenueReport>(
    "/motel/reports/revenue",
    { params: toReportParams(range) }
  )
  return response.data
}

/** Query params of `GET /motel/reports/payments`; "" means "not filtered". */
export interface PaymentsReportFilters extends ReportDateRange {
  status: string
  method: string
}

export function paymentsReportQueryKey(filters: PaymentsReportFilters) {
  return ["reports", "payments", filters] as const
}

/** GET /motel/reports/payments; an empty status means every status. */
export async function fetchPaymentsReport(filters: PaymentsReportFilters) {
  const response = await axiosInstance.get<PaymentsReport>(
    "/motel/reports/payments",
    { params: toReportParams(filters) }
  )
  return response.data
}

export function guestsReportQueryKey(range: ReportDateRange) {
  return ["reports", "guests", range] as const
}

/** GET /motel/reports/guests for the period (open ends left out). */
export async function fetchGuestsReport(range: ReportDateRange) {
  const response = await axiosInstance.get<GuestsReport>(
    "/motel/reports/guests",
    { params: toReportParams(range) }
  )
  return response.data
}

export function cancellationsReportQueryKey(range: ReportDateRange) {
  return ["reports", "cancellations", range] as const
}

/** GET /motel/reports/cancellations for the period (open ends left out). */
export async function fetchCancellationsReport(range: ReportDateRange) {
  const response = await axiosInstance.get<CancellationsReport>(
    "/motel/reports/cancellations",
    { params: toReportParams(range) }
  )
  return response.data
}

/** Query params of `GET /motel/reports/bb-summary`; "" means "not sent". */
export interface BbSummaryReportFilters extends ReportDateRange {
  /** Day of the breakfast list, "yyyy-MM-dd"; the API defaults to today. */
  target_date: string
}

export function bbSummaryReportQueryKey(filters: BbSummaryReportFilters) {
  return ["reports", "bb-summary", filters] as const
}

/** GET /motel/reports/bb-summary, sending only the params that are set. */
export async function fetchBbSummaryReport(filters: BbSummaryReportFilters) {
  const response = await axiosInstance.get<BbSummaryReport>(
    "/motel/reports/bb-summary",
    { params: toReportParams(filters) }
  )
  return response.data
}
