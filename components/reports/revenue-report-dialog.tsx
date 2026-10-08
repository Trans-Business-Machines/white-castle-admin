"use client"

import type { ReactNode } from "react"
import { ExportCsvDialog } from "@/components/export-csv-dialog"
import { ReportDateRangeFields } from "@/components/reports/report-param-fields"
import { DownloadCsvButton } from "@/components/reports/report-csv"
import { ReportParamsDialog } from "@/components/reports/report-params-dialog"
import { exportRevenueReport, type ReportDateRange } from "@/lib/api/reports"
import { EMPTY_REPORT_DATE_RANGE } from "@/lib/reports"

interface RevenueReportDialogProps {
  /** The element that opens the dialog. */
  children: ReactNode
  /** Where each open starts; the report page passes its current period. */
  initialRange?: ReportDateRange
}

/** Asks for the period (both ends optional) → `/reports/revenue`. */
export function RevenueReportDialog({
  children,
  initialRange = EMPTY_REPORT_DATE_RANGE,
}: RevenueReportDialogProps) {
  return (
    <ReportParamsDialog
      slug="revenue"
      title="Generate revenue report"
      description="Pick the period to report on. Leave both dates empty to include all revenue."
      initialValues={initialRange}
      renderFields={(range, update) => (
        <ReportDateRangeFields
          idPrefix="revenue-report"
          value={range}
          onChange={update}
        />
      )}
    >
      {children}
    </ReportParamsDialog>
  )
}

/** The report card's Download CSV: same period → `GET /motel/reports/revenue/export`. */
export function RevenueReportExportDialog() {
  return (
    <ExportCsvDialog
      noun="revenue report"
      description="Pick the period to export. Leave both dates empty to include all revenue."
      initialFilters={() => EMPTY_REPORT_DATE_RANGE}
      renderFields={(range, update) => (
        <ReportDateRangeFields
          idPrefix="revenue-report-export"
          value={range}
          onChange={update}
        />
      )}
      exportFile={exportRevenueReport}
      submitLabel="Download CSV"
    >
      <DownloadCsvButton className="h-10" />
    </ExportCsvDialog>
  )
}
