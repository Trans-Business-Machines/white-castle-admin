import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { BookingStatsCards } from "@/components/bookings/booking-stats-cards"
import { BookingsTable } from "@/components/bookings/bookings-table"
import { ExportBookingsDialog } from "@/components/bookings/export-bookings-dialog"
import { NewBookingDialog } from "@/components/bookings/new-booking-dialog"

export default function Bookings() {
  return (
    <section>
      {/* Export + create booking CTAs */}
      <div className="mb-4 flex flex-wrap justify-end gap-2">
        <ExportBookingsDialog />
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
