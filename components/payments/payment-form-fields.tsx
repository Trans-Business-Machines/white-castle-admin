"use client"

import {
  Controller,
  useWatch,
  type UseFormRegisterReturn,
  type UseFormReturn,
} from "react-hook-form"
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
import {
  EVIDENCE_TYPES,
  getEvidenceError,
  isCashMethod,
  PAYMENT_METHODS,
  PAYMENT_TYPES,
  type PaymentValues,
} from "@/lib/schemas/payments"
import { getPaymentAmount } from "@/lib/payments"
import type { Booking } from "@/lib/types"

export const labelClassName =
  "font-ibm-plex text-xs font-semibold tracking-wide text-iron uppercase"
export const inputClassName =
  "h-11 rounded-lg border-border bg-canvas px-3.5 text-base focus-visible:border-brand-azure focus-visible:ring-brand-azure/20 md:text-base dark:bg-input/30"

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} className="text-sm text-destructive">
      {message}
    </p>
  )
}

/**
 * The M-Pesa / Cash picker, shared by the record and complete payment
 * forms. The owning form decides what else changes with the method.
 */
export function PaymentMethodField({
  id,
  ref,
  value,
  onChange,
  onBlur,
  disabled,
  error,
}: {
  id: string
  ref?: React.Ref<HTMLButtonElement>
  value: string
  onChange: (method: string) => void
  onBlur: () => void
  disabled?: boolean
  error?: string
}) {
  const errorId = `${id}-error`
  return (
    <div className="grid gap-2">
      <Label htmlFor={id} className={labelClassName}>
        Method
      </Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger
          id={id}
          ref={ref}
          onBlur={onBlur}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
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
      <FieldError id={errorId} message={error} />
    </div>
  )
}

/**
 * The transaction reference input, disabled for cash (which leaves no
 * reference). Spread `register("reference")` onto it.
 */
export function TransactionReferenceField({
  id,
  cash,
  error,
  ...registration
}: UseFormRegisterReturn & { id: string; cash: boolean; error?: string }) {
  const errorId = `${id}-error`
  return (
    <div className="grid gap-2">
      <Label htmlFor={id} className={labelClassName}>
        Transaction reference
      </Label>
      {/* The input drops pointer events when disabled, so the not-allowed
          cursor has to come from this wrapper. */}
      <div className={cash ? "cursor-not-allowed" : ""}>
        <Input
          id={id}
          placeholder={cash ? "Not needed for cash" : "e.g. SJ48KD92LP"}
          autoComplete="off"
          className={inputClassName}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          {...registration}
          disabled={cash}
        />
      </div>
      <FieldError id={errorId} message={error} />
    </div>
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
  const isCash = isCashMethod(useWatch({ control, name: "method" }))
  const paymentType = useWatch({ control, name: "payment_type" })

  /**
   * The amount isn't typed: it follows the picked booking and type (the
   * booking's total for a full payment, its deposit for a deposit).
   */
  function syncAmount(booking: Booking | undefined, type: string) {
    const amount = getPaymentAmount(booking, type)
    setValue("amount", amount ?? Number.NaN, {
      shouldValidate: amount !== null,
    })
    if (amount === null) clearErrors("amount")
  }

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
                  syncAmount(booking ?? undefined, getValues("payment_type"))
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

        <div className="grid items-start gap-4 sm:grid-cols-2">
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
                  onValueChange={(type) => {
                    field.onChange(type)
                    syncAmount(
                      bookings.data?.find(
                        (booking) =>
                          booking.booking_id === getValues("booking_id")
                      ),
                      type
                    )
                  }}
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

          {/* Amount */}
          <div className="grid gap-2">
            <Label htmlFor="payment-amount" className={labelClassName}>
              Amount (KES)
            </Label>
            <Input
              id="payment-amount"
              type="number"
              inputMode="decimal"
              readOnly
              placeholder="Pick a booking and type"
              className={`${inputClassName} cursor-default read-only:bg-muted read-only:focus-visible:border-border read-only:focus-visible:ring-0`}
              aria-invalid={Boolean(errors.amount)}
              aria-describedby={
                errors.amount ? "payment-amount-error" : undefined
              }
              {...register("amount", { valueAsNumber: true })}
            />
            {errors.amount ? (
              <FieldError
                id="payment-amount-error"
                message={errors.amount.message}
              />
            ) : paymentType ? (
              <p className="text-xs text-muted-foreground">
                {paymentType === "deposit"
                  ? "The booking's deposit amount."
                  : "The booking's total amount."}
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            control={control}
            name="method"
            render={({ field }) => (
              <PaymentMethodField
                id="payment-method"
                ref={field.ref}
                value={field.value}
                onBlur={field.onBlur}
                onChange={(method) => {
                  field.onChange(method)
                  // Cash has no reference; drop anything typed for M-Pesa.
                  if (isCashMethod(method)) {
                    setValue("reference", "")
                    clearErrors("reference")
                  }
                }}
                disabled={detailsLocked || pending}
                error={errors.method?.message}
              />
            )}
          />
          <TransactionReferenceField
            id="payment-reference"
            cash={isCash}
            error={errors.reference?.message}
            {...register("reference")}
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
