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
import toast from "react-hot-toast"
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
import type {
  Booking,
  ExtraPersonsPayload,
  ExtraPersonsResponse,
} from "@/lib/types"

interface ExtraPersonsDialogProps {
  booking: Booking
  open: boolean
  onOpenChange: (open: boolean) => void
}

function ExtraPersonsDialog(props: ExtraPersonsDialogProps) {
  // Mounted only while open so the counts start at zero each time.
  if (!props.open) return null
  return <ExtraPersonsForm {...props} />
}

function ExtraPersonsForm({
  booking,
  onOpenChange,
}: Omit<ExtraPersonsDialogProps, "open">) {
  const [review, setReview] = useState<{
    payload: ExtraPersonsPayload
    response: ExtraPersonsResponse
  } | null>(null)
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

  // `preview=true`: works out the charges without changing the booking.
  const mutation = useMutation({
    mutationFn: async (values: ExtraPersonsValues) => {
      const payload = toExtraPersonsPayload(values)
      const response = await addExtraPersons(booking.booking_id, payload, {
        preview: true,
      })
      return { payload, response }
    },
    onSuccess: setReview,
    onError: (err) => {
      setError("root", {
        message: getApiErrorMessage(
          err,
          "We couldn't work out the charges for these people. Try again."
        ),
      })
    },
  })
  const committing =
    useIsMutating({
      mutationKey: extraPersonsCommitMutationKey(booking.booking_id),
    }) > 0

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        // Ignore Escape / backdrop clicks while a request is in flight.
        if (mutation.isPending || committing || paymentSaving) return
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
          <ExtraPersonsSummary
            bookingId={booking.booking_id}
            guestName={booking.guest_name}
            payload={review.payload}
            preview={review.response}
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
                        Checking
                      </span>
                    ) : (
                      <>
                        <UserPlus aria-hidden="true" />
                        Review charges
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

/** Lets the dialog tell the change is saving, so it can't be closed mid-request. */
const extraPersonsCommitMutationKey = (bookingId: string) =>
  ["bookings", "extra-persons", bookingId] as const

/**
 * The previewed head count and what the added adults will cost. Nothing
 * has changed yet: Add payment (or Add to stay, when no payment is
 * required) re-sends the same counts with `preview=false` to apply them,
 * and only then does the payment form open, for the applied
 * `total_extra_charge`.
 */
function ExtraPersonsSummary({
  bookingId,
  guestName,
  payload,
  preview,
  onDone,
}: {
  bookingId: string
  guestName: string
  payload: ExtraPersonsPayload
  preview: ExtraPersonsResponse
  onDone: () => void
}) {
  const queryClient = useQueryClient()
  const [committed, setCommitted] = useState<ExtraPersonsResponse | null>(null)
  const [paying, setPaying] = useState(false)
  const result = committed ?? preview
  const extra = result.extra_persons

  const commit = useMutation({
    mutationKey: extraPersonsCommitMutationKey(bookingId),
    mutationFn: () => addExtraPersons(bookingId, payload, { preview: false }),
    onSuccess: async (data) => {
      setCommitted(data)
      await queryClient.invalidateQueries({ queryKey: bookingsQueryKey })
      if (data.extra_persons.payment_required) {
        setPaying(true)
      } else {
        toast.success(`People added to ${data.reference}.`)
        onDone()
      }
    },
  })

  return (
    <BookingChangeSummary
      title={committed ? "People added" : "Review extra people"}
      icon={committed ? undefined : null}
      guestName={guestName}
      description={
        <>
          Booking{" "}
          <span className="font-semibold text-foreground">
            {result.reference}
          </span>{" "}
          {committed ? "is now" : "will be"} for{" "}
          {pluralize(extra.new_adults, "adult", "adults")} and{" "}
          {pluralize(extra.children, "child", "children")}.
        </>
      }
      rows={[
        {
          label: "Adults",
          value: `${extra.previous_adults} → ${extra.new_adults}`,
        },
        { label: "Children", value: String(extra.children) },
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
        {
          label: "Extra adult charge",
          value: (
            <>
              {formatCurrency(extra.room_charge)}
              <span className="block text-xs text-muted-foreground">
                {extra.extra_adults > 1
                  ? `${pluralize(extra.extra_adults, "adult", "adults")} × `
                  : ""}
                {pluralizeNights(extra.nights)} ×{" "}
                {formatCurrency(extra.rate_per_extra_adult)}
              </span>
            </>
          ),
        },
        ...(extra.includes_bb
          ? [
              {
                label: "Bed and breakfast",
                value: formatCurrency(extra.bb_charge),
              },
            ]
          : []),
        {
          label: "Additional charge",
          value: formatCurrency(extra.total_extra_charge),
          emphasis: true,
        },
        {
          label: "New booking total",
          value: (
            <>
              <span className="font-semibold">
                {formatCurrency(extra.new_total)}
              </span>
              <span className="block text-xs text-muted-foreground">
                Previous total plus the additional charge
              </span>
            </>
          ),
        },
      ]}
      payment={{
        required: extra.payment_required,
        amount: extra.total_extra_charge,
        reference: extra.booking_ref,
        reason: "for the extra guests",
      }}
      footer={
        paying ? null : committed ? (
          // Applied, but the payment form was cancelled: reopen it without
          // sending the change again.
          <DialogFooter>
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-full px-5"
              >
                Close
              </Button>
            </DialogClose>
            <Button
              type="button"
              onClick={() => setPaying(true)}
              className={primaryButtonClassName}
            >
              <HandCoins aria-hidden="true" />
              Add payment
            </Button>
          </DialogFooter>
        ) : (
          <>
            {commit.isError ? (
              <p
                role="alert"
                className="rounded-md bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
              >
                {getApiErrorMessage(
                  commit.error,
                  "We couldn't add people to this stay. Try again."
                )}
              </p>
            ) : null}
            <DialogFooter>
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  disabled={commit.isPending}
                  className="h-11 rounded-full px-5"
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="button"
                onClick={() => commit.mutate()}
                disabled={commit.isPending}
                className={primaryButtonClassName}
              >
                {commit.isPending ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader aria-hidden="true" className="animate-spin" />
                    Saving
                  </span>
                ) : extra.payment_required ? (
                  <>
                    <HandCoins aria-hidden="true" />
                    Add payment
                  </>
                ) : (
                  <>
                    <UserPlus aria-hidden="true" />
                    Add to stay
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )
      }
    >
      {committed && paying ? (
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
