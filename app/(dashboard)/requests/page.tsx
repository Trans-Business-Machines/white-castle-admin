import type { Metadata } from "next"
import { BookingRequestsHeader } from "@/components/bookings/booking-requests-header"
import { BookingsTable } from "@/components/bookings/bookings-table"

export const metadata: Metadata = {
  title: "Booking requests",
}

export default function Requests() {
  return (
    <section>
      <BookingRequestsHeader />
      <BookingsTable variant="requests" />
    </section>
  )
}
