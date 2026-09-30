import { keepPreviousData, useQuery } from "@tanstack/react-query"
import {
  fetchRevenueReport,
  revenueReportQueryKey,
  type ReportDateRange,
} from "@/lib/api/reports"

/** `GET /motel/reports/revenue` for the period; a new period dims the old one. */
export function useRevenueReport(range: ReportDateRange) {
  return useQuery({
    queryKey: revenueReportQueryKey(range),
    queryFn: () => fetchRevenueReport(range),
    placeholderData: keepPreviousData,
  })
}
