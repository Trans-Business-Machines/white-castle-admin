import { BookingStatsCards } from "@/components/bookings/booking-stats-cards"
import { BookingsTable } from "@/components/bookings/bookings-table"
import { CreateBookingDialog } from "@/components/bookings/create-booking-dialog"
import { ExportBookingsDialog } from "@/components/bookings/export-bookings-dialog"

export default function Bookings() {
  return (
    <section>
      {/* Export + create booking CTAs */}
      <div className="mb-4 flex flex-wrap justify-end gap-2">
        <ExportBookingsDialog />
        <CreateBookingDialog />
      </div>

      {/* Month-to-date booking statistics */}
      <BookingStatsCards />

      {/* Booking listings */}
      <div className="mt-6">
        <BookingsTable />
      </div>
    </section>
  )
}
