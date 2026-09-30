"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import {
  AuditLogHeader,
  AuditLogTable,
  EmptyCell,
} from "@/components/audits/audit-log-table"
import { ExportServicesAuditDialog } from "@/components/audits/export-services-audit-dialog"
import { ServicesAuditFilterBar } from "@/components/audits/services-audit-filters"
import { getBookingHref } from "@/components/bookings/booking-actions-menu"
import { getGuestHref } from "@/components/guests/guest-actions-menu"
import { getUnitHref } from "@/components/units/unit-actions-menu"
import { useOffsetPagination } from "@/hooks/use-offset-pagination"
import {
  fetchServicesAuditLog,
  servicesAuditLogQueryKey,
  type ServicesAuditFilters,
} from "@/lib/api/audit"
import {
  getAuditLogHref,
  getAuditServiceLabel,
  parseAuditDetails,
} from "@/lib/audit"
import { humanizeSlug } from "@/lib/format"
import type { AuditLogEntry } from "@/lib/types"

/**
 * `/audits/services`: bookings, payments, guests and motel events. The
 * applied filters live in the URL (the filter bar only sends them on Apply),
 * and the backend paginates with `limit` / `offset`.
 */
export function ServicesAuditLogView({
  filters,
}: {
  filters: ServicesAuditFilters
}) {
  const router = useRouter()
  const filtersKey = JSON.stringify(filters)
  const { page, setPage, pageSize, limit, offset } =
    useOffsetPagination(filtersKey)

  const log = useQuery({
    queryKey: servicesAuditLogQueryKey({ ...filters, limit, offset }),
    queryFn: () => fetchServicesAuditLog({ ...filters, limit, offset }),
    // New events land all the time, so every visit fetches afresh.
    staleTime: 0,
    // Paging or filtering dims the old rows instead of blanking the table.
    placeholderData: keepPreviousData,
  })

  const total = log.data?.pagination.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  // Don't strand the user on a page past the end if the log shrinks.
  if (log.isSuccess && !log.isPlaceholderData && page > pageCount) {
    setPage(pageCount)
  }

  function handleApply(next: ServicesAuditFilters) {
    // Re-applying the same filters wouldn't change the URL; fetch instead.
    if (JSON.stringify(next) === filtersKey) {
      void log.refetch()
      return
    }
    router.replace(getAuditLogHref("services", next), { scroll: false })
  }

  const service = getAuditServiceLabel(filters.service).toLowerCase()

  return (
    <section className="grid gap-6">
      <AuditLogHeader
        title="Cross-service audit log"
        description="Bookings, payments, guests and motel events, newest first."
        action={<ExportServicesAuditDialog filters={filters} />}
      />

      {/* Remounted when the applied filters change, so the draft follows. */}
      <ServicesAuditFilterBar
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
        emptyMessage={`No ${service} events match these filters.`}
        renderTarget={(entry) => <ServiceAuditTarget entry={entry} />}
      />
    </section>
  )
}

/** Record pages an audit target can link to, by `entity_type`. */
const ENTITY_HREFS: Record<string, (id: string) => string> = {
  booking: getBookingHref,
  guest: getGuestHref,
  room: getUnitHref,
}

/** `details` fields that name the record better than its id, in order. */
const DETAIL_NAME_KEYS = [
  "reference",
  "booking_ref",
  "guest_name",
  "full_name",
  "room_number",
  "key",
]

/**
 * What the action touched: its type, then a name from `details` (a booking
 * reference, a guest's name…) or a short id, linked to the record's page
 * when there is one and it hasn't been deleted.
 */
function ServiceAuditTarget({ entry }: { entry: AuditLogEntry }) {
  if (!entry.entity_id) return <EmptyCell />

  const type = entry.entity_type ?? "record"
  const details = parseAuditDetails(entry.details)
  const name = DETAIL_NAME_KEYS.map((key) => details?.[key]).find(
    (value) =>
      (typeof value === "string" && value !== "") || typeof value === "number"
  )
  const label = name === undefined ? entry.entity_id.slice(0, 8) : String(name)
  const toHref = entry.action.endsWith("_DELETED")
    ? undefined
    : ENTITY_HREFS[type]

  return (
    <span
      title={entry.entity_id}
      className="inline-flex items-baseline gap-1.5 whitespace-nowrap"
    >
      <span className="text-muted-foreground">{humanizeSlug(type)}</span>
      {toHref ? (
        <Link
          href={toHref(entry.entity_id)}
          className="font-mono font-semibold text-foreground underline-offset-4 hover:text-brand-azure hover:underline"
        >
          {label}
        </Link>
      ) : (
        <span className="font-mono text-foreground">{label}</span>
      )}
    </span>
  )
}
