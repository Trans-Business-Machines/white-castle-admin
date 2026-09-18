import { StatCard } from "@/components/stat-card"
import { Button } from "@/components/ui/button"
import { UserPlus, Plus } from "lucide-react"
import { userStats } from "@/lib/data"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { UsersTable } from "@/components/users/users-table"
import { RolesTable } from "@/components/users/roles-table"
import { NewRoleDialog } from "@/components/users/add-role-dialog"
import { CreateUserDialog } from "@/components/users/create-user-dialog"

export default function Users() {
  return (
    <section>
      {/* Top right CTA buttons */}
      <div className="mb-4 flex justify-end gap-2">
        <NewRoleDialog>
          <Button className="h-11 rounded-md bg-brand-azure px-5 text-white hover:bg-brand-azure/90 focus-visible:ring-brand-azure/30">
            <span className="text-base text-white">Add Role</span>
            <Plus size={22} color="#ffffff" className="font-bold" />
          </Button>
        </NewRoleDialog>

        <CreateUserDialog>
          <Button className="h-11 rounded-md bg-brand-azure px-5 text-white hover:bg-brand-azure/90 focus-visible:ring-brand-azure/30">
            <span className="text-base text-white">Create New User</span>
            <UserPlus size={22} color="#ffffff" className="font-bold" />
          </Button>
        </CreateUserDialog>
      </div>

      {/* User Statistics */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        {userStats.map((stat) => (
          <StatCard
            key={`${stat.role}-${stat.count}`}
            label={stat.count > 1 ? "accounts" : "account"}
            title={stat.role}
            role={stat.role}
            text={String(stat.count)}
          />
        ))}
      </div>

      {/* Tabs section */}
      <Tabs defaultValue="users" className="mt-6">
        <TabsList className="w-7/12">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UsersTable />
        </TabsContent>
        <TabsContent value="roles">
          <RolesTable />
        </TabsContent>
      </Tabs>
    </section>
  )
}
