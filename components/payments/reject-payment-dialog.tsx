"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { CircleX, Loader } from "lucide-react"
import { useForm } from "react-hook-form"
import toast from "react-hot-toast"
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
import { Textarea } from "@/components/ui/textarea"
import { bookingsQueryKey } from "@/lib/api/bookings"
import { getApiErrorMessage } from "@/lib/api/errors"
import { paymentsQueryKey, rejectPayment } from "@/lib/api/payments"
import { formatAmount } from "@/lib/format"
import {
  rejectPaymentSchema,
  toRejectPaymentPayload,
  type RejectPaymentValues,
} from "@/lib/schemas/payments"
import type { Payment } from "@/lib/types"

interface RejectPaymentDialogProps {
  payment: Payment
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Asks for a reason, then rejects the payment (`PATCH
 * /payments/{id}/reject`); the reason is stored as the payment's
 * `rejection_reason` and the backend records who rejected it from the
 * access token.
 */
function RejectPaymentDialog(props: RejectPaymentDialogProps) {
  // Mounted only while open so the reason field starts empty each time.
  if (!props.open) return null
  return <RejectForm {...props} />
}

function RejectForm({
  payment,
  onOpenChange,
}: Omit<RejectPaymentDialogProps, "open">) {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RejectPaymentValues>({
    resolver: zodResolver(rejectPaymentSchema),
    defaultValues: { reason: "" },
  })

  const mutation = useMutation({
    mutationFn: (values: RejectPaymentValues) => {
      return rejectPayment(payment.payment_id, toRejectPaymentPayload(values))
    },
    onSuccess: async () => {
      // The list, the stats cards and the booking's payment status all move.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: paymentsQueryKey }),
        queryClient.invalidateQueries({ queryKey: bookingsQueryKey }),
      ])
      toast.success(`The payment on ${payment.booking_ref} was rejected.`)
      onOpenChange(false)
    },
    onError: (err) => {
      setError("root", {
        message: getApiErrorMessage(
          err,
          "We couldn't reject this payment. Try again."
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
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Reject this payment?
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            The {formatAmount(payment.amount, payment.currency)} payment on
            booking{" "}
            <span className="font-semibold text-foreground">
              {payment.booking_ref}
            </span>{" "}
            will be marked as rejected. The reason is kept on the payment so
            other staff know why.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          noValidate
        >
          <fieldset disabled={mutation.isPending} className="grid gap-4">
            <div className="grid gap-2">
              <Label
                htmlFor="payment-rejection-reason"
                className="font-heading text-xs font-semibold tracking-wide text-iron uppercase"
              >
                Reason
              </Label>
              <Textarea
                id="payment-rejection-reason"
                autoFocus
                rows={4}
                placeholder="e.g. The M-Pesa code doesn't match any transaction we received."
                className="min-h-28 rounded-lg border-border bg-canvas px-3.5 py-2.5 text-base focus-visible:border-brand-azure focus-visible:ring-brand-azure/20 md:text-base dark:bg-input/30"
                aria-invalid={Boolean(errors.reason)}
                aria-describedby={
                  errors.reason ? "payment-rejection-reason-error" : undefined
                }
                {...register("reason")}
              />
              {errors.reason ? (
                <p
                  id="payment-rejection-reason-error"
                  className="text-sm text-destructive"
                >
                  {errors.reason.message}
                </p>
              ) : null}
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
                className="h-11 rounded-full bg-destructive px-5 text-white hover:bg-destructive/90 focus-visible:ring-destructive/30"
              >
                {mutation.isPending ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader aria-hidden="true" className="animate-spin" />
                    Rejecting
                  </span>
                ) : (
                  <>
                    <CircleX aria-hidden="true" />
                    Reject payment
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

export { RejectPaymentDialog }
