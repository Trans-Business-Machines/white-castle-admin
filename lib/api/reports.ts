import { axiosInstance } from "@/lib/axios"
import type { OccupancyRange } from "@/lib/api/bookings"
import type { BookingsOccupancyStats, RevenueReport } from "@/lib/types"

/** Inclusive "yyyy-MM-dd" bounds both reports take. */
export type ReportRange = OccupancyRange

export const reportsQueryKey = ["reports"] as const
export const occupancyReportQueryKey = (range: ReportRange) =>
  ["reports", "occupancy", range.from_date, range.to_date] as const
export const revenueReportQueryKey = (range: ReportRange) =>
  ["reports", "revenue", range.from_date, range.to_date] as const

/** GET /motel/reports/occupancy → rooms, bookings, revenue and occupancy for a range. */
export async function fetchOccupancyReport(range: ReportRange) {
  const response = await axiosInstance.get<BookingsOccupancyStats>(
    "/motel/reports/occupancy",
    { params: range }
  )
  return response.data
}

/** GET /motel/reports/revenue → expected revenue and payment mix for a range. */
export async function fetchRevenueReport(range: ReportRange) {
  const response = await axiosInstance.get<RevenueReport>(
    "/motel/reports/revenue",
    { params: range }
  )
  return response.data
}
