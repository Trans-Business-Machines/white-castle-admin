"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader, LogIn } from "lucide-react"
import toast from "react-hot-toast"
import { GuestCombobox } from "@/components/bookings/guest-combobox"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { bookingsQueryKey, checkInBooking } from "@/lib/api/bookings"
import { getApiErrorMessage } from "@/lib/api/errors"
import { fetchGuests, guestsQueryKey } from "@/lib/api/guests"
import { unitsQueryKey } from "@/lib/api/units"
import type { BookingSubject } from "@/lib/bookings"

interface CheckInBookingDialogProps {
  booking: BookingSubject
  open: boolean
  onOpenChange: () => void
}

/**
 * Checks a guest into their room (`PATCH /bookings/{id}/checkin` with
 * `{ guest_id }`). Bookings made from the website aren't always tied to a
 * guest record, so when `guest_id` is missing the dialog asks which guest
 * is arriving instead of guessing.
 */
function CheckInBookingDialog({
  booking,
  open,
  onOpenChange,
}: CheckInBookingDialogProps) {
  // Mounted only while open so the picker resets between rows.
  if (!open) return null
  return <CheckInForm booking={booking} onClose={onOpenChange} />
}

function CheckInForm({
  booking,
  onClose,
}: {
  booking: BookingSubject
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const needsGuest = !booking.guest_id
  const [guestId, setGuestId] = useState(booking.guest_id ?? "")
  const [error, setError] = useState<string | null>(null)

  // Only the "pick a guest" branch needs the list.
  const guests = useQuery({
    queryKey: guestsQueryKey,
    queryFn: fetchGuests,
    enabled: needsGuest,
  })

  const mutation = useMutation({
    mutationFn: () => checkInBooking(booking.booking_id, { guest_id: guestId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: bookingsQueryKey })
      // The room becomes occupied.
      await queryClient.invalidateQueries({ queryKey: unitsQueryKey })
      toast.success(`${booking.guest_name} was checked in.`)
      onClose()
    },
    onError: (err) => {
      setError(
        getApiErrorMessage(err, "We couldn't check this guest in. Try again.")
      )
    },
  })

  function onConfirm() {
    if (!guestId) {
      setError("Choose the guest who is checking in.")
      return
    }
    setError(null)
    mutation.mutate()
  }

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        // Ignore Escape / backdrop clicks while a request is in flight.
        if (mutation.isPending) return
        if (!next) onClose()
      }}
    >
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Check {booking.guest_name} in?
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            This checks {booking.guest_name} into the room on booking{" "}
            {booking.reference} and marks the room as occupied.
            {needsGuest
              ? " This booking isn't linked to a guest record yet, so pick who is arriving."
              : ""}
          </DialogDescription>
        </DialogHeader>

        {needsGuest ? (
          <div className="grid gap-2">
            <Label
              htmlFor="check-in-guest"
              className="font-heading text-xs font-semibold tracking-wide text-iron uppercase"
            >
              Guest
            </Label>
            <GuestCombobox
              id="check-in-guest"
              value={guestId}
              onChange={(next) => {
                setGuestId(next)
                setError(null)
              }}
              guests={guests.data}
              loading={guests.isPending}
              disabled={mutation.isPending}
              invalid={Boolean(error) && !guestId}
              className="h-11 rounded-lg border-border bg-background px-3.5 text-base md:text-base"
            />
          </div>
        ) : null}

        {error ? (
          <p
            role="alert"
            className="rounded-md bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
          >
            {error}
          </p>
        ) : null}

        <DialogFooter>
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              disabled={mutation.isPending}
              className="h-11 rounded-full px-5"
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            disabled={mutation.isPending}
            onClick={onConfirm}
            className="h-11 rounded-full bg-brand-azure px-5 text-white hover:bg-brand-azure/90 focus-visible:ring-brand-azure/30"
          >
            {mutation.isPending ? (
              <span className="inline-flex items-center gap-2">
                <Loader aria-hidden="true" className="animate-spin" />
                Checking in
              </span>
            ) : (
              <>
                <LogIn aria-hidden="true" />
                Check in
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { CheckInBookingDialog }
