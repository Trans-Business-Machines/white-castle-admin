"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { HandCoins, Loader } from "lucide-react"
import { Controller, useForm, useWatch } from "react-hook-form"
import toast from "react-hot-toast"
import { primaryButtonClassName } from "@/components/bookings/booking-change-summary"
import {
  PaymentMethodField,
  TransactionReferenceField,
} from "@/components/payments/payment-form-fields"
import { Button } from "@/components/ui/button"
import { DialogFooter } from "@/components/ui/dialog"
import { bookingsQueryKey } from "@/lib/api/bookings"
import { getApiErrorMessage } from "@/lib/api/errors"
import { createPayment, paymentsQueryKey } from "@/lib/api/payments"
import { formatAmount } from "@/lib/format"
import {
  emptyStayChangePaymentValues,
  isCashMethod,
  stayChangePaymentSchema,
  toStayChangePaymentPayload,
  type StayChangePaymentValues,
} from "@/lib/schemas/payments"
import type { StayChangePaymentType } from "@/lib/types"

/** Lets the dialog tell a payment is saving, so it can't be closed mid-request. */
export const stayChangePaymentMutationKey = (bookingId: string) =>
  ["payments", "create", "stay-change", bookingId] as const

/** How each stay change's payment is described in the form. */
const PAYMENT_TYPE_COPY: Record<StayChangePaymentType, string> = {
  extension: "an extension payment",
  extra_persons: "an extra-person payment",
}

interface StayChangePaymentFormProps {
  bookingId: string
  bookingRef: string
  /** The change's `total_extra_charge`. */
  amount: number
  /** The booking's currency; KES when missing. */
  currency?: string | null
  paymentType: StayChangePaymentType
  /** Hides the form again without saving. */
  onCancel: () => void
  /** Called once the payment is recorded. */
  onRecorded: () => void
}

/**
 * Records the payment for a stay change (`POST /payments/create` with
 * `payment_type` `extension` or `extra_persons`). The booking and the
 * amount come from the change; staff only pick the method and, for M-Pesa,
 * the transaction reference. The payment starts `pending`, and the guest
 * can't check out until it's verified on `/payments`.
 */
export function StayChangePaymentForm({
  bookingId,
  bookingRef,
  amount,
  currency,
  paymentType,
  onCancel,
  onRecorded,
}: StayChangePaymentFormProps) {
  const queryClient = useQueryClient()

  const {
    control,
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<StayChangePaymentValues>({
    resolver: zodResolver(stayChangePaymentSchema),
    defaultValues: emptyStayChangePaymentValues,
  })
  const isCash = isCashMethod(useWatch({ control, name: "method" }))

  const mutation = useMutation({
    mutationKey: stayChangePaymentMutationKey(bookingId),
    mutationFn: (values: StayChangePaymentValues) =>
      createPayment(
        toStayChangePaymentPayload(values, {
          booking_id: bookingId,
          booking_ref: bookingRef,
          amount,
          payment_type: paymentType,
        })
      ),
    onSuccess: async () => {
      // The new payment joins the list, and check-out now waits on it.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: paymentsQueryKey }),
        queryClient.invalidateQueries({ queryKey: bookingsQueryKey }),
      ])
      toast.success(
        `${formatAmount(amount, currency)} recorded on ${bookingRef}. Verify it on Payments before check-out.`
      )
      onRecorded()
    },
    onError: (err) => {
      setError("root", {
        message: getApiErrorMessage(
          err,
          "We couldn't record this payment. Try again."
        ),
      })
    },
  })

  return (
    <form
      onSubmit={handleSubmit((values) => mutation.mutate(values))}
      noValidate
      aria-label={`Record ${PAYMENT_TYPE_COPY[paymentType]}`}
    >
      <fieldset
        disabled={mutation.isPending}
        className="grid min-w-0 gap-4 border-t pt-4"
      >
        <p className="text-sm text-muted-foreground">
          Recording{" "}
          <span className="font-semibold text-foreground">
            {formatAmount(amount, currency)}
          </span>{" "}
          as {PAYMENT_TYPE_COPY[paymentType]} on{" "}
          <span className="font-semibold text-foreground">{bookingRef}</span>.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            control={control}
            name="method"
            render={({ field }) => (
              <PaymentMethodField
                id="extension-payment-method"
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
                disabled={mutation.isPending}
                error={errors.method?.message}
              />
            )}
          />
          <TransactionReferenceField
            id="extension-payment-reference"
            cash={isCash}
            error={errors.reference?.message}
            {...register("reference")}
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
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="h-11 rounded-full px-5"
          >
            Cancel
          </Button>
          <Button type="submit" className={primaryButtonClassName}>
            {mutation.isPending ? (
              <span className="inline-flex items-center gap-2">
                <Loader aria-hidden="true" className="animate-spin" />
                Recording
              </span>
            ) : (
              <>
                <HandCoins aria-hidden="true" />
                Record payment
              </>
            )}
          </Button>
        </DialogFooter>
      </fieldset>
    </form>
  )
}
