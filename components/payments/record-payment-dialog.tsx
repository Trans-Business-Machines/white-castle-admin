"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader } from "lucide-react"
import { useForm } from "react-hook-form"
import toast from "react-hot-toast"
import { PaymentFormFields } from "@/components/payments/payment-form-fields"
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
import { EMPTY_BOOKING_FILTERS } from "@/components/bookings/bookings-filters"
import {
  bookingsListQueryKey,
  bookingsQueryKey,
  fetchBookings,
} from "@/lib/api/bookings"
import { getApiErrorMessage } from "@/lib/api/errors"
import {
  createPayment,
  paymentsQueryKey,
  uploadPaymentEvidence,
} from "@/lib/api/payments"
import {
  emptyPaymentValues,
  isUnpaidBooking,
  paymentSchema,
  toPaymentFormValues,
  toPaymentPayload,
  type PaymentValues,
} from "@/lib/schemas/payments"
import { useAuth } from "@/providers/auth-provider"
import type { Booking, Payment } from "@/lib/types"

/** The unpaid bookings the combobox offers, from the full bookings list.
 *  Module-level so its identity is stable across renders of the form. */
const unpaidBookingsSelect = (bookings: Booking[]) =>
  bookings.filter(isUnpaidBooking)

/** Marks a failure that happened after the payment itself was saved. */
class EvidenceUploadError extends Error {
  constructor(public readonly cause: unknown) {
    super("Evidence upload failed")
  }
}

interface RecordPaymentDialogProps {
  /**
   * Pre-fills the form from an existing row, so recording another payment
   * against the same booking only means changing the amount.
   */
  payment?: Payment
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Records a payment in two steps, because proof hangs off a payment that
 * already exists: `POST /payments/create`, then `POST
 * /payments/{id}/evidence` for the picked image. If the upload fails the
 * dialog keeps the created payment, locks the details and resubmitting only
 * retries the upload.
 *
 * The form is only mounted while open so every open re-seeds from `payment`
 * and no stale values or object URLs linger between records.
 */
function RecordPaymentDialog(props: RecordPaymentDialogProps) {
  if (!props.open) return null
  return <RecordPaymentForm {...props} />
}

function RecordPaymentForm({
  payment,
  onOpenChange,
}: RecordPaymentDialogProps) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  // Set once the payment is saved so a failed upload can be retried without
  // recording the payment a second time.
  const [savedPayment, setSavedPayment] = useState<Payment | null>(null)

  // Shares the bookings page's cache: the full list arrives from one fetch
  // and only the unpaid ones reach the picker.
  const bookings = useQuery({
    queryKey: bookingsListQueryKey(EMPTY_BOOKING_FILTERS),
    queryFn: () => fetchBookings(EMPTY_BOOKING_FILTERS),
    select: unpaidBookingsSelect,
  })

  const form = useForm<PaymentValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: payment ? toPaymentFormValues(payment) : emptyPaymentValues,
  })
  const {
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = form

  const mutation = useMutation({
    mutationFn: async (values: PaymentValues) => {
      if (!user) throw new Error("Sign in again to record this payment.")

      let saved = savedPayment
      if (!saved) {
        saved = await createPayment(toPaymentPayload(values, user.user_id))
        setSavedPayment(saved)
        queryClient.invalidateQueries({ queryKey: paymentsQueryKey })
      }
      if (values.evidence.length > 0) {
        try {
          await uploadPaymentEvidence(saved.payment_id, values.evidence[0])
        } catch (error) {
          throw new EvidenceUploadError(error)
        }
      }
      return saved
    },
    onSuccess: async (saved) => {
      // The booking's payment status changes too, so refresh both lists.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: paymentsQueryKey }),
        queryClient.invalidateQueries({ queryKey: bookingsQueryKey }),
      ])
      toast.success(`Payment recorded for ${saved.booking_ref}.`)
      closeDialog()
    },
    onError: (error) => {
      if (error instanceof EvidenceUploadError) {
        setError("root", {
          message: `The payment was recorded, but the proof didn't upload: ${getApiErrorMessage(
            error.cause,
            "something went wrong."
          )} Try again to retry the upload, or cancel to add it later.`,
        })
        return
      }
      setError("root", {
        message: getApiErrorMessage(
          error,
          "We couldn't record the payment. Try again."
        ),
      })
    },
  })

  /**
   * Emptying `evidence` unmounts the dropzone preview (revoking its object
   * URL) before the dialog itself unmounts. This deliberately skips the
   * pending guard below: TanStack runs `onSuccess` before it flips
   * `isPending` off, so a guarded close would no-op after a successful save.
   */
  function closeDialog() {
    reset(emptyPaymentValues)
    onOpenChange(false)
  }

  function handleOpenChange(next: boolean) {
    // Ignore Escape / backdrop clicks while a request is in flight.
    if (mutation.isPending) return
    if (!next) closeDialog()
  }

  const detailsLocked = mutation.isPending || Boolean(savedPayment)

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto md:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl font-bold">
            Record a payment
          </DialogTitle>
          <DialogDescription>
            {payment
              ? `Recording against booking ${payment.booking_ref}. Check the amount and enter the new transaction reference.`
              : "Log what a guest has paid and attach the proof you were sent."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          noValidate
        >
          <div className="grid min-w-0 gap-4">
            <PaymentFormFields
              form={form}
              bookings={bookings}
              detailsLocked={detailsLocked}
              pending={mutation.isPending}
            />

            {errors.root ? (
              <p
                role="alert"
                className="rounded-md bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
              >
                {errors.root.message}
              </p>
            ) : null}

            <DialogFooter className="mt-2">
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-full px-5"
                  disabled={mutation.isPending}
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="h-11 flex-1 rounded-full bg-brand-azure px-5 text-white hover:bg-brand-azure/90 focus-visible:ring-brand-azure/30"
              >
                {mutation.isPending ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader aria-hidden="true" className="animate-spin" />
                    {savedPayment ? "Uploading proof" : "Recording"}
                  </span>
                ) : savedPayment ? (
                  "Retry proof upload"
                ) : (
                  "Record payment"
                )}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { RecordPaymentDialog }
