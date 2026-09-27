import { useMemo, useState } from "react"

/** Rows per page for every paginated table. */
export const PAGE_SIZE = 10

/**
 * Client-side pagination over an already-filtered list. The page is
 * clamped to the last one, so a list that shrinks (a delete, a narrower
 * filter) never strands the user on an empty page. Callers should still
 * `setPage(1)` when a filter changes so results start from the top.
 */
export function usePagination<T>(items: readonly T[], pageSize = PAGE_SIZE) {
  const [page, setPage] = useState(1)

  const total = items.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(page, pageCount)

  const pageItems = useMemo(
    () => items.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [items, currentPage, pageSize]
  )

  return { page: currentPage, pageCount, pageSize, total, pageItems, setPage }
}
