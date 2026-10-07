"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { cn } from "cn"
import { getBookingHref } from "@/components/bookings/booking-actions-menu"
import {
  BookingStatusBadge,
  PaymentStatusBadge,
} from "@/components/bookings/booking-status-badge"
import {
  ReportError,
  StatCardSkeleton,
} from "@/components/dashboard/report-state"
import { BookingsReportDialog } from "@/components/reports/bookings-report-dialog"
import {
  ChangeFiltersButton,
  ReportHeader,
} from "@/components/reports/report-header"
import { StatCard } from "@/components/stat-card"
import { TablePagination } from "@/components/table-pagination"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  TableError,
  TableMessageRow,
  TableSkeletonRows,
  tableHeadClassName,
} from "@/components/users/table-state"
import { SearchInput } from "@/components/users/table-toolbar"
import { usePagination } from "@/hooks/use-pagination"
import { getApiErrorMessage } from "@/lib/api/errors"
import { useBookingsReport } from "@/hooks/use-bookings-report"
import type { BookingsReportFilters } from "@/lib/api/reports"
import { getMealPlanLabel } from "@/lib/bookings"
import { formatAmount, formatTimestamp, humanizeSlug } from "@/lib/format"
import {
  BOOKINGS_REPORT_STAT_CARDS,
  getStatusBreakdown,
  matchesBookingsReportSearch,
} from "@/lib/reports"
import { getRoomTypeLabel } from "@/lib/units"

const COLUMNS = 7

const statGridClassName =
  "grid grid-cols-[repeat(auto-fit,minmax(min(13rem,100%),1fr))] gap-4"

const surfaceClassName =
  "overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-foreground/10"

/**
 * `/reports/bookings`: the filters come from the URL (set by
 * `BookingsReportDialog`), so the report survives a reload and can be
 * shared as a link.
 */
export function BookingsReportView({
  filters,
}: {
  filters: BookingsReportFilters
}) {
  const report = useBookingsReport(filters)

  return (
    <section className="grid gap-6">
      <BookingsReportHeader filters={filters} />

      {report.isPending ? (
        <div className={statGridClassName}>
          {BOOKINGS_REPORT_STAT_CARDS.map((card) => (
            <StatCardSkeleton key={card.key} />
          ))}
        </div>
      ) : report.isError ? (
        <ReportError
          message={getApiErrorMessage(
            report.error,
            "We couldn't generate the bookings report."
          )}
          onRetry={() => report.refetch()}
        />
      ) : (
        <div
          className={cn(
            "grid gap-4 transition-opacity",
            report.isPlaceholderData && "opacity-60"
          )}
        >
          <div className={statGridClassName}>
            {BOOKINGS_REPORT_STAT_CARDS.map((card) => (
              <StatCard
                key={card.key}
                title={card.title}
                titleClassName={card.titleClassName}
                text={card.format(report.data.summary[card.key])}
                label={card.label}
              />
            ))}
          </div>
          <StatusBreakdown byStatus={report.data.summary.by_status} />
        </div>
      )}

      <BookingsReportTable filters={filters} />
    </section>
  )
}

function BookingsReportHeader({ filters }: { filters: BookingsReportFilters }) {
  const chips = [
    filters.status && `Status: ${humanizeSlug(filters.status)}`,
    filters.room_type && `Room: ${getRoomTypeLabel(filters.room_type)}`,
    filters.meal_plan && `Meal plan: ${getMealPlanLabel(filters.meal_plan)}`,
  ].filter((chip) => chip !== "")

  return (
    <ReportHeader
      title="Bookings report"
      from={filters.from_date}
      to={filters.to_date}
      chips={chips}
      action={
        <BookingsReportDialog initialFilters={filters}>
          <ChangeFiltersButton />
        </BookingsReportDialog>
      }
    />
  )
}

