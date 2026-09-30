import { useState } from "react"
import { PAGE_SIZE } from "@/hooks/use-pagination"

/**
 * Page state for a table the backend paginates with `limit` / `offset`
 * (unlike `usePagination`, which pages a list already in memory). Goes back
 * to page 1 whenever `resetKey`, e.g. the serialised filters, changes.
 */
export function useOffsetPagination(resetKey: string, pageSize = PAGE_SIZE) {
  const [page, setPage] = useState(1)
  const [pagedKey, setPagedKey] = useState(resetKey)

  // Render-time reset: new filters arrive as props (from the URL), so there's
  // no change handler to call `setPage(1)` from.
  let currentPage = page
  if (pagedKey !== resetKey) {
    setPagedKey(resetKey)
    setPage(1)
    currentPage = 1
  }

  return {
    page: currentPage,
    setPage,
    pageSize,
    limit: pageSize,
    offset: (currentPage - 1) * pageSize,
  }
}
