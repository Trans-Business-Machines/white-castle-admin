import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { bbListQueryKey, fetchBbList } from "@/lib/api/bookings"

/**
 * The bed and breakfast list for a "yyyy-MM-dd" day. The cards and the
 * table both call this and TanStack dedupes the request. Picking another
 * day keeps the previous list on screen (dimmed) until the new one lands.
 */
export function useBbList(date: string) {
  return useQuery({
    queryKey: bbListQueryKey(date),
    queryFn: () => fetchBbList(date),
    placeholderData: keepPreviousData,
  })
}
