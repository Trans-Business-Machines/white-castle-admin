"use client"

import type { ReactNode } from "react"
import {
  ReportDateField,
  ReportDateRangeFields,
} from "@/components/reports/report-param-fields"
import { ReportParamsDialog } from "@/components/reports/report-params-dialog"
import type { BbSummaryReportFilters } from "@/lib/api/reports"
import { EMPTY_BB_SUMMARY_REPORT_FILTERS } from "@/lib/reports"

interface BbSummaryReportDialogProps {
  /** The element that opens the dialog. */
  children: ReactNode
  /** Where each open starts; the report page passes its current filters. */
  initialFilters?: BbSummaryReportFilters
}

/**
 * Period plus the day to pull the breakfast list for (all optional) →
 * `/reports/bed-and-breakfast`.
 */
export function BbSummaryReportDialog({
  children,
  initialFilters = EMPTY_BB_SUMMARY_REPORT_FILTERS,
}: BbSummaryReportDialogProps) {
  return (
    <ReportParamsDialog
      slug="bed-and-breakfast"
      title="Generate breakfast list report"
      description="Every field is optional. Leave the dates empty to include all meal plan bookings."
      initialValues={initialFilters}
      renderFields={(filters, update) => (
        <>
          <ReportDateRangeFields
            idPrefix="bb-report"
            value={filters}
            onChange={update}
          />
          <ReportDateField
            id="bb-report-target-date"
            label="Breakfast list day"
            value={filters.target_date}
            onChange={(target_date) => update({ target_date })}
            placeholder="Today"
            hint="Whose breakfast to list. Leave empty for today."
          />
        </>
      )}
    >
      {children}
    </ReportParamsDialog>
  )
}
