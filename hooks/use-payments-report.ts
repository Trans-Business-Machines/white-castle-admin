import { keepPreviousData, useQuery } from "@tanstack/react-query"
import {
  fetchPaymentsReport,
  paymentsReportQueryKey,
  type PaymentsReportFilters,
} from "@/lib/api/reports"

/**
 * `GET /motel/reports/payments` for the given filters. The summary and the
 * table both call this and TanStack dedupes the request.
 */
export function usePaymentsReport(filters: PaymentsReportFilters) {
  return useQuery({
    queryKey: paymentsReportQueryKey(filters),
    queryFn: () => fetchPaymentsReport(filters),
    // Changing the filters dims the old report instead of blanking it.
    placeholderData: keepPreviousData,
  })
}
