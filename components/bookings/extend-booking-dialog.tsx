"use client"

import { useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  useIsMutating,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { addDays, parseISO } from "date-fns"
import { CalendarPlus, HandCoins, Loader } from "lucide-react"
import { Controller, useForm } from "react-hook-form"
import toast from "react-hot-toast"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { bookingsQueryKey, extendBooking } from "@/lib/api/bookings"
import { getApiErrorMessage } from "@/lib/api/errors"
import {
  bookingPaymentsQueryKey,
  fetchBookingPayments,
  paymentsQueryKey,
} from "@/lib/api/payments"
import { formatAmount, formatDate } from "@/lib/format"
import {
  makeExtendBookingSchema,
  toExtendBookingPayload,
  type ExtendBookingValues,
} from "@/lib/schemas/bookings"
import type {
  Booking,
  ExtendBookingPayload,
  ExtendBookingResponse,
  Payment,
} from "@/lib/types"
import { useAuth } from "@/providers/auth-provider"
import { getMealPlanLabel } from "@/lib/bookings"

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
  const { user } = useAuth()
  const [review, setReview] = useState<{
    payload: ExtendBookingPayload
    result: ExtendBookingResponse
  } | null>(null)
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

  // `preview=true`: works out the extension's charges without changing the
  // booking. The payment is recorded against that quote before applying it.
  const quote = useMutation({
    mutationFn: async (values: ExtendBookingValues) => {
      if (!user) throw new Error("Sign in again to extend this stay.")
      const payload = toExtendBookingPayload(values, user.user_id)
      const result = await extendBooking(booking.booking_id, payload, {
        preview: true,
      })
      return { payload, result }
    },
    onSuccess: setReview,
    onError: (err) => {
      setError("root", {
        message: getApiErrorMessage(
          err,
          "We couldn't work out the extension charges. Try again."
        ),
      })
    },
  })

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        // Ignore Escape / backdrop clicks while a request is in flight.
        if (quote.isPending || paymentSaving) return
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
        {review ? (
          <ExtensionReview
            booking={booking}
            payload={review.payload}
            quote={review.result}
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
              onSubmit={handleSubmit((values) => quote.mutate(values))}
              noValidate
            >
              <fieldset disabled={quote.isPending} className="grid gap-4">
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
                        disabled={quote.isPending}
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
                    disabled={quote.isPending}
                    className="h-11 rounded-full bg-brand-azure px-5 text-white hover:bg-brand-azure/90 focus-visible:ring-brand-azure/30"
                  >
                    {quote.isPending ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader aria-hidden="true" className="animate-spin" />
                        Working out charges
                      </span>
                    ) : (
                      <>
                        <CalendarPlus aria-hidden="true" />
                        Review extension
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

/** The extension quote, then the applied extension once its payment is in. */
function ExtensionReview({
  booking,
  payload,
  quote,
  onDone,
}: {
  booking: Booking
  payload: ExtendBookingPayload
  quote: ExtendBookingResponse
  onDone: () => void
}) {
  const queryClient = useQueryClient()
  const [applied, setApplied] = useState<ExtendBookingResponse | null>(null)
  const [chosenPaymentId, setChosenPaymentId] = useState("")
  const [paying, setPaying] = useState(false)

  const extension = quote.extension
  const currency = quote.extension.currency ?? booking.currency
  const owesPayment =
    extension.payment_required && extension.total_extra_charge > 0

  // Payments already recorded for this booking. A recorded extension payment
  // can be reused, e.g. when finance took it before the desk extended.
  const payments = useQuery({
    queryKey: bookingPaymentsQueryKey(booking.booking_id),
    queryFn: () => fetchBookingPayments(booking.booking_id),
    enabled: owesPayment,
  })
  const recordedPayments = (payments.data ?? []).filter(
    (payment) =>
      payment.payment_type === "extension" &&
      payment.status !== "rejected" &&
      (payment.currency || "KES").toUpperCase() ===
        (currency || "KES").toUpperCase() &&
      payment.amount + 0.01 >= extension.total_extra_charge
  )
  const paymentId = chosenPaymentId || recordedPayments[0]?.payment_id || ""

  const apply = useMutation({
    mutationKey: ["bookings", "extend", booking.booking_id],
    mutationFn: (id: string) =>
      extendBooking(booking.booking_id, {
        ...payload,
        payment_id: id || undefined,
      }),
    onSuccess: async (data) => {
      setApplied(data)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: bookingsQueryKey }),
        queryClient.invalidateQueries({ queryKey: paymentsQueryKey }),
      ])
      toast.success(
        `${booking.guest_name}'s stay now runs to ${formatDate(data.check_out_date)}.`
      )
    },
  })

  function onPaymentRecorded(payment: Payment) {
    setPaying(false)
    setChosenPaymentId(payment.payment_id)
    apply.mutate(payment.payment_id)
  }

  const result = applied ?? quote
  const extra = result.extension

  const footer = applied ? (
    <DialogFooter>
      <Button
        type="button"
        onClick={onDone}
        className={primaryButtonClassName}
      >
        Close
      </Button>
    </DialogFooter>
  ) : paying ? null : (
    <>
      {apply.isError ? (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
        >
          {getApiErrorMessage(
            apply.error,
            "We couldn't apply the extension. Try again."
          )}
        </p>
      ) : null}
      <DialogFooter>
        <DialogClose asChild>
          <Button
            type="button"
            variant="outline"
            disabled={apply.isPending}
            className="h-11 rounded-full px-5"
          >
            Cancel
          </Button>
        </DialogClose>
        {!owesPayment ? (
          <Button
            type="button"
            disabled={apply.isPending}
            onClick={() => apply.mutate("")}
            className={primaryButtonClassName}
          >
            {apply.isPending ? (
              <span className="inline-flex items-center gap-2">
                <Loader aria-hidden="true" className="animate-spin" />
                Extending
              </span>
            ) : (
              <>
                <CalendarPlus aria-hidden="true" />
                Apply extension
              </>
            )}
          </Button>
        ) : paymentId ? (
          <Button
            type="button"
            disabled={apply.isPending}
            onClick={() => apply.mutate(paymentId)}
            className={primaryButtonClassName}
          >
            {apply.isPending ? (
              <span className="inline-flex items-center gap-2">
                <Loader aria-hidden="true" className="animate-spin" />
                Extending
              </span>
            ) : (
              <>
                <CalendarPlus aria-hidden="true" />
                Apply extension
              </>
            )}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => setPaying(true)}
            className={primaryButtonClassName}
          >
            <HandCoins aria-hidden="true" />
            Record extension payment
          </Button>
        )}
      </DialogFooter>
    </>
  )

  return (
    <BookingChangeSummary
      title={applied ? "Stay extended" : "Review extension"}
      icon={applied ? undefined : null}
      guestName={booking.guest_name}
      description={
        applied ? (
          <>
            {booking.guest_name}&apos;s booking{" "}
            <span className="font-semibold text-foreground">
              {result.reference}
            </span>{" "}
            now checks out on{" "}
            <span className="font-semibold text-foreground">
              {formatDate(result.check_out_date)}
            </span>
            , {pluralizeNights(result.nights)} in room {result.room_number}.
          </>
        ) : (
          <>
            Extending booking{" "}
            <span className="font-semibold text-foreground">
              {result.reference}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-foreground">
              {formatDate(result.check_out_date)}
            </span>
            . The extension is applied once its payment is recorded.
          </>
        )
      }
      rows={[
        {
          label: "Extra nights",
          value: pluralizeNights(extra.extra_nights),
        },
        {
          label: "Rate per night",
          value: formatAmount(extra.plan_rate_per_night, currency),
        },
        {
          label: "Meal plan",
          value: getMealPlanLabel((extra.meal_plan as string) ?? "room_only"),
        },
        {
          label: "Extension total",
          value: formatAmount(extra.total_extra_charge, currency),
          emphasis: true,
        },
        {
          label: "Previous total",
          value: formatAmount(getPreviousTotal(extra), currency),
        },
        {
          label: "New booking total",
          value: formatAmount(extra.new_total, currency),
        },
      ]}
      payment={{
        required: extra.payment_required,
        settled: Boolean(applied),
        amount: extra.total_extra_charge,
        currency,
        reference: extra.booking_ref,
        reason: "for the extra nights",
      }}
      footer={footer}
    >
      {!applied && owesPayment && !paying && recordedPayments.length > 0 ? (
        <div className="grid gap-2">
          <Label
            htmlFor="extension-recorded-payment"
            className={labelClassName}
          >
            Recorded extension payment
          </Label>
          <Select
            value={paymentId}
            onValueChange={setChosenPaymentId}
            disabled={apply.isPending}
          >
            <SelectTrigger id="extension-recorded-payment" className="w-full">
              <SelectValue placeholder="Choose a recorded payment" />
            </SelectTrigger>
            <SelectContent>
              {recordedPayments.map((payment) => (
                <SelectItem
                  key={payment.payment_id}
                  value={payment.payment_id}
                >
                  {formatAmount(payment.amount, payment.currency)} ·{" "}
                  {payment.method} · {payment.status}
                  {payment.reference ? ` · ${payment.reference}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {!applied && owesPayment && paying ? (
        <StayChangePaymentForm
          bookingId={booking.booking_id}
          bookingRef={extension.booking_ref || result.reference}
          amount={extension.total_extra_charge}
          currency={currency}
          paymentType="extension"
          onCancel={() => setPaying(false)}
          onRecorded={onPaymentRecorded}
        />
      ) : null}
    </BookingChangeSummary>
  )
}

export { ExtendBookingDialog }
