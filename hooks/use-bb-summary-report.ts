import { keepPreviousData, useQuery } from "@tanstack/react-query"
import {
  bbSummaryReportQueryKey,
  fetchBbSummaryReport,
  type BbSummaryReportFilters,
} from "@/lib/api/reports"

/**
 * `GET /motel/reports/bb-summary` for the given filters. The summary and
 * the tables all call this and TanStack dedupes the request.
 */
export function useBbSummaryReport(filters: BbSummaryReportFilters) {
  return useQuery({
    queryKey: bbSummaryReportQueryKey(filters),
    queryFn: () => fetchBbSummaryReport(filters),
    // Changing the filters dims the old report instead of blanking it.
    placeholderData: keepPreviousData,
  })
}
