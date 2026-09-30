"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeftRight,
  EllipsisVertical,
  Eye,
  SquarePen,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DeleteUnitDialog } from "@/components/units/delete-unit-dialog"
import { EditUnitDialog } from "@/components/units/edit-unit-dialog"
import { UpdateUnitStatusDialog } from "@/components/units/update-unit-status-dialog"
import { hasRole, UNIT_MANAGE_ROLES, UNIT_STATUS_ROLES } from "@/lib/roles"
import { isSettableUnitStatus } from "@/lib/schemas/units"
import type { Unit } from "@/lib/types"
import { useAuth } from "@/providers/auth-provider"

/** Builds the details route for a room. */
export function getUnitHref(roomId: string) {
  return `/units/${encodeURIComponent(roomId)}`
}

type UnitAction = "edit" | "status" | "delete"

function UnitActionsMenu({ unit }: { unit: Unit }) {
  const router = useRouter()
  const { user } = useAuth()
  const [action, setAction] = useState<UnitAction | null>(null)
  // Receptionists and housekeeping only get View and Update status.
  const canManage = hasRole(user?.role, UNIT_MANAGE_ROLES)
  const canSetStatus = hasRole(user?.role, UNIT_STATUS_ROLES)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for room ${unit.room_number}`}
            className="rounded-full text-muted-foreground hover:text-foreground data-open:bg-muted"
          >
            <EllipsisVertical aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem
            onSelect={() => router.push(getUnitHref(unit.room_id))}
          >
            <Eye aria-hidden="true" />
            View
          </DropdownMenuItem>
          {canManage ? (
            <DropdownMenuItem onSelect={() => setAction("edit")}>
              <SquarePen aria-hidden="true" />
              Update
            </DropdownMenuItem>
          ) : null}
          {canSetStatus ? (
            // An occupied room's status follows check-in / out.
            <DropdownMenuItem
              disabled={!isSettableUnitStatus(unit.status)}
              onSelect={() => setAction("status")}
            >
              <ArrowLeftRight aria-hidden="true" />
              Update status
            </DropdownMenuItem>
          ) : null}
          {canManage ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => setAction("delete")}
              >
                <Trash2 aria-hidden="true" />
                Delete
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <EditUnitDialog
        unit={unit}
        open={action === "edit"}
        onOpenChange={(open) => setAction(open ? "edit" : null)}
      />
      <UpdateUnitStatusDialog
        unit={unit}
        open={action === "status"}
        onOpenChange={(open) => setAction(open ? "status" : null)}
      />
      <DeleteUnitDialog
        unit={unit}
        open={action === "delete"}
        onOpenChange={(open) => setAction(open ? "delete" : null)}
      />
    </>
  )
}

export { UnitActionsMenu }
