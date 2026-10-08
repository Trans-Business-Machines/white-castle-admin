"use client"

import type { ReactNode } from "react"
import { ExportCsvDialog } from "@/components/export-csv-dialog"
import {
  ReportDateRangeFields,
  ReportSelectField,
} from "@/components/reports/report-param-fields"
import { DownloadCsvButton } from "@/components/reports/report-csv"
import { ReportParamsDialog } from "@/components/reports/report-params-dialog"
import {
  exportBookingsReport,
  type BookingsReportFilters,
} from "@/lib/api/reports"
import { BOOKING_STATUSES } from "@/lib/bookings"
import { humanizeSlug } from "@/lib/format"
import { EMPTY_BOOKINGS_REPORT_FILTERS } from "@/lib/reports"
import { CURRENCIES, MEAL_PLANS } from "@/lib/schemas/bookings"
import { ROOM_TYPES } from "@/lib/schemas/units"

const STATUS_OPTIONS = BOOKING_STATUSES.map((status) => ({
  value: status,
  label: humanizeSlug(status),
}))

interface BookingsReportDialogProps {
  /** The element that opens the dialog. */
  children: ReactNode
  /** Where each open starts; the report page passes its current filters. */
  initialFilters?: BookingsReportFilters
}

/** Date range, status, residency, room type and meal plan (all optional) → `/reports/bookings`. */
export function BookingsReportDialog({
  children,
  initialFilters = EMPTY_BOOKINGS_REPORT_FILTERS,
}: BookingsReportDialogProps) {
  return (
    <ReportParamsDialog
      slug="bookings"
      title="Generate bookings report"
      description="Every filter is optional. Leave them empty to report on all bookings."
      initialValues={initialFilters}
      renderFields={(filters, update) => (
        <BookingsReportFields filters={filters} update={update} />
      )}
    >
      {children}
    </ReportParamsDialog>
  )
}

/** The report cards' Download CSV: same filters → `GET /motel/reports/bookings/export`. */
export function BookingsReportExportDialog() {
  return (
    <ExportCsvDialog
      noun="bookings report"
      description="Every filter is optional. Leave them empty to export all bookings."
      initialFilters={() => EMPTY_BOOKINGS_REPORT_FILTERS}
      renderFields={(filters, update) => (
        <BookingsReportFields
          idPrefix="bookings-report-export"
          filters={filters}
          update={update}
        />
      )}
      exportFile={exportBookingsReport}
      submitLabel="Download CSV"
    >
      <DownloadCsvButton className="h-10" />
    </ExportCsvDialog>
  )
}

interface BookingsReportFieldsProps {
  /** Prefix for the inputs' ids, so two forms never share one. */
  idPrefix?: string
  filters: BookingsReportFilters
  update: (patch: Partial<BookingsReportFilters>) => void
}

/** The bookings report's filters, shared by the report and export dialogs. */
function BookingsReportFields({
  idPrefix = "bookings-report",
  filters,
  update,
}: BookingsReportFieldsProps) {
  return (
    <>
      <ReportDateRangeFields
        idPrefix={idPrefix}
        value={filters}
        onChange={update}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <ReportSelectField
          id={`${idPrefix}-status`}
          label="Status"
          allLabel="All statuses"
          value={filters.status}
          options={STATUS_OPTIONS}
          onChange={(status) => update({ status })}
        />
        <ReportSelectField
          id={`${idPrefix}-currency`}
          label="Residency"
          allLabel="All guests"
          value={filters.currency}
          options={CURRENCIES}
          onChange={(currency) => update({ currency })}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <ReportSelectField
          id={`${idPrefix}-room-type`}
          label="Room type"
          allLabel="All room types"
          value={filters.room_type}
          options={ROOM_TYPES}
          onChange={(room_type) => update({ room_type })}
        />
        <ReportSelectField
          id={`${idPrefix}-meal-plan`}
          label="Meal plan"
          allLabel="All meal plans"
          value={filters.meal_plan}
          options={MEAL_PLANS}
          onChange={(meal_plan) => update({ meal_plan })}
        />
      </div>
    </>
  )
}
