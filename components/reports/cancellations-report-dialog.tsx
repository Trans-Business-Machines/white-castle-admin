"use client"

import type { ReactNode } from "react"
import { ExportCsvDialog } from "@/components/export-csv-dialog"
import { ReportDateRangeFields } from "@/components/reports/report-param-fields"
import { DownloadCsvButton } from "@/components/reports/report-csv"
import { ReportParamsDialog } from "@/components/reports/report-params-dialog"
import {
  exportCancellationsReport,
  type ReportDateRange,
} from "@/lib/api/reports"
import { EMPTY_REPORT_DATE_RANGE } from "@/lib/reports"

interface CancellationsReportDialogProps {
  /** The element that opens the dialog. */
  children: ReactNode
  /** Where each open starts; the report page passes its current period. */
  initialRange?: ReportDateRange
}

/** Asks for the period (both ends optional) → `/reports/cancellations`. */
export function CancellationsReportDialog({
  children,
  initialRange = EMPTY_REPORT_DATE_RANGE,
}: CancellationsReportDialogProps) {
  return (
    <ReportParamsDialog
      slug="cancellations"
      title="Generate cancellations report"
      description="Pick the period to report on. Leave both dates empty to include every cancellation."
      initialValues={initialRange}
      renderFields={(range, update) => (
        <ReportDateRangeFields
          idPrefix="cancellations-report"
          value={range}
          onChange={update}
        />
      )}
    >
      {children}
    </ReportParamsDialog>
  )
}

/** The report card's Download CSV: same period → `GET /motel/reports/cancellations/export`. */
export function CancellationsReportExportDialog() {
  return (
    <ExportCsvDialog
      noun="cancellations report"
      description="Pick the period to export. Leave both dates empty to include every cancellation."
      initialFilters={() => EMPTY_REPORT_DATE_RANGE}
      renderFields={(range, update) => (
        <ReportDateRangeFields
          idPrefix="cancellations-report-export"
          value={range}
          onChange={update}
        />
      )}
      exportFile={exportCancellationsReport}
      submitLabel="Download CSV"
    >
      <DownloadCsvButton className="h-10" />
    </ExportCsvDialog>
  )
}
