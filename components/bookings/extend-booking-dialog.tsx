"use client"

import { useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  useIsMutating,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"
import { addDays, parseISO } from "date-fns"
import { CalendarPlus, HandCoins, Loader } from "lucide-react"
import { Controller, useForm } from "react-hook-form"
import {
  FieldError,
  inputClassName,
  labelClassName,
} from "@/components/bookings/booking-form-fields"
import {
  BookingChangeSummary,
  getPreviousTotal,
  pluralizeNights,
  primaryButtonClassName,
} from "@/components/bookings/booking-change-summary"
import {
  StayChangePaymentForm,
  stayChangePaymentMutationKey,
} from "@/components/bookings/stay-change-payment-form"
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
import { formatCurrency, formatDate } from "@/lib/format"
import {
  makeExtendBookingSchema,
  toExtendBookingPayload,
  type ExtendBookingValues,
} from "@/lib/schemas/bookings"
import type { Booking, ExtendBookingResponse } from "@/lib/types"
import { useAuth } from "@/providers/auth-provider"

interface ExtendBookingDialogProps {
  booking: Booking
  open: boolean
  onOpenChange: (open: boolean) => void
}

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
  const [result, setResult] = useState<ExtendBookingResponse | null>(null)
  const paymentSaving =
    useIsMutating({
      mutationKey: stayChangePaymentMutationKey(booking.booking_id),
    }) > 0

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
    onSuccess: async (data) => {
      setResult(data)
      await queryClient.invalidateQueries({ queryKey: bookingsQueryKey })
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
        if (mutation.isPending || paymentSaving) return
        if (!next) onOpenChange(false)
      }}
    >
      {/* Never wider or taller than 90% of the viewport; the payment form
          makes the summary tall, so it scrolls inside instead. `!` because
          `cn` doesn't merge away the base max-width classes. */}
      <DialogContent
        showCloseButton={false}
        className="max-h-[90dvh] overflow-y-auto"
      >
        {result ? (
          <ExtensionSummary
            bookingId={booking.booking_id}
            guestName={booking.guest_name}
            result={result}
            onDone={() => onOpenChange(false)}
          />
        ) : (
          <>
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
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

/**
 * The extended stay and what the added nights cost. When there's something
 * to collect, the footer is Add payment instead of Close.
 */
function ExtensionSummary({
  bookingId,
  guestName,
  result,
  onDone,
}: {
  bookingId: string
  guestName: string
  result: ExtendBookingResponse
  onDone: () => void
}) {
  const { extension } = result
  const [paying, setPaying] = useState(false)
  const owesPayment =
    extension.payment_required && extension.total_extra_charge > 0

  return (
    <BookingChangeSummary
      title="Stay extended"
      guestName={guestName}
      description={
        <>
          {guestName}&apos;s booking{" "}
          <span className="font-semibold text-foreground">
            {result.reference}
          </span>{" "}
          now checks out on{" "}
          <span className="font-semibold text-foreground">
            {formatDate(result.check_out_date)}
          </span>
          , {pluralizeNights(result.nights)} in room {result.room_number}.
        </>
      }
      rows={[
        {
          label: "Extra nights",
          value: pluralizeNights(extension.extra_nights),
        },
        {
          label: "Room charge",
          value: formatCurrency(extension.room_rate_charge),
        },
        ...(extension.includes_bb
          ? [
              {
                label: "Bed and breakfast",
                value: formatCurrency(extension.bb_charge),
              },
            ]
          : []),
        {
          label: "Extension total",
          value: formatCurrency(extension.total_extra_charge),
          emphasis: true,
        },
        {
          label: "Previous total",
          value: formatCurrency(getPreviousTotal(extension)),
        },
        {
          label: "New booking total",
          value: formatCurrency(extension.new_total),
        },
      ]}
      payment={{
        required: extension.payment_required,
        amount: extension.total_extra_charge,
        reference: extension.booking_ref,
        reason: "for the extra nights",
      }}
      footer={
        !owesPayment ? undefined : paying ? null : (
          <DialogFooter>
            <Button
              type="button"
              onClick={() => setPaying(true)}
              className={primaryButtonClassName}
            >
              <HandCoins aria-hidden="true" />
              Add payment
            </Button>
          </DialogFooter>
        )
      }
    >
      {owesPayment && paying ? (
        <StayChangePaymentForm
          bookingId={bookingId}
          bookingRef={extension.booking_ref || result.reference}
          amount={extension.total_extra_charge}
          paymentType="extension"
          onCancel={() => setPaying(false)}
          onRecorded={onDone}
        />
      ) : null}
    </BookingChangeSummary>
  )
}

export { ExtendBookingDialog }
