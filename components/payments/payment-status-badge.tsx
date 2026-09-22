import { cn } from "cn"
import { humanizeSlug } from "@/lib/format"
import { getPaymentRecordStatusClasses } from "@/lib/payments"

const pillClassName =
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap"

/** Tinted pill whose colour follows the payment status (see `lib/payments.ts`). */
function PaymentRecordStatusBadge({
  status,
  className,
}: {
  /** Status slug from the API, e.g. "pending". */
  status: string
  className?: string
}) {
  return (
    <span
      className={cn(
        pillClassName,
        getPaymentRecordStatusClasses(status),
        className
      )}
    >
      {humanizeSlug(status)}
    </span>
  )
}

export { PaymentRecordStatusBadge }
