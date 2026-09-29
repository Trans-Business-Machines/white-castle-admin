"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Ban,
  CalendarPlus,
  CircleCheck,
  CircleX,
  EllipsisVertical,
  Eye,
  LogIn,
  LogOut,
  Trash2,
  UserPlus,
} from "lucide-react"
import { ApproveBookingDialog } from "@/components/bookings/approve-booking-dialog"
import {
  BookingActionDialog,
  type BookingDialogAction,
} from "@/components/bookings/booking-action-dialog"
import { BookingReasonDialog } from "@/components/bookings/booking-reason-dialog"
import { DeleteBookingDialog } from "@/components/bookings/delete-booking-dialog"
import { ExtendBookingDialog } from "@/components/bookings/extend-booking-dialog"
import { ExtraPersonsDialog } from "@/components/bookings/extra-persons-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  canCancel,
  canChangeStay,
  canCheckIn,
  canCheckOut,
  canDeleteBooking,
  hasOutstandingStayPayment,
} from "@/lib/bookings"
import { BOOKING_DELETE_ROLES, hasRole } from "@/lib/roles"
import type { Booking } from "@/lib/types"
import { useAuth } from "@/providers/auth-provider"

/** Builds the details route for a booking. */
export function getBookingHref(bookingId: string) {
  return `/bookings/${encodeURIComponent(bookingId)}`
}

/** Dialogs the menu renders itself rather than via `BookingActionDialog`. */
type OwnDialog = "approve" | "reject" | "extend" | "extra_persons" | "delete"

/** Which action opened a dialog, if any. */
type BookingDialog = OwnDialog | BookingDialogAction

const OWN_DIALOGS: ReadonlySet<string> = new Set<OwnDialog>([
  "approve",
  "reject",
  "extend",
  "extra_persons",
  "delete",
])

function isOwnDialog(dialog: BookingDialog): dialog is OwnDialog {
  return OWN_DIALOGS.has(dialog)
}

interface BookingActionsMenuProps {
  booking: Booking
  /** Hide "View booking" when the menu already sits on the details page. */
  showView?: boolean
  /**
   * `"request"` offers Approve / Reject (the pending-request decisions on
   * `/requests`); `"booking"` offers the lifecycle actions on `/bookings`.
   */
  variant?: "booking" | "request"
  /** Runs after the booking is deleted, e.g. to leave its details page. */
  onDeleted?: () => void
}

function BookingActionsMenu({
  booking,
  showView = true,
  variant = "booking",
  onDeleted,
}: BookingActionsMenuProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [dialog, setDialog] = useState<BookingDialog | null>(null)

  const isRequest = variant === "request"
  // Super admins only; a guest who is in the room keeps their booking.
  const showDelete = hasRole(user?.role, BOOKING_DELETE_ROLES)

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
              <DropdownMenuItem
                disabled={!canCheckIn(booking)}
                onSelect={() => setDialog("check_in")}
              >
                <LogIn aria-hidden="true" />
                Check in
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!canCheckOut(booking)}
                onSelect={() => setDialog("check_out")}
              >
                <LogOut aria-hidden="true" />
                Check out
              </DropdownMenuItem>
              {hasOutstandingStayPayment(booking) ? (
                <DropdownMenuLabel className="max-w-56 text-xs font-normal text-muted-foreground">
                  Check-out opens once the payment for the added nights or
                  guests is verified.
                </DropdownMenuLabel>
              ) : null}
              {/* Only a stay that's underway can grow. */}
              {canChangeStay(booking) ? (
                <>
                  <DropdownMenuItem onSelect={() => setDialog("extend")}>
                    <CalendarPlus aria-hidden="true" />
                    Extend booking
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setDialog("extra_persons")}>
                    <UserPlus aria-hidden="true" />
                    Extra person
                  </DropdownMenuItem>
                </>
              ) : null}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                disabled={!canCancel(booking)}
                onSelect={() => setDialog("cancel")}
              >
                <Ban aria-hidden="true" />
                Cancel booking
              </DropdownMenuItem>
            </>
          )}

          {showDelete ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                disabled={!canDeleteBooking(booking)}
                onSelect={() => setDialog("delete")}
              >
                <Trash2 aria-hidden="true" />
                Delete booking
              </DropdownMenuItem>
            </>
          ) : null}
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
        <>
          <BookingActionDialog
            booking={booking}
            action={dialog && !isOwnDialog(dialog) ? dialog : null}
            onClose={() => setDialog(null)}
          />
          <ExtendBookingDialog
            booking={booking}
            open={dialog === "extend"}
            onOpenChange={(open) => setDialog(open ? "extend" : null)}
          />
          <ExtraPersonsDialog
            booking={booking}
            open={dialog === "extra_persons"}
            onOpenChange={(open) => setDialog(open ? "extra_persons" : null)}
          />
        </>
      )}

      {showDelete ? (
        <DeleteBookingDialog
          booking={booking}
          open={dialog === "delete"}
          onOpenChange={(open) => setDialog(open ? "delete" : null)}
          onDeleted={onDeleted}
        />
      ) : null}
    </>
  )
}

export { BookingActionsMenu }
