import type { Metadata } from "next"
import { BookingRequestStatsCards } from "@/components/bookings/booking-request-stats-cards"
import { BookingsTable } from "@/components/bookings/bookings-table"

export const metadata: Metadata = {
  title: "Booking requests",
}

export default function Requests() {
  return (
    <section>
   
      {/* Totals for the pending requests */}
      <BookingRequestStatsCards />

      {/* Pending requests */}
      <div className="mt-6">
        <BookingsTable variant="requests" />
      </div>
    </section>
  )
}
