"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Ban, CircleX, Loader, type LucideIcon } from "lucide-react"
import { useForm } from "react-hook-form"
import toast from "react-hot-toast"
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
import { Textarea } from "@/components/ui/textarea"
import {
  bookingsQueryKey,
  cancelBooking,
  rejectBooking,
} from "@/lib/api/bookings"
import { getApiErrorMessage } from "@/lib/api/errors"
import { unitsQueryKey } from "@/lib/api/units"
import type { BookingSubject } from "@/lib/bookings"
import {
  bookingReasonSchema,
  toCancelBookingPayload,
  toRejectBookingPayload,
  type BookingReasonValues,
} from "@/lib/schemas/bookings"
import type { Booking } from "@/lib/types"
import { useAuth } from "@/providers/auth-provider"

/** The two decisions that are recorded with a written reason. */
export type BookingReasonAction = "reject" | "cancel"

interface ReasonActionConfig {
  title: (booking: BookingSubject) => string
  description: (booking: BookingSubject) => React.ReactNode
  placeholder: string
  confirmLabel: string
  pendingLabel: string
  /** "Cancel" would read as the action itself in the cancel dialog. */
  dismissLabel: string
  icon: LucideIcon
  /** Cancelling releases the room, so the units list goes stale too. */
  refreshesUnits: boolean
  success: (booking: BookingSubject) => string
  failure: string
  /** Missing session guard — the id is part of the body either way. */
  signedOut: string
  run: (
    booking: BookingSubject,
    values: BookingReasonValues,
    userId: string
  ) => Promise<Booking>
}

const REASON_ACTIONS: Record<BookingReasonAction, ReasonActionConfig> = {
  reject: {
    title: (booking) => `Reject booking ${booking.reference}?`,
    description: (booking) => (
      <>
        {booking.guest_name}&apos;s request will be marked as rejected and the
        room stays available. The reason is kept on the booking so other staff
        know why.
      </>
    ),
    placeholder:
      "e.g. The room is already held for another guest on those dates.",
    confirmLabel: "Reject booking",
    pendingLabel: "Rejecting",
    dismissLabel: "Cancel",
    icon: CircleX,
    refreshesUnits: false,
    success: (booking) => `Booking ${booking.reference} was rejected.`,
    failure: "We couldn't reject this booking request. Try again.",
    signedOut: "Sign in again to reject this request.",
    run: (booking, values, userId) =>
      rejectBooking(booking.booking_id, toRejectBookingPayload(values, userId)),
  },
  cancel: {
    title: (booking) => `Cancel ${booking.guest_name}'s booking?`,
    description: (booking) => (
      <>
        {booking.guest_name}&apos;s booking {booking.reference} will be
        cancelled and the room released.{" "}
        <span className="font-semibold text-foreground">
          This can&apos;t be undone.
        </span>{" "}
        The reason is kept on the booking so other staff know why.
      </>
    ),
    placeholder: "e.g. The guest called to cancel their stay.",
    confirmLabel: "Cancel booking",
    pendingLabel: "Cancelling",
    dismissLabel: "Keep booking",
    icon: Ban,
    refreshesUnits: true,
    success: (booking) => `Booking ${booking.reference} was cancelled.`,
    failure: "We couldn't cancel this booking. Try again.",
    signedOut: "Sign in again to cancel this booking.",
    run: (booking, values, userId) =>
      cancelBooking(booking.booking_id, toCancelBookingPayload(values, userId)),
  },
}

interface BookingReasonDialogProps {
  booking: BookingSubject
  action: BookingReasonAction
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Asks for a reason, then rejects (`PATCH /bookings/{id}/reject`) or
 * cancels (`PATCH /bookings/{id}/cancel`) the booking. Both bodies carry
 * the reason plus the signed-in staff member's `user_id`, and both reasons
 * show up on the booking's details page.
 */
function BookingReasonDialog(props: BookingReasonDialogProps) {
  // Mounted only while open so the reason field starts empty each time.
  if (!props.open) return null
  return <ReasonForm {...props} />
}

function ReasonForm({
  booking,
  action,
  onOpenChange,
}: Omit<BookingReasonDialogProps, "open">) {
  const config = REASON_ACTIONS[action]
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<BookingReasonValues>({
    resolver: zodResolver(bookingReasonSchema),
    defaultValues: { reason: "" },
  })

  const mutation = useMutation({
    mutationFn: (values: BookingReasonValues) => {
      if (!user) throw new Error(config.signedOut)
      return config.run(booking, values, user.user_id)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: bookingsQueryKey })
      if (config.refreshesUnits) {
        await queryClient.invalidateQueries({ queryKey: unitsQueryKey })
      }
      toast.success(config.success(booking))
      onOpenChange(false)
    },
    onError: (err) => {
      setError("root", { message: getApiErrorMessage(err, config.failure) })
    },
  })

  const Icon = config.icon

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
            {config.title(booking)}
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            {config.description(booking)}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          noValidate
        >
          <fieldset disabled={mutation.isPending} className="grid gap-4">
            <div className="grid gap-2">
              <Label
                htmlFor="booking-reason"
                className="font-heading text-xs font-semibold tracking-wide text-iron uppercase"
              >
                Reason
              </Label>
              <Textarea
                id="booking-reason"
                autoFocus
                rows={4}
                placeholder={config.placeholder}
                className="min-h-28 rounded-lg border-border bg-canvas px-3.5 py-2.5 text-base focus-visible:border-brand-azure focus-visible:ring-brand-azure/20 md:text-base dark:bg-input/30"
                aria-invalid={Boolean(errors.reason)}
                aria-describedby={
                  errors.reason ? "booking-reason-error" : undefined
                }
                {...register("reason")}
              />
              {errors.reason ? (
                <p
                  id="booking-reason-error"
                  className="text-sm text-destructive"
                >
                  {errors.reason.message}
                </p>
              ) : null}
            </div>

            {errors.root ? (
              <p
                role="alert"
                className="rounded-md bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
              >
                {errors.root.message}
              </p>
            ) : null}

            <DialogFooter>
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-full px-5"
                >
                  {config.dismissLabel}
                </Button>
              </DialogClose>
              <Button
                type="submit"
                className="h-11 rounded-full bg-destructive px-5 text-white hover:bg-destructive/90 focus-visible:ring-destructive/30"
              >
                {mutation.isPending ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader aria-hidden="true" className="animate-spin" />
                    {config.pendingLabel}
                  </span>
                ) : (
                  <>
                    <Icon aria-hidden="true" />
                    {config.confirmLabel}
                  </>
                )}
              </Button>
            </DialogFooter>
          </fieldset>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { BookingReasonDialog }
