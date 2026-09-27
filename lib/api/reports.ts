import { axiosInstance } from "@/lib/axios"
import type { DashboardReport } from "@/lib/types"

export const reportsQueryKey = ["reports"] as const
export const dashboardReportQueryKey = ["reports", "dashboard"] as const

/** GET /motel/reports/dashboard → today's counts, week/month totals and pending bookings. */
export async function fetchDashboardReport() {
  const response = await axiosInstance.get<DashboardReport>(
    "/motel/reports/dashboard"
  )
  return response.data
}
