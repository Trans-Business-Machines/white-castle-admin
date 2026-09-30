import { keepPreviousData, useQuery } from "@tanstack/react-query"
import {
  fetchGuestsReport,
  guestsReportQueryKey,
  type ReportDateRange,
} from "@/lib/api/reports"

/**
 * `GET /motel/reports/guests` for the period. The summary and the lists
 * both call this and TanStack dedupes the request.
 */
export function useGuestsReport(range: ReportDateRange) {
  return useQuery({
    queryKey: guestsReportQueryKey(range),
    queryFn: () => fetchGuestsReport(range),
    // A new period dims the old report instead of blanking it.
    placeholderData: keepPreviousData,
  })
}
