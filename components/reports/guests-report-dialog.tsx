"use client"

import type { ReactNode } from "react"
import { ReportDateRangeFields } from "@/components/reports/report-param-fields"
import { ReportParamsDialog } from "@/components/reports/report-params-dialog"
import type { ReportDateRange } from "@/lib/api/reports"
import { EMPTY_REPORT_DATE_RANGE } from "@/lib/reports"

interface GuestsReportDialogProps {
  /** The element that opens the dialog. */
  children: ReactNode
  /** Where each open starts; the report page passes its current period. */
  initialRange?: ReportDateRange
}

/** Asks for the period (both ends optional) → `/reports/guests`. */
export function GuestsReportDialog({
  children,
  initialRange = EMPTY_REPORT_DATE_RANGE,
}: GuestsReportDialogProps) {
  return (
    <ReportParamsDialog
      slug="guests"
      title="Generate guests report"
      description="Pick the period to count new and returning guests in. Leave both dates empty to include every guest."
      initialValues={initialRange}
      renderFields={(range, update) => (
        <ReportDateRangeFields
          idPrefix="guests-report"
          value={range}
          onChange={update}
        />
      )}
    >
      {children}
    </ReportParamsDialog>
  )
}
