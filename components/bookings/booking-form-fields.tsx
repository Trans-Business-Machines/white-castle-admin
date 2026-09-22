"use client"

import { addDays, startOfToday } from "date-fns"
import { Controller, useWatch, type UseFormReturn } from "react-hook-form"
import { GuestCombobox } from "@/components/bookings/guest-combobox"
import { RoomSelect } from "@/components/bookings/room-select"
import { StayDatePicker } from "@/components/bookings/stay-date-picker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MAX_OCCUPANTS, type BookingValues } from "@/lib/schemas/bookings"
import type { Guest, Unit } from "@/lib/types"

const labelClassName =
  "font-heading text-xs font-semibold tracking-wide text-iron uppercase"
const inputClassName =
  "h-11 rounded-lg border-border bg-canvas px-3.5 text-base focus-visible:border-brand-azure focus-visible:ring-brand-azure/20 md:text-base dark:bg-input/30"

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} className="text-sm text-destructive">
      {message}
    </p>
  )
}

/** Inline "couldn't load" notice with a retry link for a lookup query. */
function LookupError({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <p className="flex items-center gap-2 text-sm text-destructive">
      {message}
      <button
        type="button"
        onClick={onRetry}
        className="font-semibold underline underline-offset-4"
      >
        Retry
      </button>
    </p>
  )
}

interface LookupState<T> {
  data: T[] | undefined
  isPending: boolean
  isError: boolean
  refetch: () => void
}

interface BookingFormFieldsProps {
  form: UseFormReturn<BookingValues>
  rooms: LookupState<Unit>
  guests: LookupState<Guest>
  /** Disables the popover pickers while a request is in flight. */
  pending: boolean
}

/**
 * Every booking input. The owning dialog holds the form, the room / guest
 * lookups and the mutation, and wraps these in its own `<fieldset>`.
 */
export function BookingFormFields({
  form,
  rooms,
  guests,
  pending,
}: BookingFormFieldsProps) {
  const {
    control,
    register,
    formState: { errors },
  } = form
  const checkIn = useWatch({ control, name: "check_in_date" })

  return (
    <>
      {/* Room */}
      <div className="grid gap-2">
        <Label htmlFor="booking-room" className={labelClassName}>
          Room
        </Label>
        <Controller
          control={control}
          name="room_id"
          render={({ field }) => (
            <RoomSelect
              id="booking-room"
              ref={field.ref}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              rooms={rooms.data}
              loading={rooms.isPending}
              disabled={pending || rooms.isError}
              invalid={Boolean(errors.room_id)}
              describedBy={errors.room_id ? "booking-room-error" : undefined}
              className={`${inputClassName} w-full data-[size=default]:h-11`}
            />
          )}
        />
        {rooms.isError ? (
          <LookupError
            message="We couldn't load rooms."
            onRetry={rooms.refetch}
          />
        ) : (
          <FieldError
            id="booking-room-error"
            message={errors.room_id?.message}
          />
        )}
      </div>

      {/* Guest */}
      <div className="grid gap-2">
        <Label htmlFor="booking-guest" className={labelClassName}>
          Guest
        </Label>
        <Controller
          control={control}
          name="guest_id"
          render={({ field }) => (
            <GuestCombobox
              id="booking-guest"
              ref={field.ref}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              guests={guests.data}
              loading={guests.isPending}
              disabled={pending || guests.isError}
              invalid={Boolean(errors.guest_id)}
              describedBy={errors.guest_id ? "booking-guest-error" : undefined}
              className={inputClassName}
            />
          )}
        />
        {guests.isError ? (
          <LookupError
            message="We couldn't load guests."
            onRetry={guests.refetch}
          />
        ) : (
          <FieldError
            id="booking-guest-error"
            message={errors.guest_id?.message}
          />
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Check-in */}
        <div className="grid gap-2">
          <Label htmlFor="booking-check-in" className={labelClassName}>
            Check-in
          </Label>
          <Controller
            control={control}
            name="check_in_date"
            render={({ field }) => (
              <StayDatePicker
                id="booking-check-in"
                ref={field.ref}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                minDate={startOfToday()}
                placeholder="Arrival date"
                clearLabel="Clear check-in date"
                disabled={pending}
                invalid={Boolean(errors.check_in_date)}
                describedBy={
                  errors.check_in_date ? "booking-check-in-error" : undefined
                }
                className={inputClassName}
              />
            )}
          />
          <FieldError
            id="booking-check-in-error"
            message={errors.check_in_date?.message}
          />
        </div>

        {/* Check-out */}
        <div className="grid gap-2">
          <Label htmlFor="booking-check-out" className={labelClassName}>
            Check-out
          </Label>
          <Controller
            control={control}
            name="check_out_date"
            render={({ field }) => (
              <StayDatePicker
                id="booking-check-out"
                ref={field.ref}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                // A stay is at least one night, so check-out opens on the
                // day after check-in.
                minDate={checkIn ? addDays(checkIn, 1) : startOfToday()}
                placeholder="Departure date"
                clearLabel="Clear check-out date"
                disabled={pending}
                invalid={Boolean(errors.check_out_date)}
                describedBy={
                  errors.check_out_date ? "booking-check-out-error" : undefined
                }
                className={inputClassName}
              />
            )}
          />
          <FieldError
            id="booking-check-out-error"
            message={errors.check_out_date?.message}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Adults */}
        <div className="grid gap-2">
          <Label htmlFor="booking-adults" className={labelClassName}>
            Adults
          </Label>
          <Input
            id="booking-adults"
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_OCCUPANTS}
            step={1}
            className={inputClassName}
            aria-invalid={Boolean(errors.adults)}
            aria-describedby={
              errors.adults ? "booking-adults-error" : undefined
            }
            {...register("adults", { valueAsNumber: true })}
          />
          <FieldError
            id="booking-adults-error"
            message={errors.adults?.message}
          />
        </div>

        {/* Children */}
        <div className="grid gap-2">
          <Label htmlFor="booking-children" className={labelClassName}>
            Children
          </Label>
          <Input
            id="booking-children"
            type="number"
            inputMode="numeric"
            min={0}
            max={MAX_OCCUPANTS}
            step={1}
            className={inputClassName}
            aria-invalid={Boolean(errors.children)}
            aria-describedby={
              errors.children ? "booking-children-error" : undefined
            }
            {...register("children", { valueAsNumber: true })}
          />
          <FieldError
            id="booking-children-error"
            message={errors.children?.message}
          />
        </div>
      </div>

      {/* Special requests */}
      <div className="grid gap-2">
        <Label htmlFor="booking-special-requests" className={labelClassName}>
          Special requests{" "}
          <span className="font-normal text-muted-foreground normal-case">
            (optional)
          </span>
        </Label>
        <Textarea
          id="booking-special-requests"
          rows={3}
          placeholder="Late check-in, extra pillows, ground floor…"
          className="min-h-24 rounded-lg border-border bg-canvas px-3.5 py-2.5 text-base focus-visible:border-brand-azure focus-visible:ring-brand-azure/20 md:text-base dark:bg-input/30"
          aria-invalid={Boolean(errors.special_requests)}
          aria-describedby={
            errors.special_requests
              ? "booking-special-requests-error"
              : undefined
          }
          {...register("special_requests")}
        />
        <FieldError
          id="booking-special-requests-error"
          message={errors.special_requests?.message}
        />
      </div>
    </>
  )
}
