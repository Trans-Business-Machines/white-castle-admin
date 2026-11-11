"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader, LogIn, Plus } from "lucide-react"
import toast from "react-hot-toast"
import { GuestCombobox } from "@/components/bookings/guest-combobox"
import { EditGuestDialog } from "@/components/guests/edit-guest-dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Textarea } from "@/components/ui/textarea"
import { bookingsQueryKey, checkInBooking } from "@/lib/api/bookings"
import { getApiErrorMessage } from "@/lib/api/errors"
import {
  bookingPaymentsQueryKey,
  fetchBookingPayments,
} from "@/lib/api/payments"
import { formatAmount, humanizeSlug } from "@/lib/format"
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
  const [allowUnpaid, setAllowUnpaid] = useState(false)
  const [overrideReason, setOverrideReason] = useState("")

  // Nothing recorded means the desk needs an explicit, audited override.
  const needsOverride = booking.payment_status.toLowerCase() === "unpaid"

  // Only the "pick a guest" branch needs the list.
  const guests = useQuery({
    queryKey: guestsQueryKey,
    queryFn: fetchGuests,
    enabled: needsGuest,
  })

  // Whatever has been recorded on the booking, so the desk can see that money
  // came in even before finance verifies it.
  const payments = useQuery({
    queryKey: bookingPaymentsQueryKey(booking.booking_id),
    queryFn: () => fetchBookingPayments(booking.booking_id),
  })
  const latestPayment = (payments.data ?? []).find(
    (payment) => payment.status !== "rejected"
  )
  const overrideReady =
    allowUnpaid && overrideReason.trim().length >= 5

  // The chosen guest's full record, to confirm their ID is on file.
  const guest = useQuery({
    queryKey: guestQueryKey(guestId),
    queryFn: () => fetchGuestDetails(guestId),
    enabled: Boolean(guestId),
  })
  const missingId = guest.data ? getMissingIdDetails(guest.data) : []
  const idReady = guest.isSuccess && missingId.length === 0

  const mutation = useMutation({
    mutationFn: () =>
      checkInBooking(booking.booking_id, {
        guest_id: guestId,
        ...(needsOverride
          ? {
              allow_unpaid: allowUnpaid,
              override_reason: overrideReason.trim(),
            }
          : {}),
      }),
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
    if (needsOverride && !allowUnpaid) {
      setError(
        "No payment is recorded. Tick the override box to check this guest in, or record a payment first."
      )
      return
    }
    if (needsOverride && overrideReason.trim().length < 5) {
      setError("Give a short reason for checking in without a recorded payment.")
      return
    }
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
        <DialogContent showCloseButton={false}>
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
              className="bg-tertiary-50 grid gap-3 rounded-md border border-tertiary px-3.5 py-3 text-sm text-tertiary"
            >
              <p className="flex items-start gap-3">
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
                className="flex-1 justify-self-start rounded-full border-tertiary bg-white text-tertiary hover:bg-tertiary hover:text-white"
              >
                <Plus aria-hidden="true" />
                Add ID details
              </Button>
            </div>
          ) : null}

          <div className="grid gap-2 rounded-md border bg-muted/40 px-3.5 py-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Payment status</span>
              <span className="font-semibold">
                {humanizeSlug(booking.payment_status)}
              </span>
            </div>
            {latestPayment ? (
              <p className="text-muted-foreground">
                {formatAmount(latestPayment.amount, latestPayment.currency)}{" "}
                recorded ({latestPayment.status}
                {latestPayment.reference
                  ? `, ${latestPayment.reference}`
                  : ""}
                ). It can be checked in while finance verifies it.
              </p>
            ) : (
              <p className="text-muted-foreground">
                No payment is recorded on this booking.
              </p>
            )}
          </div>

          {needsOverride ? (
            <div className="grid gap-3 rounded-md border border-tertiary/40 bg-tertiary/10 px-3.5 py-3 text-sm text-tertiary">
              <label className="flex items-start gap-2.5">
                <Checkbox
                  checked={allowUnpaid}
                  onCheckedChange={(checked) =>
                    setAllowUnpaid(checked === true)
                  }
                  disabled={mutation.isPending}
                  className="mt-0.5"
                />
                <span>
                  Check in without a recorded payment. This is allowed when
                  finance is unavailable, and is recorded in the audit log.
                </span>
              </label>
              {allowUnpaid ? (
                <div className="grid gap-1.5">
                  <Label
                    htmlFor="check-in-override-reason"
                    className="text-xs font-semibold tracking-wide uppercase"
                  >
                    Reason
                  </Label>
                  <Textarea
                    id="check-in-override-reason"
                    value={overrideReason}
                    onChange={(event) => setOverrideReason(event.target.value)}
                    disabled={mutation.isPending}
                    rows={2}
                    placeholder="e.g. Guest paid cash; finance unavailable to verify"
                    aria-invalid={
                      Boolean(error) && overrideReason.trim().length < 5
                    }
                  />
                </div>
              ) : null}
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
              disabled={
                mutation.isPending ||
                (Boolean(guestId) && !idReady) ||
                (needsOverride && !overrideReady)
              }
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
