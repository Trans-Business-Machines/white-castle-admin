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
} from "@/components/payments/payments-filters"
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
import {
  fetchPayments,
  paymentsListQueryKey,
  type PaymentListFilters,
} from "@/lib/api/payments"
import { formatCurrency, formatTimestamp } from "@/lib/format"
import { getPaymentMethodLabel, getPaymentTypeLabel } from "@/lib/payments"

const COLUMNS = 9

/**
 * Payments list with a server-side status filter. Filtering keeps the
 * previous rows on screen (dimmed) until the new page arrives so the table
 * doesn't collapse to a skeleton on every change.
 */
export function PaymentsTable() {
  const [filters, setFilters] = useState<PaymentListFilters>(
    EMPTY_PAYMENT_FILTERS
  )

  const payments = useQuery({
    queryKey: paymentsListQueryKey(filters),
    queryFn: () => fetchPayments(filters),
    placeholderData: keepPreviousData,
  })

  const rows = payments.data ?? []

  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-foreground/10">
      <div className="flex gap-3 p-4">
        <PaymentsFilters value={filters} onChange={setFilters} />
      </div>

      <Table
        className={cn(
          "mt-4 transition-opacity",
          payments.isPlaceholderData && "opacity-60"
        )}
      >
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={tableHeadClassName}>Booking</TableHead>
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
          ) : rows.length === 0 ? (
            <TableMessageRow columns={COLUMNS}>
              {hasActivePaymentFilters(filters)
                ? "No payments match the current filter."
                : "No payments recorded yet. Record the first one above."}
            </TableMessageRow>
          ) : (
            rows.map((payment) => (
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
    </div>
  )
}
