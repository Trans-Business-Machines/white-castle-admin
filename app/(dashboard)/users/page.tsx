"use client"

import { Button } from "@/components/ui/button"
import { UserPlus } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { UsersTable } from "@/components/users/users-table"
import { RolesTable } from "@/components/users/roles-table"
import { CreateUserDialog } from "@/components/users/create-user-dialog"
import { UserStatsCards } from "@/components/users/user-stats-cards"
import { RequirePermission } from "@/components/auth/require-permission"
import { hasPermission } from "@/lib/roles"
import { useAuth } from "@/providers/auth-provider"

export default function Users() {
  return (
    <RequirePermission permission="users:view" area="user management">
      <UsersContent />
    </RequirePermission>
  )
}

function UsersContent() {
  const { user } = useAuth()
  const canCreate = hasPermission(user?.permissions, "users:create")
  const canViewRoles = hasPermission(user?.permissions, "roles:view")

  return (
    <section>
      {/* Top right CTA */}
      {canCreate ? (
        <div className="mb-4 flex justify-end">
          <CreateUserDialog>
            <Button className="h-11 rounded-md bg-brand-azure px-5 text-white hover:bg-brand-azure/90 focus-visible:ring-brand-azure/30">
              <span className="text-base text-white">Create New User</span>
              <UserPlus size={22} color="#ffffff" className="font-bold" />
            </Button>
          </CreateUserDialog>
        </div>
      ) : null}

      {/* User Statistics */}
      <UserStatsCards />

      {/* Tabs section */}
      <Tabs defaultValue="users" className="mt-6">
        <TabsList className={canViewRoles ? "w-7/12" : "w-5/12"}>
          <TabsTrigger value="users">Users</TabsTrigger>
          {canViewRoles ? <TabsTrigger value="roles">Roles</TabsTrigger> : null}
        </TabsList>

        <TabsContent value="users">
          <UsersTable />
        </TabsContent>
        {canViewRoles ? (
          <TabsContent value="roles">
            <RolesTable />
          </TabsContent>
        ) : null}
      </Tabs>
    </section>
  )
}
