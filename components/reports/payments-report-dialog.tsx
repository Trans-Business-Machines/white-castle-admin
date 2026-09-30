"use client"

import type { ReactNode } from "react"
import {
  ReportDateRangeFields,
  ReportSelectField,
} from "@/components/reports/report-param-fields"
import { ReportParamsDialog } from "@/components/reports/report-params-dialog"
import type { PaymentsReportFilters } from "@/lib/api/reports"
import { humanizeSlug } from "@/lib/format"
import { PAYMENT_STATUSES } from "@/lib/payments"
import { EMPTY_PAYMENTS_REPORT_FILTERS } from "@/lib/reports"
import { PAYMENT_METHODS } from "@/lib/schemas/payments"

/** Payment statuses as select options, shared with the report table. */
export const PAYMENT_STATUS_OPTIONS = PAYMENT_STATUSES.map((status) => ({
  value: status,
  label: humanizeSlug(status),
}))

interface PaymentsReportDialogProps {
  /** The element that opens the dialog. */
  children: ReactNode
  /** Where each open starts; the report page passes its current filters. */
  initialFilters?: PaymentsReportFilters
}

/** Date range, status and method (all optional) → `/reports/payments`. */
export function PaymentsReportDialog({
  children,
  initialFilters = EMPTY_PAYMENTS_REPORT_FILTERS,
}: PaymentsReportDialogProps) {
  return (
    <ReportParamsDialog
      slug="payments"
      title="Generate payments report"
      description="Every filter is optional. Leave them empty to report on all payments."
      initialValues={initialFilters}
      renderFields={(filters, update) => (
        <>
          <ReportDateRangeFields
            idPrefix="payments-report"
            value={filters}
            onChange={update}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <ReportSelectField
              id="payments-report-status"
              label="Status"
              allLabel="All statuses"
              value={filters.status}
              options={PAYMENT_STATUS_OPTIONS}
              onChange={(status) => update({ status })}
            />
            <ReportSelectField
              id="payments-report-method"
              label="Method"
              allLabel="All methods"
              value={filters.method}
              options={PAYMENT_METHODS}
              onChange={(method) => update({ method })}
            />
          </div>
        </>
      )}
    >
      {children}
    </ReportParamsDialog>
  )
}
