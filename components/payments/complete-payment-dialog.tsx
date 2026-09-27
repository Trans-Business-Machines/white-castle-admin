"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { HandCoins, Loader } from "lucide-react"
import { Controller, useForm, useWatch } from "react-hook-form"
import toast from "react-hot-toast"
import {
  FieldError,
  inputClassName,
  labelClassName,
  PaymentMethodField,
  TransactionReferenceField,
} from "@/components/payments/payment-form-fields"
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
import { bookingsQueryKey } from "@/lib/api/bookings"
import { getApiErrorMessage } from "@/lib/api/errors"
import { completePayment, paymentsQueryKey } from "@/lib/api/payments"
import { formatCurrency } from "@/lib/format"
import {
  completePaymentSchema,
  emptyCompletePaymentValues,
  isCashMethod,
  toCompletePaymentParams,
  type CompletePaymentValues,
} from "@/lib/schemas/payments"
import type { Payment } from "@/lib/types"
import { useAuth } from "@/providers/auth-provider"

interface CompletePaymentDialogProps {
  /** The deposit whose booking is being settled. */
  payment: Payment
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Records the balance on a deposit's booking (`POST
 * /payments/complete/{booking_ref}`, sent as query params) with the
 * signed-in staff member's `user_id` as `recorded_by`.
 */
function CompletePaymentDialog(props: CompletePaymentDialogProps) {
  // Mounted only while open so the form starts empty each time.
  if (!props.open) return null
  return <CompletePaymentForm {...props} />
}

function CompletePaymentForm({
  payment,
  onOpenChange,
}: Omit<CompletePaymentDialogProps, "open">) {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const {
    control,
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<CompletePaymentValues>({
    resolver: zodResolver(completePaymentSchema),
    defaultValues: emptyCompletePaymentValues,
  })
  const isCash = isCashMethod(useWatch({ control, name: "method" }))

  const mutation = useMutation({
    mutationFn: (values: CompletePaymentValues) => {
      if (!user) throw new Error("Sign in again to complete this payment.")
      return completePayment(
        payment.booking_ref,
        toCompletePaymentParams(values, user.user_id)
      )
    },
    onSuccess: async () => {
      // The list, the stats cards and the booking's payment status all move.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: paymentsQueryKey }),
        queryClient.invalidateQueries({ queryKey: bookingsQueryKey }),
      ])
      toast.success(`The balance on ${payment.booking_ref} was recorded.`)
      onOpenChange(false)
    },
    onError: (err) => {
      setError("root", {
        message: getApiErrorMessage(
          err,
          "We couldn't complete this payment. Try again."
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
      <DialogContent showCloseButton={false} className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Complete payment
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            Record the balance on booking{" "}
            <span className="font-semibold text-foreground">
              {payment.booking_ref}
            </span>
            . A {formatCurrency(payment.amount)} deposit was paid.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          noValidate
        >
          <fieldset
            disabled={mutation.isPending}
            className="grid min-w-0 gap-4"
          >
            <div className="grid gap-2">
              <Label htmlFor="complete-amount" className={labelClassName}>
                Amount (KES)
              </Label>
              <Input
                id="complete-amount"
                type="number"
                inputMode="decimal"
                min={1}
                step="any"
                autoFocus
                placeholder="13500"
                className={inputClassName}
                aria-invalid={Boolean(errors.amount)}
                aria-describedby={
                  errors.amount ? "complete-amount-error" : undefined
                }
                {...register("amount", { valueAsNumber: true })}
              />
              <FieldError
                id="complete-amount-error"
                message={errors.amount?.message}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                control={control}
                name="method"
                render={({ field }) => (
                  <PaymentMethodField
                    id="complete-method"
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
                id="complete-reference"
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
                    <HandCoins aria-hidden="true" />
                    Complete payment
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

export { CompletePaymentDialog }
