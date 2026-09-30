import { keepPreviousData, useQuery } from "@tanstack/react-query"
import {
  bookingsReportQueryKey,
  fetchBookingsReport,
  type BookingsReportFilters,
} from "@/lib/api/reports"

/**
 * `GET /motel/reports/bookings` for the given filters. The summary and the
 * table both call this and TanStack dedupes the request.
 */
export function useBookingsReport(filters: BookingsReportFilters) {
  return useQuery({
    queryKey: bookingsReportQueryKey(filters),
    queryFn: () => fetchBookingsReport(filters),
    // Changing the filters dims the old report instead of blanking it.
    placeholderData: keepPreviousData,
  })
}
