"use client"

import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NewRoomDialog } from "@/components/units/add-unit-dialog"
import { hasRole, UNIT_MANAGE_ROLES } from "@/lib/roles"
import { useAuth } from "@/providers/auth-provider"

/** The Add Unit CTA row; super admins and admins only (`UNIT_MANAGE_ROLES`). */
export function AddUnitButton() {
  const { user } = useAuth()

  if (!hasRole(user?.role, UNIT_MANAGE_ROLES)) return null

  return (
    <div className="mb-4 flex justify-end gap-2">
      <NewRoomDialog>
        <Button className="h-11 rounded-md bg-brand-azure px-5 text-white hover:bg-brand-azure/90 focus-visible:ring-brand-azure/30">
          <span className="text-base text-white">Add Unit</span>
          <Plus size={22} color="#ffffff" className="font-bold" />
        </Button>
      </NewRoomDialog>
    </div>
  )
}
