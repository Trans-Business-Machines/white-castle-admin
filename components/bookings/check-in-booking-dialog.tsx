"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { IdCard, Loader, LogIn } from "lucide-react"
import toast from "react-hot-toast"
import { GuestCombobox } from "@/components/bookings/guest-combobox"
import { EditGuestDialog } from "@/components/guests/edit-guest-dialog"
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
import {
  fetchGuestDetails,
  fetchGuests,
  guestQueryKey,
  guestsQueryKey,
} from "@/lib/api/guests"
import { unitsQueryKey } from "@/lib/api/units"
import type { BookingSubject } from "@/lib/bookings"
import { getMissingIdDetails } from "@/lib/guests"

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
 *
 * Nobody checks in without ID on record: the guest's details are fetched and
 * the Check in button stays disabled until they have an ID number and an
 * uploaded ID image. "Add ID details" swaps in the Update guest dialog; once
 * it saves, the guest query refreshes and check-in unlocks.
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
  const [editingGuest, setEditingGuest] = useState(false)

  // Only the "pick a guest" branch needs the list.
  const guests = useQuery({
    queryKey: guestsQueryKey,
    queryFn: fetchGuests,
    enabled: needsGuest,
  })

  // The chosen guest's full record, to confirm their ID is on file.
  const guest = useQuery({
    queryKey: guestQueryKey(guestId),
    queryFn: () => fetchGuestDetails(guestId),
    enabled: Boolean(guestId),
  })
  const missingId = guest.data ? getMissingIdDetails(guest.data) : []
  const idReady = guest.isSuccess && missingId.length === 0

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
    if (!idReady) return
    setError(null)
    mutation.mutate()
  }

  return (
    <>
      <Dialog
        open={!editingGuest}
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

          {guestId && guest.isPending ? (
            <p
              role="status"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground"
            >
              <Loader aria-hidden="true" className="size-4 animate-spin" />
              Checking the guest&apos;s ID details
            </p>
          ) : null}

          {guest.isError ? (
            <div
              role="alert"
              className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
            >
              <span>
                {getApiErrorMessage(
                  guest.error,
                  "We couldn't load this guest's ID details."
                )}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => guest.refetch()}
                className="rounded-full"
              >
                Retry
              </Button>
            </div>
          ) : null}

          {guest.data && missingId.length > 0 ? (
            <div
              role="alert"
              className="grid gap-3 rounded-md border border-amber-300 bg-amber-50 px-3.5 py-3 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200"
            >
              <p className="flex items-start gap-3">
                <IdCard aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
                <span>
                  {guest.data.full_name}&apos;s {missingId.join(" and ")}{" "}
                  {missingId.length > 1 ? "aren't" : "isn't"} on record. Add{" "}
                  {missingId.length > 1 ? "them" : "it"} before checking in.
                </span>
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={mutation.isPending}
                onClick={() => setEditingGuest(true)}
                className="justify-self-start rounded-full border-amber-300 bg-white text-amber-900 hover:bg-amber-100 dark:border-amber-500/40 dark:bg-transparent dark:text-amber-200 dark:hover:bg-amber-500/15"
              >
                <IdCard aria-hidden="true" />
                Add ID details
              </Button>
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
              disabled={mutation.isPending || (Boolean(guestId) && !idReady)}
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

      {/* Stands in for the check-in dialog while it's open; saving refreshes
        the guest query (prefix key), which re-runs the ID check. */}
      {guest.data ? (
        <EditGuestDialog
          guest={guest.data}
          open={editingGuest}
          onOpenChange={setEditingGuest}
        />
      ) : null}
    </>
  )
}

export { CheckInBookingDialog }
