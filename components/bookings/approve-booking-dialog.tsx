"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { CircleCheck, Loader } from "lucide-react"
import toast from "react-hot-toast"
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
import { approveBooking, bookingsQueryKey } from "@/lib/api/bookings"
import { getApiErrorMessage } from "@/lib/api/errors"
import { useAuth } from "@/providers/auth-provider"
import type { Booking } from "@/lib/types"

interface ApproveBookingDialogProps {
  booking: Pick<Booking, "booking_id" | "reference" | "guest_name">
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Confirms approving a booking request (`PATCH /bookings/{id}/approve`).
 * `approved_by` is the signed-in staff member's `user_id`; the deposit
 * toggle defaults to on, which is how requests from the website are
 * normally held.
 */
function ApproveBookingDialog(props: ApproveBookingDialogProps) {
  // Mounted only while open so the deposit toggle resets each time.
  if (!props.open) return null
  return <ApproveForm {...props} />
}

function ApproveForm({
  booking,
  onOpenChange,
}: Omit<ApproveBookingDialogProps, "open">) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [depositRequired, setDepositRequired] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => {
      if (!user) throw new Error("Sign in again to approve this request.")
      return approveBooking(booking.booking_id, {
        approved_by: user.user_id,
        deposit_required: depositRequired,
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: bookingsQueryKey })
      toast.success(`Booking ${booking.reference} was approved.`)
      onOpenChange(false)
    },
    onError: (err) => {
      setError(
        getApiErrorMessage(
          err,
          "We couldn't approve this booking request. Try again."
        )
      )
    },
  })

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        // Ignore Escape / backdrop clicks while a request is in flight.
        if (mutation.isPending) return
        if (!next) onOpenChange(false)
      }}
    >
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Approve booking {booking.reference}?
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            {booking.guest_name}&apos;s request will be moved to{" "}
            <span className="font-semibold text-foreground">approved</span> and
            will leave this list. You can still confirm payment, check them in
            or cancel it from the bookings page.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-3 rounded-lg bg-canvas px-3.5 py-3 dark:bg-input/30">
          <Checkbox
            id="approve-deposit-required"
            checked={depositRequired}
            onCheckedChange={(checked) => setDepositRequired(checked === true)}
            disabled={mutation.isPending}
            className="mt-0.5"
          />
          <div className="grid gap-1">
            <Label
              htmlFor="approve-deposit-required"
              className="text-base font-semibold text-foreground"
            >
              Require a deposit
            </Label>
            <p className="text-sm text-muted-foreground">
              The guest must pay the deposit before the booking is confirmed.
            </p>
          </div>
        </div>

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
            onClick={() => mutation.mutate()}
            className="h-11 rounded-full bg-brand-azure px-5 text-white hover:bg-brand-azure/90 focus-visible:ring-brand-azure/30"
          >
            {mutation.isPending ? (
              <span className="inline-flex items-center gap-2">
                <Loader aria-hidden="true" className="animate-spin" />
                Approving
              </span>
            ) : (
              <>
                <CircleCheck aria-hidden="true" />
                Approve booking
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { ApproveBookingDialog }
