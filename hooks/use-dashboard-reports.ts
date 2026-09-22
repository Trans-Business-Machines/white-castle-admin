import { keepPreviousData, useQuery } from "@tanstack/react-query"
import {
  fetchOccupancyReport,
  fetchRevenueReport,
  occupancyReportQueryKey,
  revenueReportQueryKey,
  type ReportRange,
} from "@/lib/api/reports"

/**
 * The two report queries every dashboard section reads from. Components call
 * this independently and TanStack dedupes by key, so no prop drilling. A
 * date change keeps the previous figures on screen (dimmed) until the new
 * ones land instead of collapsing everything to skeletons.
 */
export function useDashboardReports(range: ReportRange) {
  const occupancy = useQuery({
    queryKey: occupancyReportQueryKey(range),
    queryFn: () => fetchOccupancyReport(range),
    placeholderData: keepPreviousData,
  })
  const revenue = useQuery({
    queryKey: revenueReportQueryKey(range),
    queryFn: () => fetchRevenueReport(range),
    placeholderData: keepPreviousData,
  })
  return { occupancy, revenue }
}
