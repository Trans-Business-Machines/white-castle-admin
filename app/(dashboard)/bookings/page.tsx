import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { BookingStatsCards } from "@/components/bookings/booking-stats-cards"
import { BookingsTable } from "@/components/bookings/bookings-table"
import { NewBookingDialog } from "@/components/bookings/new-booking-dialog"

export default function Bookings() {
  return (
    <section>
      {/* Create booking CTA */}
      <div className="mb-4 flex justify-end gap-2">
        <NewBookingDialog>
          <Button className="h-11 rounded-md bg-brand-azure px-5 text-white hover:bg-brand-azure/90 focus-visible:ring-brand-azure/30">
            <span className="text-base text-white">Create booking</span>
            <Plus size={22} color="#ffffff" className="font-bold" />
          </Button>
        </NewBookingDialog>
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
