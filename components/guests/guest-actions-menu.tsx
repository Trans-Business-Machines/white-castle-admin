"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Ban,
  EllipsisVertical,
  Eye,
  ShieldCheck,
  SquarePen,
} from "lucide-react"
import { BlacklistGuestDialog } from "@/components/guests/blacklist-guest-dialog"
import { EditGuestDialog } from "@/components/guests/edit-guest-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Guest } from "@/lib/types"

/** Builds the profile route for a guest. */
export function getGuestHref(guestId: string) {
  return `/guests/${encodeURIComponent(guestId)}`
}

type GuestAction = "edit" | "blacklist"

function GuestActionsMenu({ guest }: { guest: Guest }) {
  const router = useRouter()
  const [action, setAction] = useState<GuestAction | null>(null)

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
    </>
  )
}

export { GuestActionsMenu }
