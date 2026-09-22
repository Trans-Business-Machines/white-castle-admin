"use client"

import { useRouter } from "next/navigation"
import {
  BadgeCheck,
  Ban,
  CircleCheck,
  CircleX,
  EllipsisVertical,
  Eye,
  LogIn,
  LogOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Booking } from "@/lib/types"

/** Builds the details route for a booking. */
export function getBookingHref(bookingId: string) {
  return `/bookings/${encodeURIComponent(bookingId)}`
}

type BookingAction =
  "approve" | "reject" | "cancel" | "confirm_payment" | "check_in" | "check_out"

interface BookingActionsMenuProps {
  booking: Booking
  /** Hide "View booking" when the menu already sits on the details page. */
  showView?: boolean
}

function BookingActionsMenu({
  booking,
  showView = true,
}: BookingActionsMenuProps) {
  const router = useRouter()
  // TODO: wire each action to its endpoint (confirm dialog + useMutation,
  // invalidating `bookingsQueryKey`), following `user-actions-menu.tsx`.
  function handleAction(action: BookingAction) {
    void action
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Actions for booking ${booking.reference}`}
          className="rounded-full text-muted-foreground hover:text-foreground data-open:bg-muted"
        >
          <EllipsisVertical aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {showView ? (
          <>
            <DropdownMenuItem
              onSelect={() => router.push(getBookingHref(booking.booking_id))}
            >
              <Eye aria-hidden="true" />
              View booking
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        ) : null}
        <DropdownMenuItem onSelect={() => handleAction("approve")}>
          <CircleCheck aria-hidden="true" />
          Approve
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => handleAction("confirm_payment")}>
          <BadgeCheck aria-hidden="true" />
          Confirm payment
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => handleAction("check_in")}>
          <LogIn aria-hidden="true" />
          Check in
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => handleAction("check_out")}>
          <LogOut aria-hidden="true" />
          Check out
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => handleAction("reject")}
        >
          <CircleX aria-hidden="true" />
          Reject
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => handleAction("cancel")}
        >
          <Ban aria-hidden="true" />
          Cancel booking
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { BookingActionsMenu }
