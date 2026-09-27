"use client"

import { EMPTY_BOOKING_FILTERS } from "@/components/bookings/bookings-filters"
import { ExportCsvDialog } from "@/components/export-csv-dialog"
import { exportBookings } from "@/lib/api/bookings"
import { BOOKING_STATUSES } from "@/lib/bookings"

/** Bookings CSV export (`GET /bookings/export/bookings`); starts unfiltered. */
export function ExportBookingsDialog() {
  return (
    <ExportCsvDialog
      noun="bookings"
      description="Narrow the export down, or leave everything blank to export every booking."
      statuses={BOOKING_STATUSES}
      initialFilters={() => EMPTY_BOOKING_FILTERS}
      exportFile={exportBookings}
    />
  )
}
