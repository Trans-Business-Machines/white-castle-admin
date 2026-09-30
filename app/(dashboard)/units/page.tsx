import { AddUnitButton } from "@/components/units/add-unit-button"
import { UnitStatsCards } from "@/components/units/unit-stats-card"
import { UnitsTable } from "@/components/units/units-table"

export default function Units() {
  return (
    <section>
     
      <AddUnitButton />
      <UnitStatsCards />

      {/* Unit Listings */}
      <UnitsTable />
    </section>
  )
}