function StatusBreakdown({ byStatus }: { byStatus: Record<string, number> }) {
  const rows = getStatusBreakdown(byStatus)
  if (rows.length === 0) return null

  return (
    <div
      className={cn(
        surfaceClassName,
        "flex flex-wrap items-center gap-x-5 gap-y-3 px-5 py-4"
      )}
    >
      <h3 className="font-heading text-xs font-bold tracking-wide text-iron uppercase">
        By status
      </h3>
      <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {rows.map(([status, count]) => (
          <li key={status} className="inline-flex items-center gap-2">
            <BookingStatusBadge status={status} />
            <span className="font-semibold text-foreground tabular-nums">
              {count}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function BookingsReportTable({ filters }: { filters: BookingsReportFilters }) {
  const [search, setSearch] = useState("")
  const report = useBookingsReport(filters)

  const rows = useMemo(
    () =>
      (report.data?.bookings ?? []).filter((booking) =>
        matchesBookingsReportSearch(booking, search)
      ),
    [report.data, search]
  )
  const pagination = usePagination(rows)
  const { setPage } = pagination

  // New filters start back on page 1 (they arrive as a prop from the URL,
  // so this is the render-time equivalent of a change handler).
  const filtersKey = JSON.stringify(filters)
  const [pagedFilters, setPagedFilters] = useState(filtersKey)
  if (pagedFilters !== filtersKey) {
    setPagedFilters(filtersKey)
    setPage(1)
  }

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  const emptyMessage = search.trim()
    ? `No bookings in this report match "${search.trim()}".`
    : "No bookings match these filters."

  return (
    <div className={surfaceClassName}>
      <div className="flex max-w-xl flex-wrap items-center gap-3 p-4">
        <SearchInput
          value={search}
          onChange={handleSearchChange}
          placeholder="Search reference, guest or email"
          label="Search the bookings report"
        />
      </div>

      <Table
        className={cn(
          "mt-4 transition-opacity",
          report.isPlaceholderData && "opacity-60"
        )}
      >
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={tableHeadClassName}>Booking Ref</TableHead>
            <TableHead className={tableHeadClassName}>Guest</TableHead>
            <TableHead className={tableHeadClassName}>Checked in</TableHead>
            <TableHead className={tableHeadClassName}>Checked out</TableHead>
            <TableHead className={tableHeadClassName}>Status</TableHead>
            <TableHead className={cn(tableHeadClassName, "text-right")}>
              Total
            </TableHead>
            <TableHead className={tableHeadClassName}>Payment</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {report.isPending ? (
            <TableSkeletonRows columns={COLUMNS} />
          ) : report.isError ? (
            <TableMessageRow columns={COLUMNS}>
              <TableError
                message="We couldn't load the bookings in this report."
                onRetry={() => report.refetch()}
              />
            </TableMessageRow>
          ) : pagination.total === 0 ? (
            <TableMessageRow columns={COLUMNS}>{emptyMessage}</TableMessageRow>
          ) : (
            pagination.pageItems.map((booking) => (
              <TableRow key={booking.booking_id} className="h-14">
                <TableCell className="px-4">
                  <Link
                    href={getBookingHref(booking.booking_id)}
                    className="font-mono text-sm font-semibold text-foreground underline-offset-4 hover:text-brand-azure hover:underline"
                  >
                    {booking.reference}
                  </Link>
                </TableCell>
                <TableCell className="px-4">
                  <div className="grid">
                    <span className="font-semibold text-foreground">
                      {booking.guest_name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {booking.guest_email || "—"}
                    </span>
                  </div>
                </TableCell>
                <TimestampCell value={booking.check_in_at} />
                <TimestampCell value={booking.check_out_at} />
                <TableCell className="px-4">
                  <BookingStatusBadge status={booking.status} />
                </TableCell>
                <TableCell className="px-4 text-right font-mono text-foreground tabular-nums">
                  {formatAmount(booking.total_amount, booking.currency)}
                </TableCell>
                <TableCell className="px-4">
                  <PaymentStatusBadge status={booking.payment_status} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {report.isSuccess ? (
        <TablePagination
          page={pagination.page}
          pageCount={pagination.pageCount}
          pageSize={pagination.pageSize}
          total={pagination.total}
          onPageChange={setPage}
          itemLabel="bookings"
        />
      ) : null}
    </div>
  )
}

/** The actual check-in / check-out time, or a muted dash when it hasn't happened. */
function TimestampCell({ value }: { value: string | null }) {
  return (
    <TableCell
      className={cn(
        "px-4 text-sm tabular-nums",
        value ? "text-foreground" : "text-muted-foreground"
      )}
    >
      {formatTimestamp(value)}
    </TableCell>
  )
}
