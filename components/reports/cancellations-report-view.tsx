"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { cn } from "cn"
import { getBookingHref } from "@/components/bookings/booking-actions-menu"
import { PaymentStatusBadge } from "@/components/bookings/booking-status-badge"
import {
  ReportError,
  StatCardSkeleton,
} from "@/components/dashboard/report-state"
import { CancellationsReportDialog } from "@/components/reports/cancellations-report-dialog"
import {
  ChangeFiltersButton,
  ReportHeader,
} from "@/components/reports/report-header"
import { ShareBreakdown } from "@/components/reports/share-breakdown"
import { StatCard } from "@/components/stat-card"
import { TablePagination } from "@/components/table-pagination"
import { Skeleton } from "@/components/ui/skeleton"
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
import { useCancellationsReport } from "@/hooks/use-cancellations-report"
import { usePagination } from "@/hooks/use-pagination"
import { getApiErrorMessage } from "@/lib/api/errors"
import type { ReportDateRange } from "@/lib/api/reports"
import { formatCurrency, formatTimestamp } from "@/lib/format"
import {
  formatBookingCount,
  formatCount,
  getCancellationsReportStatCards,
  getCancelledBySegments,
  getPaidAtCancellationSegments,
  matchesBookingsReportSearch,
} from "@/lib/reports"

const COLUMNS = 7
const STAT_CARD_COUNT = 4

const statGridClassName =
  "grid grid-cols-[repeat(auto-fit,minmax(min(13rem,100%),1fr))] gap-4"

/**
 * `/reports/cancellations`: the period comes from the URL (set by
 * `CancellationsReportDialog`), so the report survives a reload and can be
 * shared as a link.
 */
export function CancellationsReportView({ range }: { range: ReportDateRange }) {
  const report = useCancellationsReport(range)

  return (
    <section className="grid gap-6">
      <ReportHeader
        title="Cancellations report"
        from={range.from_date}
        to={range.to_date}
        action={
          <CancellationsReportDialog initialRange={range}>
            <ChangeFiltersButton />
          </CancellationsReportDialog>
        }
      />

      {report.isPending ? (
        <CancellationsSummarySkeleton />
      ) : report.isError ? (
        <ReportError
          message={getApiErrorMessage(
            report.error,
            "We couldn't generate the cancellations report."
          )}
          onRetry={() => report.refetch()}
        />
      ) : (
        <div
          className={cn(
            "grid gap-6 transition-opacity",
            report.isPlaceholderData && "opacity-60"
          )}
        >
          <div className={statGridClassName}>
            {getCancellationsReportStatCards(report.data.summary).map(
              (card) => (
                <StatCard
                  key={card.key}
                  title={card.title}
                  titleClassName={card.titleClassName}
                  text={card.text}
                  label={card.label}
                />
              )
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ShareBreakdown
              title="Cancelled by"
              total={report.data.summary.total_cancellations}
              totalLabel={formatBookingCount(
                report.data.summary.total_cancellations
              )}
              segments={getCancelledBySegments(report.data.summary)}
              format={formatCount}
              emptyMessage="No bookings were cancelled in this period."
            />
            <ShareBreakdown
              title="Payment when cancelled"
              total={report.data.summary.total_cancellations}
              totalLabel={formatBookingCount(
                report.data.summary.total_cancellations
              )}
              segments={getPaidAtCancellationSegments(report.data.summary)}
              format={formatCount}
              emptyMessage="No bookings were cancelled in this period."
            />
          </div>
        </div>
      )}

      <CancellationsTable range={range} />
    </section>
  )
}

function CancellationsSummarySkeleton() {
  return (
    <>
      <div className={statGridClassName}>
        {Array.from({ length: STAT_CARD_COUNT }, (_, index) => (
          <StatCardSkeleton key={index} />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }, (_, index) => (
          <div
            key={index}
            className="grid gap-4 rounded-xl bg-card p-5 shadow-sm ring-1 ring-foreground/10"
          >
            <Skeleton className="h-3 w-28 rounded" />
            <Skeleton className="h-3 w-full rounded-full" />
            <Skeleton className="h-4 w-3/4 rounded" />
            <Skeleton className="h-4 w-2/3 rounded" />
          </div>
        ))}
      </div>
    </>
  )
}

function CancellationsTable({ range }: { range: ReportDateRange }) {
  const [search, setSearch] = useState("")
  const report = useCancellationsReport(range)

  const rows = useMemo(
    () =>
      (report.data?.cancellations ?? []).filter((booking) =>
        matchesBookingsReportSearch(booking, search)
      ),
    [report.data, search]
  )
  const pagination = usePagination(rows)
  const { setPage } = pagination

  // A new period starts back on page 1 (it arrives as a prop from the URL,
  // so this is the render-time equivalent of a change handler).
  const rangeKey = JSON.stringify(range)
  const [pagedRange, setPagedRange] = useState(rangeKey)
  if (pagedRange !== rangeKey) {
    setPagedRange(rangeKey)
    setPage(1)
  }

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  const emptyMessage = search.trim()
    ? `No cancellations in this report match "${search.trim()}".`
    : "No bookings were cancelled in this period."

  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-foreground/10">
      <div className="flex max-w-xl flex-wrap items-center gap-3 p-4">
        <SearchInput
          value={search}
          onChange={handleSearchChange}
          placeholder="Search reference, guest or email"
          label="Search the cancellations report"
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
            <TableHead className={tableHeadClassName}>Cancelled</TableHead>
            <TableHead className={tableHeadClassName}>Reason</TableHead>
            <TableHead className={tableHeadClassName}>Payment</TableHead>
            <TableHead className={cn(tableHeadClassName, "text-right")}>
              Fee
            </TableHead>
            <TableHead className={cn(tableHeadClassName, "text-right")}>
              Refund
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {report.isPending ? (
            <TableSkeletonRows columns={COLUMNS} />
          ) : report.isError ? (
            <TableMessageRow columns={COLUMNS}>
              <TableError
                message="We couldn't load the cancellations in this report."
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
                <TableCell className="px-4">
                  <div className="grid">
                    <span className="text-sm text-foreground tabular-nums">
                      {formatTimestamp(booking.cancelled_at)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {booking.cancelled_by
                        ? `by ${booking.cancelled_by}`
                        : "Auto-cancelled by the system"}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="max-w-64 px-4 whitespace-normal">
                  {booking.cancellation_reason || (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="px-4">
                  <PaymentStatusBadge status={booking.payment_status} />
                </TableCell>
                <MoneyCell value={booking.cancellation_fee} />
                <MoneyCell value={booking.refund_amount} />
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
          itemLabel="cancellations"
        />
      ) : null}
    </div>
  )
}

/** A fee or refund, or a muted dash when the API has none. */
function MoneyCell({ value }: { value: number | null }) {
  return (
    <TableCell className="px-4 text-right font-mono tabular-nums">
      {value == null ? (
        <span className="text-muted-foreground">—</span>
      ) : (
        formatCurrency(value)
      )}
    </TableCell>
  )
}
