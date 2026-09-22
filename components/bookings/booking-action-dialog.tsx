"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { BookingReasonDialog } from "@/components/bookings/booking-reason-dialog"
import { CheckInBookingDialog } from "@/components/bookings/check-in-booking-dialog"
import { ConfirmDialog } from "@/components/confirm-dialog"
import {
  bookingsQueryKey,
  checkOutBooking,
  confirmBookingPayment,
} from "@/lib/api/bookings"
import { getApiErrorMessage } from "@/lib/api/errors"
import { unitsQueryKey } from "@/lib/api/units"
import type { BookingSubject } from "@/lib/bookings"
import type { Booking } from "@/lib/types"

/** Lifecycle actions that only need a confirmation, no extra input. */
export type BookingConfirmAction = "confirm_payment" | "check_out"

interface ConfirmActionConfig {
  title: (booking: BookingSubject) => string
  description: (booking: BookingSubject) => React.ReactNode
  confirmLabel: string
  pendingLabel: string
  /** Checking out frees the room, so the units list goes stale too. */
  refreshesUnits: boolean
  success: (booking: BookingSubject) => string
  failure: string
  run: (booking: BookingSubject) => Promise<Booking>
}

const CONFIRM_ACTIONS: Record<BookingConfirmAction, ConfirmActionConfig> = {
  confirm_payment: {
    title: (booking) => `Confirm payment for ${booking.guest_name}?`,
    description: (booking) =>
      `This confirms payment for ${booking.guest_name}'s booking ${booking.reference}. Only do this once the money has actually been received.`,
    confirmLabel: "Confirm payment",
    pendingLabel: "Confirming",
    refreshesUnits: false,
    success: (booking) => `Payment for ${booking.reference} was confirmed.`,
    failure: "We couldn't confirm this payment. Try again.",
    run: (booking) => confirmBookingPayment(booking.booking_id),
  },
  check_out: {
    title: (booking) => `Check ${booking.guest_name} out?`,
    description: (booking) =>
      `This checks ${booking.guest_name} out of booking ${booking.reference} and frees the room for housekeeping.`,
    confirmLabel: "Check out",
    pendingLabel: "Checking out",
    refreshesUnits: true,
    success: (booking) => `${booking.guest_name} was checked out.`,
    failure: "We couldn't check this guest out. Try again.",
    run: (booking) => checkOutBooking(booking.booking_id),
  },
}

/** Every lifecycle action the bookings row menu can open a dialog for. */
export type BookingDialogAction = BookingConfirmAction | "check_in" | "cancel"

interface BookingActionDialogProps {
  booking: BookingSubject
  /** Which dialog is open, or `null` for none. */
  action: BookingDialogAction | null
  onClose: () => void
}

/**
 * The booking lifecycle dialogs. Confirm payment and check out only need an
 * "are you sure?"; checking in also needs the guest record and cancelling
 * needs a written reason, so those two have their own dialogs.
 */
function BookingActionDialog({
  booking,
  action,
  onClose,
}: BookingActionDialogProps) {
  if (action === "check_in") {
    return (
      <CheckInBookingDialog booking={booking} open onOpenChange={onClose} />
    )
  }
  if (action === "cancel") {
    return (
      <BookingReasonDialog
        booking={booking}
        action="cancel"
        open
        onOpenChange={onClose}
      />
    )
  }
  if (action === null) return null
  return <ConfirmAction booking={booking} action={action} onClose={onClose} />
}

function ConfirmAction({
  booking,
  action,
  onClose,
}: {
  booking: BookingSubject
  action: BookingConfirmAction
  onClose: () => void
}) {
  const config = CONFIRM_ACTIONS[action]
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => config.run(booking),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: bookingsQueryKey })
      if (config.refreshesUnits) {
        await queryClient.invalidateQueries({ queryKey: unitsQueryKey })
      }
      toast.success(config.success(booking))
      setError(null)
      onClose()
    },
    onError: (err) => {
      setError(getApiErrorMessage(err, config.failure))
    },
  })

  return (
    <ConfirmDialog
      open
      onOpenChange={(next) => {
        if (next) return
        setError(null)
        onClose()
      }}
      title={config.title(booking)}
      description={config.description(booking)}
      confirmLabel={config.confirmLabel}
      pendingLabel={config.pendingLabel}
      isPending={mutation.isPending}
      error={error}
      onConfirm={() => mutation.mutate()}
    />
  )
}

export { BookingActionDialog }
