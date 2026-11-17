"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  BadgeCheck,
  Ban,
  CircleX,
  EllipsisVertical,
  Eye,
  ShieldAlert,
  ShieldCheck,
  SquarePen,
  Trash2,
  UserRoundSearch,
} from "lucide-react"
import toast from "react-hot-toast"
import { BlacklistGuestDialog } from "@/components/guests/blacklist-guest-dialog"
import { BlacklistRecommendDialog } from "@/components/guests/blacklist-recommend-dialog"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { DeleteGuestDialog } from "@/components/guests/delete-guest-dialog"
import { EditGuestDialog } from "@/components/guests/edit-guest-dialog"
import { RevealGuestPiiDialog } from "@/components/guests/reveal-guest-pii-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getApiErrorMessage } from "@/lib/api/errors"
import {
  approveBlacklistRecommendation,
  dismissBlacklistRecommendation,
  guestsQueryKey,
} from "@/lib/api/guests"
import { hasPermission } from "@/lib/roles"
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
  const [revealOpen, setRevealOpen] = useState(false)
  const [recommendOpen, setRecommendOpen] = useState(false)
  const [recommendDecision, setRecommendDecision] = useState<
    "approve" | "dismiss" | null
  >(null)
  const [recommendError, setRecommendError] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const canUpdate = hasPermission(user?.permissions, "guests:update")
  const canBlacklist = hasPermission(user?.permissions, "guests:blacklist")
  const canDelete = hasPermission(user?.permissions, "guests:delete")
  const canViewPii = hasPermission(user?.permissions, "guests:pii:view")
  const canRevealPii = hasPermission(user?.permissions, "guests:pii:reveal")
  const canRecommend = hasPermission(
    user?.permissions,
    "guests:blacklist:recommend"
  )

  const recommendation = useMutation({
    mutationFn: (decision: "approve" | "dismiss") =>
      decision === "approve"
        ? approveBlacklistRecommendation(guest.guest_id)
        : dismissBlacklistRecommendation(guest.guest_id),
    onSuccess: async (_, decision) => {
      await queryClient.invalidateQueries({ queryKey: guestsQueryKey })
      toast.success(
        decision === "approve"
          ? `${guest.full_name} was blacklisted.`
          : `Blacklist recommendation for ${guest.full_name} dismissed.`
      )
      setRecommendDecision(null)
      setRecommendError(null)
    },
    onError: (error) => {
      setRecommendError(
        getApiErrorMessage(error, "We couldn't update this recommendation.")
      )
    },
  })

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
          {guest.pii_masked && canRevealPii ? (
            <DropdownMenuItem onSelect={() => setRevealOpen(true)}>
              <UserRoundSearch aria-hidden="true" />
              Reveal contact details
            </DropdownMenuItem>
          ) : null}
          {canUpdate && (!guest.pii_masked || canViewPii) ? (
            <DropdownMenuItem onSelect={() => setAction("edit")}>
              <SquarePen aria-hidden="true" />
              Update
            </DropdownMenuItem>
          ) : null}
          {canBlacklist && guest.blacklist_recommended ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => {
                  setRecommendError(null)
                  setRecommendDecision("approve")
                }}
              >
                <BadgeCheck aria-hidden="true" />
                Approve blacklist
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  setRecommendError(null)
                  setRecommendDecision("dismiss")
                }}
              >
                <CircleX aria-hidden="true" />
                Dismiss recommendation
              </DropdownMenuItem>
            </>
          ) : null}
          {canRecommend && !guest.blacklisted ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={guest.blacklist_recommended}
                onSelect={() => setRecommendOpen(true)}
              >
                <ShieldAlert aria-hidden="true" />
                {guest.blacklist_recommended
                  ? "Recommendation pending"
                  : "Recommend blacklist"}
              </DropdownMenuItem>
            </>
          ) : null}
          {canBlacklist ? (
            <>
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
            </>
          ) : null}
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

      {canUpdate && (!guest.pii_masked || canViewPii) ? (
        <EditGuestDialog
          guest={guest}
          open={action === "edit"}
          onOpenChange={(open) => setAction(open ? "edit" : null)}
        />
      ) : null}
      {canBlacklist ? (
        <BlacklistGuestDialog
          guest={guest}
          open={action === "blacklist"}
          onOpenChange={(open) => setAction(open ? "blacklist" : null)}
        />
      ) : null}
      <RevealGuestPiiDialog
        guest={guest}
        open={revealOpen}
        onOpenChange={setRevealOpen}
      />

      <BlacklistRecommendDialog
        guest={guest}
        open={recommendOpen}
        onOpenChange={setRecommendOpen}
      />

      <ConfirmDialog
        open={Boolean(recommendDecision)}
        onOpenChange={(next) => {
          if (!next && !recommendation.isPending) {
            setRecommendDecision(null)
            setRecommendError(null)
          }
        }}
        title={
          recommendDecision === "approve"
            ? `Blacklist ${guest.full_name}?`
            : `Dismiss this recommendation?`
        }
        description={
          recommendDecision === "approve"
            ? `This confirms the recommendation${
                guest.blacklist_recommendation_reason
                  ? `: "${guest.blacklist_recommendation_reason}"`
                  : ""
              }. ${guest.full_name} won't be able to make new bookings.`
            : `The recommendation will be cleared. ${guest.full_name} stays in good standing.`
        }
        confirmLabel={
          recommendDecision === "approve" ? "Blacklist guest" : "Dismiss"
        }
        pendingLabel={
          recommendDecision === "approve" ? "Blacklisting" : "Dismissing"
        }
        destructive={recommendDecision === "approve"}
        isPending={recommendation.isPending}
        error={recommendError}
        onConfirm={() =>
          recommendDecision && recommendation.mutate(recommendDecision)
        }
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
