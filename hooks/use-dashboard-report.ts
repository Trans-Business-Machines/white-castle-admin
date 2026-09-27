import { useQuery } from "@tanstack/react-query"
import {
  dashboardReportQueryKey,
  fetchDashboardReport,
} from "@/lib/api/reports"

/**
 * The one report every dashboard section reads from. Sections call this
 * independently and TanStack dedupes by key, so nothing is prop-drilled.
 * `staleTime: 0` refetches on every visit: bookings and payments change on
 * other pages, and their mutations don't invalidate this key.
 */
export function useDashboardReport() {
  return useQuery({
    queryKey: dashboardReportQueryKey,
    queryFn: fetchDashboardReport,
    staleTime: 0,
  })
}
