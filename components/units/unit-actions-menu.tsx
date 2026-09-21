"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { EllipsisVertical, Eye, SquarePen, Trash2 } from "lucide-react"
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
import type { Unit } from "@/lib/types"

/** Builds the details route for a room. */
export function getUnitHref(roomId: string) {
  return `/units/${encodeURIComponent(roomId)}`
}

type UnitAction = "edit" | "delete"

function UnitActionsMenu({ unit }: { unit: Unit }) {
  const router = useRouter()
  const [action, setAction] = useState<UnitAction | null>(null)

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
          <DropdownMenuItem onSelect={() => setAction("edit")}>
            <SquarePen aria-hidden="true" />
            Update
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setAction("delete")}
          >
            <Trash2 aria-hidden="true" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditUnitDialog
        unit={unit}
        open={action === "edit"}
        onOpenChange={(open) => setAction(open ? "edit" : null)}
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
