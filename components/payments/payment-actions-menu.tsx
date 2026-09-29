"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { BadgeCheck, CircleX, EllipsisVertical, HandCoins } from "lucide-react"
import toast from "react-hot-toast"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { CompletePaymentDialog } from "@/components/payments/complete-payment-dialog"
import { RejectPaymentDialog } from "@/components/payments/reject-payment-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { bookingsQueryKey } from "@/lib/api/bookings"
import { getApiErrorMessage } from "@/lib/api/errors"
import { paymentsQueryKey, verifyPayment } from "@/lib/api/payments"
import { formatCurrency } from "@/lib/format"
import { getPaymentMethodLabel } from "@/lib/payments"
import { hasRole, PAYMENT_REVIEW_ROLES } from "@/lib/roles"
import type { Payment } from "@/lib/types"
import { useAuth } from "@/providers/auth-provider"

/** Only a payment still waiting on its proof can be verified or rejected. */
const PENDING_STATUS = "pending"

/** A deposit leaves a balance, which "Complete payment" records. */
const DEPOSIT_TYPE = "deposit"

/**
 * Row menu for the payments table: Verify (`PATCH /payments/{id}/verify`,
 * after a confirm, no body) and Reject (asks for a reason). The backend
 * records who did it from the access token. Both are disabled once the
 * payment has left `pending`; they're only rendered for
 * `PAYMENT_REVIEW_ROLES`. Deposits also get Complete payment, which records
 * the booking's balance (`POST /payments/complete/{booking_ref}`). With
 * nothing to offer the signed-in role, the cell shows a dash instead.
 */
function PaymentActionsMenu({ payment }: { payment: Payment }) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [dialog, setDialog] = useState<"verify" | "reject" | "complete" | null>(
    null
  )

  const isPending = payment.status.toLowerCase() === PENDING_STATUS
  const isDeposit = payment.payment_type.toLowerCase() === DEPOSIT_TYPE
  const canReview = hasRole(user?.role, PAYMENT_REVIEW_ROLES)

  const verify = useMutation({
    mutationFn: () => verifyPayment(payment.payment_id),
    onSuccess: async () => {
      // The list, the stats cards and the booking's payment status all move.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: paymentsQueryKey }),
        queryClient.invalidateQueries({ queryKey: bookingsQueryKey }),
      ])
      toast.success(`The payment on ${payment.booking_ref} was verified.`)
      setDialog(null)
    },
  })

  function openVerify() {
    verify.reset()
    setDialog("verify")
  }

  if (!canReview && !isDeposit) {
    return <span className="text-muted-foreground">—</span>
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for the payment on booking ${payment.booking_ref}`}
            className="rounded-full text-muted-foreground hover:text-foreground data-open:bg-muted"
          >
            <EllipsisVertical aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {canReview ? (
            <>
              {!isPending ? (
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                  This payment is already {payment.status.toLowerCase()}.
                </DropdownMenuLabel>
              ) : null}
              <DropdownMenuItem disabled={!isPending} onSelect={openVerify}>
                <BadgeCheck aria-hidden="true" />
                Verify payment
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                disabled={!isPending}
                onSelect={() => setDialog("reject")}
              >
                <CircleX aria-hidden="true" />
                Reject payment
              </DropdownMenuItem>
            </>
          ) : null}
          {isDeposit ? (
            <>
              {canReview ? <DropdownMenuSeparator /> : null}
              <DropdownMenuItem onSelect={() => setDialog("complete")}>
                <HandCoins aria-hidden="true" />
                Complete payment
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      {canReview ? (
        <>
          <ConfirmDialog
            open={dialog === "verify"}
            onOpenChange={(open) => setDialog(open ? "verify" : null)}
            title="Verify this payment?"
            description={
              <>
                Confirm you&apos;ve received the{" "}
                {formatCurrency(payment.amount)}{" "}
                {getPaymentMethodLabel(payment.method)} payment
                {payment.reference ? ` (${payment.reference})` : ""} on booking{" "}
                <span className="font-semibold text-foreground">
                  {payment.booking_ref}
                </span>
                .
                {payment.evidence_url ? null : (
                  <>
                    {" "}
                    <span className="font-semibold text-foreground">
                      No proof was attached to this payment.
                    </span>
                  </>
                )}
              </>
            }
            confirmLabel="Verify payment"
            pendingLabel="Verifying"
            isPending={verify.isPending}
            error={
              verify.isError
                ? getApiErrorMessage(
                    verify.error,
                    "We couldn't verify this payment. Try again."
                  )
                : null
            }
            onConfirm={() => verify.mutate()}
          />

          <RejectPaymentDialog
            payment={payment}
            open={dialog === "reject"}
            onOpenChange={(open) => setDialog(open ? "reject" : null)}
          />
        </>
      ) : null}

      <CompletePaymentDialog
        payment={payment}
        open={dialog === "complete"}
        onOpenChange={(open) => setDialog(open ? "complete" : null)}
      />
    </>
  )
}

export { PaymentActionsMenu }
