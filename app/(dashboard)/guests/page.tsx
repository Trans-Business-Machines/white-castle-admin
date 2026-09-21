import { NewGuestDialog } from "@/components/guests/guest-add-dialog"
import { GuestStatsCards } from "@/components/guests/guest-stats-cards"
import { GuestsTable } from "@/components/guests/guests-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function Guests() {
  return (
    <section>
      <div className="mb-4 flex justify-end gap-2">
        <NewGuestDialog>
          <Button className="h-11 rounded-md bg-brand-azure px-5 text-white hover:bg-brand-azure/90 focus-visible:ring-brand-azure/30">
            <span className="text-base text-white">Add Guest</span>
            <Plus size={22} color="#ffffff" className="font-bold" />
          </Button>
        </NewGuestDialog>
      </div>

      {/* Guest statistics */}
      <GuestStatsCards />

      {/* Guest listings */}
      <div className="mt-6">
        <GuestsTable />
      </div>
    </section>
  )
}
