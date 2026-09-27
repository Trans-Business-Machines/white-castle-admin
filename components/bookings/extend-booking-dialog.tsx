"use client"

import { useMemo } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { addDays, parseISO } from "date-fns"
import { CalendarPlus, Loader } from "lucide-react"
import { Controller, useForm } from "react-hook-form"
import toast from "react-hot-toast"
import {
  FieldError,
  inputClassName,
  labelClassName,
} from "@/components/bookings/booking-form-fields"
import { StayDatePicker } from "@/components/bookings/stay-date-picker"
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
import { bookingsQueryKey, extendBooking } from "@/lib/api/bookings"
import { getApiErrorMessage } from "@/lib/api/errors"
import { formatDate } from "@/lib/format"
import {
  makeExtendBookingSchema,
  toExtendBookingPayload,
  type ExtendBookingValues,
} from "@/lib/schemas/bookings"
import type { Booking } from "@/lib/types"
import { useAuth } from "@/providers/auth-provider"

interface ExtendBookingDialogProps {
  booking: Booking
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Moves a checked-in stay's check-out later (`PATCH
 * /bookings/{id}/extend`) with the signed-in staff member's `user_id` as
 * `extended_by`.
 */
function ExtendBookingDialog(props: ExtendBookingDialogProps) {
  // Mounted only while open so the date starts empty each time.
  if (!props.open) return null
  return <ExtendForm {...props} />
}

function ExtendForm({
  booking,
  onOpenChange,
}: Omit<ExtendBookingDialogProps, "open">) {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const schema = useMemo(
    () => makeExtendBookingSchema(booking.check_out_date),
    [booking.check_out_date]
  )
  // The stay grows by at least a night, so the picker opens on the day
  // after the current check-out.
  const earliest = addDays(parseISO(booking.check_out_date), 1)

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ExtendBookingValues>({
    resolver: zodResolver(schema),
    defaultValues: { new_check_out_date: null },
  })

  const mutation = useMutation({
    mutationFn: (values: ExtendBookingValues) => {
      if (!user) throw new Error("Sign in again to extend this stay.")
      return extendBooking(
        booking.booking_id,
        toExtendBookingPayload(values, user.user_id)
      )
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: bookingsQueryKey })
      toast.success(`${booking.guest_name}'s stay was extended.`)
      onOpenChange(false)
    },
    onError: (err) => {
      setError("root", {
        message: getApiErrorMessage(
          err,
          "We couldn't extend this stay. Try again."
        ),
      })
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
            Extend {booking.guest_name}&apos;s stay
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            Booking{" "}
            <span className="font-semibold text-foreground">
              {booking.reference}
            </span>{" "}
            currently checks out on{" "}
            <span className="font-semibold text-foreground">
              {formatDate(booking.check_out_date)}
            </span>
            . Pick the new check-out date.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          noValidate
        >
          <fieldset disabled={mutation.isPending} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="extend-check-out" className={labelClassName}>
                New check-out date
              </Label>
              <Controller
                control={control}
                name="new_check_out_date"
                render={({ field }) => (
                  <StayDatePicker
                    id="extend-check-out"
                    ref={field.ref}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    minDate={earliest}
                    placeholder="Pick a later date"
                    clearLabel="Clear new check-out date"
                    disabled={mutation.isPending}
                    invalid={Boolean(errors.new_check_out_date)}
                    describedBy={
                      errors.new_check_out_date
                        ? "extend-check-out-error"
                        : undefined
                    }
                    className={inputClassName}
                  />
                )}
              />
              <FieldError
                id="extend-check-out-error"
                message={errors.new_check_out_date?.message}
              />
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
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                className="h-11 rounded-full bg-brand-azure px-5 text-white hover:bg-brand-azure/90 focus-visible:ring-brand-azure/30"
              >
                {mutation.isPending ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader aria-hidden="true" className="animate-spin" />
                    Extending
                  </span>
                ) : (
                  <>
                    <CalendarPlus aria-hidden="true" />
                    Extend stay
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

export { ExtendBookingDialog }
