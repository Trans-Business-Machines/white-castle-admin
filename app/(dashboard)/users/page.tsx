import { StatCard } from "@/components/stat-card"
import { Button } from "@/components/ui/button"
import { UserPlus, Plus } from "lucide-react"
import { userStats } from "@/lib/data"

export default function Users() {
  return (
    <section>
      {/* Top right CTA buttons */}
      <div className="mb-4 flex justify-end gap-2">
        <Button className="h-11 rounded-md bg-brand-azure px-5 text-white hover:bg-brand-azure/90 focus-visible:ring-brand-azure/30">
          <span className="text-base text-white">Add Role</span>
          <Plus size={22} color="#ffffff" className="font-bold" />
        </Button>

        <Button className="h-11 bg-brand-azure px-5 text-white hover:bg-brand-azure/90 focus-visible:ring-brand-azure/30">
          <span className="text-base text-white">Create New User</span>
          <UserPlus size={22} color="#ffffff" className="font-bold" />
        </Button>
      </div>

      {/* User Statistics */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        {userStats.map((stat) => (
          <StatCard
            key={`${stat.role}-${stat.count}`}
            label={stat.count > 1 ? "accounts" : "account"}
            title={stat.role}
            text={String(stat.count)}
          />
        ))}
      </div>
    </section>
  )
}
