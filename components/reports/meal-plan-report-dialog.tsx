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
  exportMealPlanReport,
  type MealPlanReportFilters,
} from "@/lib/api/reports"
import { BOOKING_STATUSES } from "@/lib/bookings"
import { humanizeSlug } from "@/lib/format"
import { EMPTY_MEAL_PLAN_REPORT_FILTERS } from "@/lib/reports"
import { CURRENCIES, MEAL_PLANS } from "@/lib/schemas/bookings"

const STATUS_OPTIONS = BOOKING_STATUSES.map((status) => ({
  value: status,
  label: humanizeSlug(status),
}))

interface MealPlanReportDialogProps {
  /** The element that opens the dialog. */
  children: ReactNode
  /** Where each open starts; the report page passes its current filters. */
  initialFilters?: MealPlanReportFilters
}

/** Date range, meal plan, booking status and residency (all optional) → `/reports/meal-plans`. */
export function MealPlanReportDialog({
  children,
  initialFilters = EMPTY_MEAL_PLAN_REPORT_FILTERS,
}: MealPlanReportDialogProps) {
  return (
    <ReportParamsDialog
      slug="meal-plans"
      title="Generate meal plan report"
      description="Every filter is optional. Leave them empty to report on every meal plan."
      initialValues={initialFilters}
      renderFields={(filters, update) => (
        <MealPlanReportFields filters={filters} update={update} />
      )}
    >
      {children}
    </ReportParamsDialog>
  )
}

/** The report card's Download CSV: same filters → `GET /motel/reports/meal-plan-report/export`. */
export function MealPlanReportExportDialog() {
  return (
    <ExportCsvDialog
      noun="meal plan report"
      description="Every filter is optional. Leave them empty to export every meal plan."
      initialFilters={() => EMPTY_MEAL_PLAN_REPORT_FILTERS}
      renderFields={(filters, update) => (
        <MealPlanReportFields
          idPrefix="meal-plan-report-export"
          filters={filters}
          update={update}
        />
      )}
      exportFile={exportMealPlanReport}
      submitLabel="Download CSV"
    >
      <DownloadCsvButton className="h-10" />
    </ExportCsvDialog>
  )
}

interface MealPlanReportFieldsProps {
  /** Prefix for the inputs' ids, so two forms never share one. */
  idPrefix?: string
  filters: MealPlanReportFilters
  update: (patch: Partial<MealPlanReportFilters>) => void
}

/** The meal plan report's filters, shared by the report and export dialogs. */
function MealPlanReportFields({
  idPrefix = "meal-plan-report",
  filters,
  update,
}: MealPlanReportFieldsProps) {
  return (
    <>
      <ReportDateRangeFields
        idPrefix={idPrefix}
        value={filters}
        onChange={update}
      />
      <ReportSelectField
        id={`${idPrefix}-meal-plan`}
        label="Meal plan"
        allLabel="All meal plans"
        value={filters.meal_plan}
        options={MEAL_PLANS}
        onChange={(meal_plan) => update({ meal_plan })}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <ReportSelectField
          id={`${idPrefix}-status`}
          label="Booking status"
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
    </>
  )
}
