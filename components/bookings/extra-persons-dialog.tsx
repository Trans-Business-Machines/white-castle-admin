"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  useIsMutating,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"
import { HandCoins, Loader, UserPlus } from "lucide-react"
import { useForm } from "react-hook-form"
import {
  FieldError,
  inputClassName,
  labelClassName,
} from "@/components/bookings/booking-form-fields"
import {
  BookingChangeSummary,
  pluralizeNights,
  primaryButtonClassName,
} from "@/components/bookings/booking-change-summary"
import {
  StayChangePaymentForm,
  stayChangePaymentMutationKey,
} from "@/components/bookings/stay-change-payment-form"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { addExtraPersons, bookingsQueryKey } from "@/lib/api/bookings"
import { getApiErrorMessage } from "@/lib/api/errors"
import { formatCurrency } from "@/lib/format"
import {
  extraPersonsSchema,
  MAX_OCCUPANTS,
  toExtraPersonsPayload,
  type ExtraPersonsValues,
} from "@/lib/schemas/bookings"
import type { Booking, ExtraPersonsResponse } from "@/lib/types"
import { useAuth } from "@/providers/auth-provider"

interface ExtraPersonsDialogProps {
  booking: Booking
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Adds adults / children to a checked-in stay (`PATCH
 * /bookings/{id}/extra-persons`) with the signed-in staff member's
 * `user_id` as `updated_by`. On success the form gives way to the added
 * people's charges. When the guest owes money, Add payment opens a form
 * under them that records it (`payment_type: "extra_persons"`); the backend
 * has dropped the booking back to `deposit_paid`, so check-out waits until
 * that payment is verified.
 */
function ExtraPersonsDialog(props: ExtraPersonsDialogProps) {
  // Mounted only while open so the counts start at zero each time.
  if (!props.open) return null
  return <ExtraPersonsForm {...props} />
}

function ExtraPersonsForm({
  booking,
  onOpenChange,
}: Omit<ExtraPersonsDialogProps, "open">) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [result, setResult] = useState<ExtraPersonsResponse | null>(null)
  const paymentSaving =
    useIsMutating({
      mutationKey: stayChangePaymentMutationKey(booking.booking_id),
    }) > 0

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ExtraPersonsValues>({
    resolver: zodResolver(extraPersonsSchema),
    defaultValues: { adults: 0, children: 0 },
  })

  const mutation = useMutation({
    mutationFn: (values: ExtraPersonsValues) => {
      if (!user) throw new Error("Sign in again to add people to this stay.")
      return addExtraPersons(
        booking.booking_id,
        toExtraPersonsPayload(values, user.user_id)
      )
    },
    onSuccess: async (data) => {
      // TODO: remove once the extra-persons charges are confirmed.
      console.log("PATCH /bookings/{id}/extra-persons response:", data)
      setResult(data)
      await queryClient.invalidateQueries({ queryKey: bookingsQueryKey })
    },
    onError: (err) => {
      setError("root", {
        message: getApiErrorMessage(
          err,
          "We couldn't add people to this stay. Try again."
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
        className="max-h-[90dvh] max-w-2xl! overflow-y-auto"
      >
        {result ? (
          <ExtraPersonsSummary
            bookingId={booking.booking_id}
            guestName={booking.guest_name}
            result={result}
            onDone={() => onOpenChange(false)}
          />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                Add extra people
              </DialogTitle>
              <DialogDescription className="text-base text-muted-foreground">
                Booking{" "}
                <span className="font-semibold text-foreground">
                  {booking.reference}
                </span>{" "}
                is currently for {booking.adults}{" "}
                {booking.adults === 1 ? "adult" : "adults"} and{" "}
                {booking.children}{" "}
                {booking.children === 1 ? "child" : "children"}. Enter how many
                are joining the stay.
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={handleSubmit((values) => mutation.mutate(values))}
              noValidate
            >
              <fieldset disabled={mutation.isPending} className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="extra-adults" className={labelClassName}>
                      Extra adult
                    </Label>
                    <Input
                      id="extra-adults"
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={MAX_OCCUPANTS}
                      step={1}
                      autoFocus
                      className={inputClassName}
                      aria-invalid={Boolean(errors.adults)}
                      aria-describedby={
                        errors.adults ? "extra-adults-error" : undefined
                      }
                      {...register("adults", { valueAsNumber: true })}
                    />
                    <FieldError
                      id="extra-adults-error"
                      message={errors.adults?.message}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="extra-children" className={labelClassName}>
                      Extra child
                    </Label>
                    <Input
                      id="extra-children"
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={MAX_OCCUPANTS}
                      step={1}
                      className={inputClassName}
                      aria-invalid={Boolean(errors.children)}
                      aria-describedby={
                        errors.children ? "extra-children-error" : undefined
                      }
                      {...register("children", { valueAsNumber: true })}
                    />
                    <FieldError
                      id="extra-children-error"
                      message={errors.children?.message}
                    />
                  </div>
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
                        Saving
                      </span>
                    ) : (
                      <>
                        <UserPlus aria-hidden="true" />
                        Add to stay
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

function pluralize(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`
}

/**
 * The updated head count and what the added adults cost. When there's
 * something to collect, the footer is Add payment instead of Close.
 */
function ExtraPersonsSummary({
  bookingId,
  guestName,
  result,
  onDone,
}: {
  bookingId: string
  guestName: string
  result: ExtraPersonsResponse
  onDone: () => void
}) {
  const extra = result.extra_persons
  const [paying, setPaying] = useState(false)
  const owesPayment = extra.payment_required && extra.total_extra_charge > 0

  return (
    <BookingChangeSummary
      title="People added"
      guestName={guestName}
      description={
        <>
          Booking{" "}
          <span className="font-semibold text-foreground">
            {result.reference}
          </span>{" "}
          is now for {pluralize(result.adults, "adult", "adults")} and{" "}
          {pluralize(result.children, "child", "children")}.
        </>
      }
      rows={[
        {
          label: "Adults",
          value: `${extra.previous_adults} → ${extra.new_adults}`,
        },
        {
          label: "Rate per extra adult",
          value: (
            <>
              {formatCurrency(extra.rate_per_extra_adult)} / night
              <span className="block text-xs text-muted-foreground">
                {extra.extra_person_percentage}% of{" "}
                {formatCurrency(extra.base_rate)}
              </span>
            </>
          ),
        },
        { label: "Nights charged", value: pluralizeNights(extra.nights) },
        { label: "Room charge", value: formatCurrency(extra.room_charge) },
        ...(extra.includes_bb
          ? [
              {
                label: "Bed and breakfast",
                value: formatCurrency(extra.bb_charge),
              },
            ]
          : []),
        {
          label: "Extra charge total",
          value: formatCurrency(extra.total_extra_charge),
          emphasis: true,
        },
        { label: "New booking total", value: formatCurrency(extra.new_total) },
      ]}
      payment={{
        required: extra.payment_required,
        amount: extra.total_extra_charge,
        reference: extra.booking_ref,
        reason: "for the extra guests",
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
          bookingRef={extra.booking_ref || result.reference}
          amount={extra.total_extra_charge}
          paymentType="extra_persons"
          onCancel={() => setPaying(false)}
          onRecorded={onDone}
        />
      ) : null}
    </BookingChangeSummary>
  )
}

export { ExtraPersonsDialog }
