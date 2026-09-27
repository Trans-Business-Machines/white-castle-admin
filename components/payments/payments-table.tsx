"use client"

import { useState } from "react"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { cn } from "cn"
import { PaymentActionsMenu } from "@/components/payments/payment-actions-menu"
import { PaymentRecordStatusBadge } from "@/components/payments/payment-status-badge"
import {
  EMPTY_PAYMENT_FILTERS,
  hasActivePaymentFilters,
  PaymentsFilters,
  type PaymentFilterValues,
} from "@/components/payments/payments-filters"
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
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { usePagination } from "@/hooks/use-pagination"
import {
  fetchPayments,
  paymentsListQueryKey,
  type PaymentListFilters,
} from "@/lib/api/payments"
import { formatCurrency, formatTimestamp } from "@/lib/format"
import { getPaymentMethodLabel, getPaymentTypeLabel } from "@/lib/payments"

const COLUMNS = 9

/**
 * Payments list with server-side reference search and status / date
 * filters, paged client-side (the endpoint doesn't paginate yet). Filtering
 * keeps the previous rows on screen (dimmed) until the new list arrives so
 * the table doesn't collapse to a skeleton on every change.
 */
export function PaymentsTable() {
  const [filters, setFilters] = useState<PaymentFilterValues>(
    EMPTY_PAYMENT_FILTERS
  )
  const [search, setSearch] = useState("")
  const reference = useDebouncedValue(search).trim()

  const listFilters: PaymentListFilters = { ...filters, reference }
  const payments = useQuery({
    queryKey: paymentsListQueryKey(listFilters),
    queryFn: () => fetchPayments(listFilters),
    placeholderData: keepPreviousData,
  })

  const pagination = usePagination(payments.data ?? [])
  const { setPage } = pagination

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  function handleFiltersChange(value: PaymentFilterValues) {
    setFilters(value)
    setPage(1)
  }

  const emptyMessage = reference
    ? `No payments match "${reference}"${
        hasActivePaymentFilters(filters) ? " with the current filters" : ""
      }.`
    : hasActivePaymentFilters(filters)
      ? "No payments match the current filters."
      : "No payments recorded yet. Record the first one above."

  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-foreground/10">
      {/* The search box takes whatever the filters leave, down to 12rem, so
          both stay on one row until the screen is genuinely narrow. */}
      <div className="flex flex-wrap items-end gap-3 p-4">
        <div className="flex min-w-48 flex-1">
          <SearchInput
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by payment record by booking reference"
            label="Search payments by reference"
          />
        </div>
        <PaymentsFilters value={filters} onChange={handleFiltersChange} />
      </div>

      <Table
        className={cn(
          "mt-4 transition-opacity",
          payments.isPlaceholderData && "opacity-60"
        )}
      >
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={tableHeadClassName}>Booking Ref</TableHead>
            <TableHead className={tableHeadClassName}>Amount</TableHead>
            <TableHead className={tableHeadClassName}>Type</TableHead>
            <TableHead className={tableHeadClassName}>Method</TableHead>
            <TableHead className={tableHeadClassName}>Reference</TableHead>
            <TableHead className={tableHeadClassName}>Status</TableHead>
            <TableHead className={tableHeadClassName}>Proof</TableHead>
            <TableHead className={tableHeadClassName}>Recorded</TableHead>
            <TableHead className={cn(tableHeadClassName, "w-24 text-center")}>
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.isPending ? (
            <TableSkeletonRows columns={COLUMNS} />
          ) : payments.isError ? (
            <TableMessageRow columns={COLUMNS}>
              <TableError
                message="We couldn't load payments."
                onRetry={() => payments.refetch()}
              />
            </TableMessageRow>
          ) : pagination.total === 0 ? (
            <TableMessageRow columns={COLUMNS}>{emptyMessage}</TableMessageRow>
          ) : (
            pagination.pageItems.map((payment) => (
              <TableRow key={payment.payment_id} className="h-14">
                <TableCell className="px-4 font-mono text-sm font-semibold text-foreground">
                  {payment.booking_ref}
                </TableCell>
                <TableCell className="px-4 font-mono">
                  {formatCurrency(payment.amount)}
                </TableCell>
                <TableCell className="px-4">
                  {getPaymentTypeLabel(payment.payment_type)}
                </TableCell>
                <TableCell className="px-4">
                  {getPaymentMethodLabel(payment.method)}
                </TableCell>
                <TableCell className="px-4 font-mono text-sm">
                  {payment.reference || "—"}
                </TableCell>
                <TableCell className="px-4">
                  <div className="flex flex-col items-start gap-1">
                    <PaymentRecordStatusBadge status={payment.status} />
                  </div>
                </TableCell>
                <TableCell className="px-4">
                  {payment.evidence_url ? (
                    <a
                      href={payment.evidence_url}
                      target="_blank"
                      rel="noreferrer"
                      title={payment.evidence_filename ?? undefined}
                      className="font-semibold text-brand-azure underline underline-offset-4"
                    >
                      View
                    </a>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="px-4 text-sm text-muted-foreground">
                  {formatTimestamp(payment.created_at)}
                </TableCell>
                <TableCell className="px-4 text-center">
                  <PaymentActionsMenu payment={payment} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {payments.isSuccess ? (
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
