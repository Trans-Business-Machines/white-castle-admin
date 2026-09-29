"use client"

import type { ReactNode } from "react"
import { addDays, startOfToday } from "date-fns"
import { Controller, useWatch, type UseFormReturn } from "react-hook-form"
import {
  FieldError,
  inputClassName,
  labelClassName,
} from "@/components/bookings/booking-form-fields"
import { GuestCombobox } from "@/components/bookings/guest-combobox"
import { RoomSelect } from "@/components/bookings/room-select"
import { StayDatePicker } from "@/components/bookings/stay-date-picker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  MAX_OCCUPANTS,
  MEAL_PLANS,
  type CreateBookingValues,
} from "@/lib/schemas/bookings"
import type { Guest, Unit } from "@/lib/types"

const selectClassName = `${inputClassName} w-full data-[size=default]:h-11`

/** Label + control + error, with the error id the control points at. */
function Field({
  id,
  label,
  error,
  children,
}: {
  id: string
  label: ReactNode
  error?: string
  children: ReactNode
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id} className={labelClassName}>
        {label}
      </Label>
      {children}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  )
}

/** Inline "couldn't load" notice with a retry link for a picker's query. */
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

interface Lookup<T> {
  data: T[] | undefined
  isPending: boolean
  isError: boolean
  refetch: () => void
}

interface CreateBookingFieldsProps {
  form: UseFormReturn<CreateBookingValues>
  rooms: Lookup<Unit>
  guests: Lookup<Guest>
  /** Disables the popover pickers while the booking is saving. */
  pending: boolean
}

/**
 * Every input of the create booking form. The dialog owns the form, the
 * room / guest queries and the mutation, and wraps these in its own `<fieldset>`.
 */
export function CreateBookingFields({
  form,
  rooms,
  guests,
  pending,
}: CreateBookingFieldsProps) {
  const {
    control,
    register,
    formState: { errors },
  } = form
  const checkIn = useWatch({ control, name: "check_in_date" })
  const describe = (id: string, error: unknown) =>
    error ? `${id}-error` : undefined

  return (
    <>
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
              describedBy={describe("booking-guest", errors.guest_id)}
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
              describedBy={describe("booking-room", errors.room_id)}
              className={selectClassName}
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

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="booking-check-in"
          label="Check-in"
          error={errors.check_in_date?.message}
        >
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
                describedBy={describe("booking-check-in", errors.check_in_date)}
                className={inputClassName}
              />
            )}
          />
        </Field>

        <Field
          id="booking-check-out"
          label="Check-out"
          error={errors.check_out_date?.message}
        >
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
                // A stay is at least one night.
                minDate={addDays(checkIn ?? startOfToday(), 1)}
                placeholder="Departure date"
                clearLabel="Clear check-out date"
                disabled={pending}
                invalid={Boolean(errors.check_out_date)}
                describedBy={describe(
                  "booking-check-out",
                  errors.check_out_date
                )}
                className={inputClassName}
              />
            )}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="booking-adults"
          label="Adults"
          error={errors.adults?.message}
        >
          <Input
            id="booking-adults"
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_OCCUPANTS}
            step={1}
            className={inputClassName}
            aria-invalid={Boolean(errors.adults)}
            aria-describedby={describe("booking-adults", errors.adults)}
            {...register("adults", { valueAsNumber: true })}
          />
        </Field>

        <Field
          id="booking-children"
          label="Children"
          error={errors.children?.message}
        >
          <Input
            id="booking-children"
            type="number"
            inputMode="numeric"
            min={0}
            max={MAX_OCCUPANTS}
            step={1}
            className={inputClassName}
            aria-invalid={Boolean(errors.children)}
            aria-describedby={describe("booking-children", errors.children)}
            {...register("children", { valueAsNumber: true })}
          />
        </Field>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="booking-meal-plan" className={labelClassName}>
          Meal plan
        </Label>
        <Controller
          control={control}
          name="meal_plan"
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={field.onChange}
              disabled={pending}
            >
              <SelectTrigger
                id="booking-meal-plan"
                ref={field.ref}
                onBlur={field.onBlur}
                aria-invalid={Boolean(errors.meal_plan)}
                aria-describedby={
                  errors.meal_plan
                    ? "booking-meal-plan-error booking-meal-plan-hint"
                    : "booking-meal-plan-hint"
                }
                className={selectClassName}
              >
                <SelectValue placeholder="Choose a meal plan" />
              </SelectTrigger>
              <SelectContent>
                {MEAL_PLANS.map((plan) => (
                  <SelectItem key={plan.value} value={plan.value}>
                    {plan.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <p
          id="booking-meal-plan-hint"
          className="text-sm text-muted-foreground"
        >
          Bed and breakfast adds the guest to the bed and breakfast list and
          costs extra.
        </p>
        <FieldError
          id="booking-meal-plan-error"
          message={errors.meal_plan?.message}
        />
      </div>

      <Field
        id="booking-special-requests"
        label={
          <>
            Special requests{" "}
            <span className="font-normal text-muted-foreground normal-case">
              (optional)
            </span>
          </>
        }
        error={errors.special_requests?.message}
      >
        <Textarea
          id="booking-special-requests"
          rows={3}
          placeholder="Late check-in, extra pillows, ground floor…"
          className="min-h-24 rounded-lg border-border bg-canvas px-3.5 py-2.5 text-base focus-visible:border-brand-azure focus-visible:ring-brand-azure/20 md:text-base dark:bg-input/30"
          aria-invalid={Boolean(errors.special_requests)}
          aria-describedby={describe(
            "booking-special-requests",
            errors.special_requests
          )}
          {...register("special_requests")}
        />
      </Field>
    </>
  )
}
