"use client"

import { FilePreviewDialog } from "@/components/file-preview-dialog"
import {
  fetchPaymentEvidence,
  paymentEvidenceQueryKey,
} from "@/lib/api/payments"
import { formatCurrency } from "@/lib/format"
import type { Payment } from "@/lib/types"

interface PaymentEvidenceDialogProps {
  payment: Pick<Payment, "booking_ref" | "amount" | "evidence_filename">
  /** From `getEvidenceFileId(payment)`. */
  fileId: string
}

/**
 * "View" link for the payments table: opens the proof of payment (`GET
 * /payments/evidence/{file_id}`) in a `FilePreviewDialog`.
 */
function PaymentEvidenceDialog({
  payment,
  fileId,
}: PaymentEvidenceDialogProps) {
  return (
    <FilePreviewDialog
      triggerLabel="View"
      triggerAriaLabel={`View the proof of payment for booking ${payment.booking_ref}`}
      title="Proof of payment"
      description={
        <>
          {formatCurrency(payment.amount)} on booking{" "}
          <span className="font-semibold text-foreground">
            {payment.booking_ref}
          </span>
          {payment.evidence_filename ? ` · ${payment.evidence_filename}` : ""}
        </>
      }
      queryKey={paymentEvidenceQueryKey(fileId)}
      queryFn={() => fetchPaymentEvidence(fileId)}
      alt={`Proof of payment for booking ${payment.booking_ref}`}
      errorMessage="We couldn't load the proof of payment. Try again."
    />
  )
}

export { PaymentEvidenceDialog }
