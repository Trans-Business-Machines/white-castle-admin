"use client"

import { useState } from "react"
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
import { ApproveBookingDialog } from "@/components/bookings/approve-booking-dialog"
import {
  BookingActionDialog,
  type BookingDialogAction,
} from "@/components/bookings/booking-action-dialog"
import { BookingReasonDialog } from "@/components/bookings/booking-reason-dialog"
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

/** Which action opened a dialog, if any. */
type BookingDialog = "approve" | "reject" | BookingDialogAction

interface BookingActionsMenuProps {
  booking: Booking
  /** Hide "View booking" when the menu already sits on the details page. */
  showView?: boolean
  /**
   * `"request"` offers Approve / Reject (the pending-request decisions on
   * `/requests`); `"booking"` offers the lifecycle actions on `/bookings`.
   */
  variant?: "booking" | "request"
}

function BookingActionsMenu({
  booking,
  showView = true,
  variant = "booking",
}: BookingActionsMenuProps) {
  const router = useRouter()
  const [dialog, setDialog] = useState<BookingDialog | null>(null)

  const isRequest = variant === "request"

  return (
    <>
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

          {isRequest ? (
            <>
              <DropdownMenuItem onSelect={() => setDialog("approve")}>
                <CircleCheck aria-hidden="true" />
                Approve
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => setDialog("reject")}
              >
                <CircleX aria-hidden="true" />
                Reject
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuItem onSelect={() => setDialog("confirm_payment")}>
                <BadgeCheck aria-hidden="true" />
                Confirm payment
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setDialog("check_in")}>
                <LogIn aria-hidden="true" />
                Check in
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setDialog("check_out")}>
                <LogOut aria-hidden="true" />
                Check out
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => setDialog("cancel")}
              >
                <Ban aria-hidden="true" />
                Cancel booking
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {isRequest ? (
        <>
          <ApproveBookingDialog
            booking={booking}
            open={dialog === "approve"}
            onOpenChange={(open) => setDialog(open ? "approve" : null)}
          />
          <BookingReasonDialog
            booking={booking}
            action="reject"
            open={dialog === "reject"}
            onOpenChange={(open) => setDialog(open ? "reject" : null)}
          />
        </>
      ) : (
        <BookingActionDialog
          booking={booking}
          action={dialog === "approve" || dialog === "reject" ? null : dialog}
          onClose={() => setDialog(null)}
        />
      )}
    </>
  )
}

export { BookingActionsMenu }
