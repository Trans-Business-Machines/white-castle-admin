import { axiosInstance } from "@/lib/axios"
import { downloadCsv } from "@/lib/api/files"
import type {
  BookingsReport,
  CancellationsReport,
  DashboardReport,
  GuestsReport,
  MealPlanReport,
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
  /** "KES" (residents), "USD" (non-residents) or "" for both. */
  currency: string
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

/** GET /motel/reports/bookings/export: the same params as the report, as a CSV file. */
export function exportBookingsReport(filters: BookingsReportFilters) {
  return downloadCsv(
    "/motel/reports/bookings/export",
    filters,
    "bookings-report"
  )
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

/** GET /motel/reports/revenue/export: the same params as the report, as a CSV file. */
export function exportRevenueReport(range: ReportDateRange) {
  return downloadCsv("/motel/reports/revenue/export", range, "revenue-report")
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

/** GET /motel/reports/payments/export: the same params as the report, as a CSV file. */
export function exportPaymentsReport(filters: PaymentsReportFilters) {
  return downloadCsv(
    "/motel/reports/payments/export",
    filters,
    "payments-report"
  )
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

/** GET /motel/reports/guests/export: the same params as the report, as a CSV file. */
export function exportGuestsReport(range: ReportDateRange) {
  return downloadCsv("/motel/reports/guests/export", range, "guests-report")
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

/** GET /motel/reports/cancellations/export: the same params as the report, as a CSV file. */
export function exportCancellationsReport(range: ReportDateRange) {
  return downloadCsv(
    "/motel/reports/cancellations/export",
    range,
    "cancellations-report"
  )
}

/** Query params of `GET /motel/reports/meal-plan-report`; "" means "not filtered". */
export interface MealPlanReportFilters extends ReportDateRange {
  meal_plan: string
  /** Booking status. */
  status: string
  /** "KES" (residents), "USD" (non-residents) or "" for both. */
  currency: string
}

export function mealPlanReportQueryKey(filters: MealPlanReportFilters) {
  return ["reports", "meal-plans", filters] as const
}

/** GET /motel/reports/meal-plan-report, sending only the filters that are set. */
export async function fetchMealPlanReport(filters: MealPlanReportFilters) {
  const response = await axiosInstance.get<MealPlanReport>(
    "/motel/reports/meal-plan-report",
    { params: toReportParams(filters) }
  )
  return response.data
}

/** GET /motel/reports/meal-plan-report/export: the same params as the report, as a CSV file. */
export function exportMealPlanReport(filters: MealPlanReportFilters) {
  return downloadCsv(
    "/motel/reports/meal-plan-report/export",
    filters,
    "meal-plan-report"
  )
}
