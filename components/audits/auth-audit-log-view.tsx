"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import {
  AuditLogHeader,
  AuditLogTable,
  EmptyCell,
} from "@/components/audits/audit-log-table"
import { AuthAuditFilterBar } from "@/components/audits/auth-audit-filters"
import { ExportAuthAuditDialog } from "@/components/audits/export-auth-audit-dialog"
import { useOffsetPagination } from "@/hooks/use-offset-pagination"
import {
  authAuditLogQueryKey,
  fetchAuthAuditLog,
  type AuthAuditFilters,
} from "@/lib/api/audit"
import { fetchUsers, usersListQueryKey } from "@/lib/api/users"
import { getAuditLogHref } from "@/lib/audit"
import { humanizeSlug } from "@/lib/format"
import type { AuditLogEntry, AuthUser } from "@/lib/types"

const ALL_USERS = { role: "" } as const

/**
 * `/audits/auth`: the applied filters (username, action) live in the URL,
 * so a filtered log survives a reload and can be shared; the filter bar
 * only sends them on Apply. Unlike the other tables this one is
 * paginated by the backend (`limit` / `offset`), one page per request.
 */
export function AuthAuditLogView({ filters }: { filters: AuthAuditFilters }) {
  const router = useRouter()
  const filtersKey = JSON.stringify(filters)
  const { page, setPage, pageSize, limit, offset } =
    useOffsetPagination(filtersKey)

  const log = useQuery({
    queryKey: authAuditLogQueryKey({ ...filters, limit, offset }),
    queryFn: () => fetchAuthAuditLog({ ...filters, limit, offset }),
    // New events land all the time, so every visit fetches afresh.
    staleTime: 0,
    // Paging or filtering dims the old rows instead of blanking the table.
    placeholderData: keepPreviousData,
  })

  const total = log.data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  // The log can shrink under us (e.g. old entries pruned); don't strand
  // the user on a page past the end.
  if (log.isSuccess && !log.isPlaceholderData && page > pageCount) {
    setPage(pageCount)
  }

  // Resolves the target of user-management events to a name. Deleted
  // accounts aren't in the list, so those fall back to the id.
  const users = useQuery({
    queryKey: usersListQueryKey(ALL_USERS),
    queryFn: () => fetchUsers(ALL_USERS),
  })
  const usersById = useMemo(
    () => new Map(users.data?.map((user) => [user.user_id, user])),
    [users.data]
  )

  function handleApply(next: AuthAuditFilters) {
    // Re-applying the same filters wouldn't change the URL; fetch instead.
    if (JSON.stringify(next) === filtersKey) {
      void log.refetch()
      return
    }
    router.replace(getAuditLogHref("auth", next), { scroll: false })
  }

  const isFiltered = Boolean(filters.username || filters.action)

  return (
    <section className="grid gap-6">
      <AuditLogHeader
        title="Authentication audit log"
        description="Sign-ins and user management events from the auth service, newest first."
        action={<ExportAuthAuditDialog filters={filters} />}
      />

      {/* Remounted when the applied filters change, so the draft follows. */}
      <AuthAuditFilterBar
        key={filtersKey}
        applied={filters}
        onApply={handleApply}
      />

      <AuditLogTable
        entries={log.data?.entries}
        status={log.status}
        error={log.error}
        onRetry={() => log.refetch()}
        isPlaceholderData={log.isPlaceholderData}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        emptyMessage={
          isFiltered
            ? "No authentication events match these filters."
            : "No authentication events have been logged yet."
        }
        renderTarget={(entry) => (
          <AuthAuditTarget
            entry={entry}
            target={
              entry.entity_id ? usersById.get(entry.entity_id) : undefined
            }
          />
        )}
      />
    </section>
  )
}

/**
 * What the action touched: "Own account" when users act on themselves (every
 * sign-in), the account's name when it still exists, else the raw id.
 */
function AuthAuditTarget({
  entry,
  target,
}: {
  entry: AuditLogEntry
  /** The account `entity_id` points at, when it still exists. */
  target: AuthUser | undefined
}) {
  if (!entry.entity_id) return <EmptyCell />
  if (entry.entity_type === "user" && entry.entity_id === entry.user_id) {
    return <span className="text-muted-foreground">Own account</span>
  }
  if (entry.entity_type === "user" && target) {
    return (
      <span className="font-medium text-foreground">{target.username}</span>
    )
  }
  return (
    <span title={entry.entity_id} className="text-muted-foreground">
      {humanizeSlug(entry.entity_type ?? "record")}{" "}
      <span className="font-mono">{entry.entity_id.slice(0, 8)}</span>
    </span>
  )
}
