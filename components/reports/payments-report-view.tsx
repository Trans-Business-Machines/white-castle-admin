"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "cn"
import { getBookingHref } from "@/components/bookings/booking-actions-menu"
import {
  ReportError,
  StatCardSkeleton,
} from "@/components/dashboard/report-state"
import { PaymentEvidenceDialog } from "@/components/payments/payment-evidence-dialog"
import { PaymentRecordStatusBadge } from "@/components/payments/payment-status-badge"
import {
  PAYMENT_STATUS_OPTIONS,
  PaymentsReportDialog,
} from "@/components/reports/payments-report-dialog"
import { ReportTableFilter } from "@/components/reports/report-param-fields"
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
import { usePagination } from "@/hooks/use-pagination"
import { usePaymentsReport } from "@/hooks/use-payments-report"
import { getApiErrorMessage } from "@/lib/api/errors"
import type { PaymentsReportFilters } from "@/lib/api/reports"
import { formatCurrency, formatTimestamp, humanizeSlug } from "@/lib/format"
import {
  getEvidenceFileId,
  getPaymentMethodLabel,
  getPaymentTypeLabel,
} from "@/lib/payments"
import {
  formatPaymentCount,
  getReportHref,
  getPaymentsByMethodSegments,
  getPaymentsByStatusSegments,
  getPaymentsReportStatCards,
  matchesPaymentsReportSearch,
} from "@/lib/reports"
import { PAYMENT_METHODS } from "@/lib/schemas/payments"

const COLUMNS = 8
const STAT_CARD_COUNT = 4

const statGridClassName =
  "grid grid-cols-[repeat(auto-fit,minmax(min(13rem,100%),1fr))] gap-4"

/**
 * `/reports/payments`: the filters come from the URL (set by
 * `PaymentsReportDialog`), so the report survives a reload and can be
 * shared as a link.
 */
export function PaymentsReportView({
  filters,
}: {
  filters: PaymentsReportFilters
}) {
  const report = usePaymentsReport(filters)
  const chips = [
    filters.status && `Status: ${humanizeSlug(filters.status)}`,
    filters.method && `Method: ${getPaymentMethodLabel(filters.method)}`,
  ].filter((chip) => chip !== "")

  return (
    <section className="grid gap-6">
      <ReportHeader
        title="Payments report"
        from={filters.from_date}
        to={filters.to_date}
        chips={chips}
        action={
          <PaymentsReportDialog initialFilters={filters}>
            <ChangeFiltersButton />
          </PaymentsReportDialog>
        }
      />

      {report.isPending ? (
        <PaymentsSummarySkeleton />
      ) : report.isError ? (
        <ReportError
          message={getApiErrorMessage(
            report.error,
            "We couldn't generate the payments report."
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
            {getPaymentsReportStatCards(report.data.summary).map((card) => (
              <StatCard
                key={card.key}
                title={card.title}
                titleClassName={card.titleClassName}
                text={card.text}
                label={card.label}
              />
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ShareBreakdown
              title="By method"
              total={report.data.summary.total_amount}
              totalLabel={formatCurrency(report.data.summary.total_amount)}
              segments={getPaymentsByMethodSegments(report.data)}
              format={formatCurrency}
              emptyMessage="No payments match these filters."
            />
            <ShareBreakdown
              title="By status"
              total={report.data.summary.total_amount}
              totalLabel={formatPaymentCount(
                report.data.summary.total_payments
              )}
              segments={getPaymentsByStatusSegments(report.data.summary)}
              format={formatCurrency}
              emptyMessage="No payments match these filters."
            />
          </div>
        </div>
      )}

      <PaymentsReportTable filters={filters} />
    </section>
  )
}

function PaymentsSummarySkeleton() {
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

function PaymentsReportTable({ filters }: { filters: PaymentsReportFilters }) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const report = usePaymentsReport(filters)

  const rows = useMemo(
    () =>
      (report.data?.payments ?? []).filter((payment) =>
        matchesPaymentsReportSearch(payment, search)
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

  /**
   * Status and method are report filters, so they go through the URL like
   * the dialog's (the summary follows too); the page resets above.
   */
  function handleFilterChange(patch: Partial<PaymentsReportFilters>) {
    router.replace(getReportHref("payments", { ...filters, ...patch }), {
      scroll: false,
    })
  }

  const emptyMessage = search.trim()
    ? `No payments in this report match "${search.trim()}".`
    : "No payments match these filters."

  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-foreground/10">
      <div className="flex max-w-3xl flex-wrap items-center gap-3 p-4">
        <SearchInput
          value={search}
          onChange={handleSearchChange}
          placeholder="Search booking or transaction reference"
          label="Search the payments report"
        />
        <ReportTableFilter
          label="Filter by status"
          allLabel="All statuses"
          value={filters.status}
          options={PAYMENT_STATUS_OPTIONS}
          onChange={(status) => handleFilterChange({ status })}
        />
        <ReportTableFilter
          label="Filter by payment method"
          allLabel="All methods"
          value={filters.method}
          options={PAYMENT_METHODS}
          onChange={(method) => handleFilterChange({ method })}
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
            <TableHead className={cn(tableHeadClassName, "text-right")}>
              Amount
            </TableHead>
            <TableHead className={tableHeadClassName}>Type</TableHead>
            <TableHead className={tableHeadClassName}>Method</TableHead>
            <TableHead className={tableHeadClassName}>Reference</TableHead>
            <TableHead className={tableHeadClassName}>Status</TableHead>
            <TableHead className={tableHeadClassName}>Proof</TableHead>
            <TableHead className={tableHeadClassName}>Recorded</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {report.isPending ? (
            <TableSkeletonRows columns={COLUMNS} />
          ) : report.isError ? (
            <TableMessageRow columns={COLUMNS}>
              <TableError
                message="We couldn't load the payments in this report."
                onRetry={() => report.refetch()}
              />
            </TableMessageRow>
          ) : pagination.total === 0 ? (
            <TableMessageRow columns={COLUMNS}>{emptyMessage}</TableMessageRow>
          ) : (
            pagination.pageItems.map((payment) => {
              const fileId = getEvidenceFileId(payment)
              return (
                <TableRow key={payment.payment_id} className="h-14">
                  <TableCell className="px-4">
                    <Link
                      href={getBookingHref(payment.booking_id)}
                      className="font-mono text-sm font-semibold text-foreground underline-offset-4 hover:text-brand-azure hover:underline"
                    >
                      {payment.booking_ref}
                    </Link>
                  </TableCell>
                  <TableCell className="px-4 text-right font-mono text-foreground tabular-nums">
                    {formatCurrency(payment.amount)}
                  </TableCell>
                  <TableCell className="px-4">
                    {getPaymentTypeLabel(payment.payment_type)}
                  </TableCell>
                  <TableCell className="px-4">
                    {getPaymentMethodLabel(payment.method)}
                  </TableCell>
                  <TableCell className="px-4 font-mono text-sm">
                    {payment.reference || (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="px-4">
                    <PaymentRecordStatusBadge status={payment.status} />
                  </TableCell>
                  <TableCell className="px-4">
                    {fileId ? (
                      <PaymentEvidenceDialog
                        payment={payment}
                        fileId={fileId}
                      />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 text-sm text-muted-foreground tabular-nums">
                    {formatTimestamp(payment.created_at)}
                  </TableCell>
                </TableRow>
              )
            })
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
          itemLabel="payments"
        />
      ) : null}
    </div>
  )
}
