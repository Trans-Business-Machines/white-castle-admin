import { keepPreviousData, useQuery } from "@tanstack/react-query"
import {
  fetchCancellationsReport,
  cancellationsReportQueryKey,
  type ReportDateRange,
} from "@/lib/api/reports"

/**
 * `GET /motel/reports/cancellations` for the period. The summary and the table
 * both call this and TanStack dedupes the request.
 */
export function useCancellationsReport(range: ReportDateRange) {
  return useQuery({
    queryKey: cancellationsReportQueryKey(range),
    queryFn: () => fetchCancellationsReport(range),
    // A new period dims the old report instead of blanking it.
    placeholderData: keepPreviousData,
  })
}
