import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { NewRoomDialog } from "@/components/units/add-unit-dialog"
import { UnitStatsCards } from "@/components/units/unit-stats-card"
import { UnitsTable } from "@/components/units/units-table"

export default function Units() {
  return (
    <section>
      {/* Add unit CTA button */}
      <div className="mb-4 flex justify-end gap-2">
        <NewRoomDialog>
          <Button className="h-11 rounded-md bg-brand-azure px-5 text-white hover:bg-brand-azure/90 focus-visible:ring-brand-azure/30">
            <span className="text-base text-white">Add Unit</span>
            <Plus size={22} color="#ffffff" className="font-bold" />
          </Button>
        </NewRoomDialog>
      </div>

      {/* Occupancy statistics */}
      <UnitStatsCards />

      {/* Unit Listings */}
      <div className="mt-6">
        <UnitsTable />
      </div>
    </section>
  )
}
