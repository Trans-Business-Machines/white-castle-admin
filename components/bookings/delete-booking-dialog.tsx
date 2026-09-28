"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { ConfirmDialog } from "@/components/confirm-dialog"
import {
  bookingQueryKey,
  bookingsQueryKey,
  deleteBooking,
} from "@/lib/api/bookings"
import { getApiErrorMessage } from "@/lib/api/errors"
import { guestBookingsQueryKey } from "@/lib/api/guests"
import { unitsQueryKey } from "@/lib/api/units"
import type { BookingSubject } from "@/lib/bookings"

interface DeleteBookingDialogProps {
  booking: BookingSubject
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Runs after the booking is gone, e.g. to leave its details page. */
  onDeleted?: () => void
}

/**
 * Confirms then runs `DELETE /bookings/{id}`. The menu only offers it to
 * super admins (`BOOKING_DELETE_ROLES`) and disables it while the guest is
 * checked in (`canDeleteBooking`).
 */
function DeleteBookingDialog({
  booking,
  open,
  onOpenChange,
  onDeleted,
}: DeleteBookingDialogProps) {
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => deleteBooking(booking.booking_id),
    onSuccess: async () => {
      // Drop the deleted booking's own query rather than refetch it into a
      // 404, then refresh everything that listed it.
      queryClient.removeQueries({
        queryKey: bookingQueryKey(booking.booking_id),
      })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: bookingsQueryKey }),
        // The room may be free again.
        queryClient.invalidateQueries({ queryKey: unitsQueryKey }),
        booking.guest_id
          ? queryClient.invalidateQueries({
              queryKey: guestBookingsQueryKey(booking.guest_id),
            })
          : undefined,
      ])
      toast.success(`Booking ${booking.reference} was deleted.`)
      setError(null)
      onOpenChange(false)
      onDeleted?.()
    },
    onError: (err) => {
      setError(
        getApiErrorMessage(err, "We couldn't delete this booking. Try again.")
      )
    },
  })

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setError(null)
        onOpenChange(next)
      }}
      title={`Delete booking ${booking.reference}?`}
      description={`This permanently removes ${booking.guest_name}'s booking. This action is not reversible.`}
      confirmLabel="Delete booking"
      pendingLabel="Deleting"
      destructive
      isPending={mutation.isPending}
      error={error}
      onConfirm={() => mutation.mutate()}
    />
  )
}

export { DeleteBookingDialog }
