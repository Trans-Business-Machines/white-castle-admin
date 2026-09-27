"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Ban,
  EllipsisVertical,
  Eye,
  ShieldCheck,
  SquarePen,
  Trash2,
} from "lucide-react"
import { BlacklistGuestDialog } from "@/components/guests/blacklist-guest-dialog"
import { DeleteGuestDialog } from "@/components/guests/delete-guest-dialog"
import { EditGuestDialog } from "@/components/guests/edit-guest-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { GUEST_DELETE_ROLES, hasRole } from "@/lib/roles"
import type { Guest } from "@/lib/types"
import { useAuth } from "@/providers/auth-provider"

/** Builds the profile route for a guest. */
export function getGuestHref(guestId: string) {
  return `/guests/${encodeURIComponent(guestId)}`
}

type GuestAction = "edit" | "blacklist" | "delete"

function GuestActionsMenu({ guest }: { guest: Guest }) {
  const router = useRouter()
  const { user } = useAuth()
  const [action, setAction] = useState<GuestAction | null>(null)
  // Only admins and super admins see the item at all.
  const canDelete = hasRole(user?.role, GUEST_DELETE_ROLES)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${guest.full_name}`}
            className="rounded-full text-muted-foreground hover:text-foreground data-open:bg-muted"
          >
            <EllipsisVertical aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem
            onSelect={() => router.push(getGuestHref(guest.guest_id))}
          >
            <Eye aria-hidden="true" />
            View guest
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setAction("edit")}>
            <SquarePen aria-hidden="true" />
            Update
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {guest.blacklisted ? (
            <DropdownMenuItem onSelect={() => setAction("blacklist")}>
              <ShieldCheck aria-hidden="true" />
              Remove from blacklist
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => setAction("blacklist")}
            >
              <Ban aria-hidden="true" />
              Blacklist guest
            </DropdownMenuItem>
          )}
          {canDelete ? (
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => setAction("delete")}
            >
              <Trash2 aria-hidden="true" />
              Delete guest
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <EditGuestDialog
        guest={guest}
        open={action === "edit"}
        onOpenChange={(open) => setAction(open ? "edit" : null)}
      />
      <BlacklistGuestDialog
        guest={guest}
        open={action === "blacklist"}
        onOpenChange={(open) => setAction(open ? "blacklist" : null)}
      />
      {canDelete ? (
        <DeleteGuestDialog
          guest={guest}
          open={action === "delete"}
          onOpenChange={(open) => setAction(open ? "delete" : null)}
        />
      ) : null}
    </>
  )
}

export { GuestActionsMenu }
