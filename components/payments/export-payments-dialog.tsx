"use client"

import { ExportCsvDialog } from "@/components/export-csv-dialog"
import { exportPayments } from "@/lib/api/payments"
import { getCurrentMonthRange, PAYMENT_EXPORT_STATUSES } from "@/lib/payments"

/**
 * Payments CSV export (`GET /payments/export/payments`). Starts on every
 * status (no `status` param) and the current month.
 */
export function ExportPaymentsDialog() {
  return (
    <ExportCsvDialog
      noun="payments"
      description="Defaults to this month's payments. Change the dates or pick a status to narrow it down, or clear the dates to export everything."
      statuses={PAYMENT_EXPORT_STATUSES}
      initialFilters={() => ({ status: "", ...getCurrentMonthRange() })}
      exportFile={exportPayments}
    />
  )
}
