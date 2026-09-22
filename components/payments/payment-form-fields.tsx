"use client"

import { Controller, type UseFormReturn } from "react-hook-form"
import { PaymentBookingCombobox } from "@/components/payments/payment-booking-combobox"
import { PhotoDropzone } from "@/components/units/photo-dropzone"
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
  EVIDENCE_TYPES,
  getEvidenceError,
  PAYMENT_METHODS,
  PAYMENT_TYPES,
  type PaymentValues,
} from "@/lib/schemas/payments"
import type { Booking } from "@/lib/types"

const labelClassName =
  "font-ibm-plex text-xs font-semibold tracking-wide text-iron uppercase"
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

/** Inline "couldn't load" notice with a retry link for the bookings lookup. */
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

interface PaymentFormFieldsProps {
  form: UseFormReturn<PaymentValues>
  bookings: {
    data: Booking[] | undefined
    isPending: boolean
    isError: boolean
    refetch: () => void
  }
  /**
   * Locks the details once the payment itself is saved, so a retry only
   * repeats the proof upload.
   */
  detailsLocked: boolean
  /** Disables the popover and select pickers while a request is in flight. */
  pending: boolean
}

/**
 * Every payment input. The owning dialog holds the form, the bookings
 * lookup and the mutation.
 */
export function PaymentFormFields({
  form,
  bookings,
  detailsLocked,
  pending,
}: PaymentFormFieldsProps) {
  const {
    control,
    register,
    setValue,
    setError,
    clearErrors,
    getValues,
    formState: { errors },
  } = form

  return (
    <>
      <fieldset disabled={detailsLocked} className="grid min-w-0 gap-4">
        {/* Booking */}
        <div className="grid gap-2">
          <Label htmlFor="payment-booking" className={labelClassName}>
            Booking
          </Label>
          <Controller
            control={control}
            name="booking_id"
            render={({ field }) => (
              <PaymentBookingCombobox
                id="payment-booking"
                ref={field.ref}
                value={field.value}
                onBlur={field.onBlur}
                onChange={(booking) => {
                  // One pick fills both fields the API asks for.
                  field.onChange(booking?.booking_id ?? "")
                  setValue("booking_ref", booking?.reference ?? "", {
                    shouldValidate: Boolean(booking),
                  })
                }}
                bookings={bookings.data}
                fallbackRef={getValues("booking_ref")}
                loading={bookings.isPending}
                disabled={detailsLocked || pending || bookings.isError}
                invalid={Boolean(errors.booking_id)}
                describedBy={
                  errors.booking_id ? "payment-booking-error" : undefined
                }
                className={inputClassName}
              />
            )}
          />
          {bookings.isError ? (
            <LookupError
              message="We couldn't load unpaid bookings."
              onRetry={bookings.refetch}
            />
          ) : (
            <FieldError
              id="payment-booking-error"
              message={
                errors.booking_id?.message ?? errors.booking_ref?.message
              }
            />
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Amount */}
          <div className="grid gap-2">
            <Label htmlFor="payment-amount" className={labelClassName}>
              Amount (KES)
            </Label>
            <Input
              id="payment-amount"
              type="number"
              inputMode="decimal"
              min={1}
              step="any"
              placeholder="13500"
              className={inputClassName}
              aria-invalid={Boolean(errors.amount)}
              aria-describedby={
                errors.amount ? "payment-amount-error" : undefined
              }
              {...register("amount", { valueAsNumber: true })}
            />
            <FieldError
              id="payment-amount-error"
              message={errors.amount?.message}
            />
          </div>

          {/* Payment type */}
          <div className="grid gap-2">
            <Label htmlFor="payment-type" className={labelClassName}>
              Payment type
            </Label>
            <Controller
              control={control}
              name="payment_type"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={detailsLocked || pending}
                >
                  <SelectTrigger
                    id="payment-type"
                    ref={field.ref}
                    onBlur={field.onBlur}
                    aria-invalid={Boolean(errors.payment_type)}
                    aria-describedby={
                      errors.payment_type ? "payment-type-error" : undefined
                    }
                    className={`${inputClassName} w-full data-[size=default]:h-11`}
                  >
                    <SelectValue placeholder="Choose a type" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError
              id="payment-type-error"
              message={errors.payment_type?.message}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Method */}
          <div className="grid gap-2">
            <Label htmlFor="payment-method" className={labelClassName}>
              Method
            </Label>
            <Controller
              control={control}
              name="method"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={detailsLocked || pending}
                >
                  <SelectTrigger
                    id="payment-method"
                    ref={field.ref}
                    onBlur={field.onBlur}
                    aria-invalid={Boolean(errors.method)}
                    aria-describedby={
                      errors.method ? "payment-method-error" : undefined
                    }
                    className={`${inputClassName} w-full data-[size=default]:h-11`}
                  >
                    <SelectValue placeholder="Choose a method" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError
              id="payment-method-error"
              message={errors.method?.message}
            />
          </div>

          {/* Transaction reference */}
          <div className="grid gap-2">
            <Label htmlFor="payment-reference" className={labelClassName}>
              Transaction reference
            </Label>
            <Input
              id="payment-reference"
              placeholder="e.g. SJ48KD92LP"
              autoComplete="off"
              className={inputClassName}
              aria-invalid={Boolean(errors.reference)}
              aria-describedby={
                errors.reference ? "payment-reference-error" : undefined
              }
              {...register("reference")}
            />
            <FieldError
              id="payment-reference-error"
              message={errors.reference?.message}
            />
          </div>
        </div>

        {/* Notes */}
        <div className="grid gap-2">
          <Label htmlFor="payment-notes" className={labelClassName}>
            Notes{" "}
            <span className="font-normal text-muted-foreground normal-case">
              (optional)
            </span>
          </Label>
          <Textarea
            id="payment-notes"
            rows={3}
            placeholder="Paid at the front desk, balance due on arrival…"
            className="min-h-24 rounded-lg border-border bg-canvas px-3.5 py-2.5 text-base focus-visible:border-brand-azure focus-visible:ring-brand-azure/20 md:text-base dark:bg-input/30"
            aria-invalid={Boolean(errors.notes)}
            aria-describedby={errors.notes ? "payment-notes-error" : undefined}
            {...register("notes")}
          />
          <FieldError
            id="payment-notes-error"
            message={errors.notes?.message}
          />
        </div>
      </fieldset>

      {/* Proof of payment — uploaded after the record is created, so it stays
          editable while a failed upload is retried. */}
      <div className="grid gap-2">
        <Label htmlFor="payment-evidence" className={labelClassName}>
          Proof of payment{" "}
          <span className="font-normal text-muted-foreground normal-case">
            (optional)
          </span>
        </Label>
        <Controller
          control={control}
          name="evidence"
          render={({ field }) => (
            <PhotoDropzone
              id="payment-evidence"
              value={field.value}
              remaining={1 - field.value.length}
              disabled={pending}
              invalid={Boolean(errors.evidence)}
              describedBy={
                errors.evidence ? "payment-evidence-error" : undefined
              }
              accept={EVIDENCE_TYPES}
              validate={getEvidenceError}
              hint="JPG, PNG or WebP, up to 2 MB — a screenshot or receipt"
              fullMessage="One proof image is attached. Remove it to pick another."
              overflowMessage={(count) =>
                `Only one proof image can be attached, so ${count} ${
                  count === 1 ? "image was" : "images were"
                } left out.`
              }
              onChange={(files) => {
                clearErrors("evidence")
                field.onChange(files)
              }}
              onReject={(message) => setError("evidence", { message })}
            />
          )}
        />
        <FieldError
          id="payment-evidence-error"
          message={errors.evidence?.message}
        />
      </div>
    </>
  )
}
