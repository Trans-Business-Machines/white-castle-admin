"use client"

import type { ReactNode } from "react"
import {
  ReportDateRangeFields,
  ReportSelectField,
} from "@/components/reports/report-param-fields"
import { ReportParamsDialog } from "@/components/reports/report-params-dialog"
import type { BookingsReportFilters } from "@/lib/api/reports"
import { BOOKING_STATUSES } from "@/lib/bookings"
import { humanizeSlug } from "@/lib/format"
import { EMPTY_BOOKINGS_REPORT_FILTERS } from "@/lib/reports"
import { MEAL_PLANS } from "@/lib/schemas/bookings"
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

/** Date range, status, room type and meal plan (all optional) → `/reports/bookings`. */
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
        <>
          <ReportDateRangeFields
            idPrefix="bookings-report"
            value={filters}
            onChange={update}
          />
          <ReportSelectField
            id="bookings-report-status"
            label="Status"
            allLabel="All statuses"
            value={filters.status}
            options={STATUS_OPTIONS}
            onChange={(status) => update({ status })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <ReportSelectField
              id="bookings-report-room-type"
              label="Room type"
              allLabel="All room types"
              value={filters.room_type}
              options={ROOM_TYPES}
              onChange={(room_type) => update({ room_type })}
            />
            <ReportSelectField
              id="bookings-report-meal-plan"
              label="Meal plan"
              allLabel="All meal plans"
              value={filters.meal_plan}
              options={MEAL_PLANS}
              onChange={(meal_plan) => update({ meal_plan })}
            />
          </div>
        </>
      )}
    >
      {children}
    </ReportParamsDialog>
  )
}
