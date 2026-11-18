"use client"

import { EMPTY_BOOKING_FILTERS } from "@/components/bookings/bookings-filters"
import {
  ExportExcelDialog,
  ExportStatusDateFields,
} from "@/components/export-file-dialog"
import { exportBookings } from "@/lib/api/bookings"
import { BOOKING_STATUSES } from "@/lib/bookings"

/** Bookings Excel export (`GET /bookings/export/bookings`); starts unfiltered. */
export function ExportBookingsDialog() {
  return (
    <ExportExcelDialog
      noun="bookings"
      description="Narrow the export down, or leave everything blank to export every booking."
      initialFilters={() => EMPTY_BOOKING_FILTERS}
      renderFields={(filters, update, disabled) => (
        <ExportStatusDateFields
          statuses={BOOKING_STATUSES}
          value={filters}
          onChange={update}
          disabled={disabled}
        />
      )}
      exportFile={exportBookings}
    />
  )
}
