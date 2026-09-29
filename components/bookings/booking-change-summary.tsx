"use client"

import type { ReactNode } from "react"
import { cn } from "cn"
import { CircleCheck, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatCurrency } from "@/lib/format"

export interface ChargeRow {
  label: string
  value: ReactNode
  /** Bold, with a rule above: the charge the guest owes. */
  emphasis?: boolean
}

export interface ChangePayment {
  required: boolean
  amount: number
  reference: string
  /** Completes "Ask {guest} to pay KES … {reason}", e.g. "for the extra nights". */
  reason: string
}

interface BookingChangeSummaryProps {
  title: string
  description: ReactNode
  guestName: string
  rows: ChargeRow[]
  payment: ChangePayment
  /** Rendered under the payment note, e.g. a form to record the payment. */
  children?: ReactNode
  /** Replaces the default Close footer; pass `null` to render none. */
  footer?: ReactNode
}

/**
 * Success view for the stay-changing dialogs (extend, extra people): the
 * charges the backend worked out, a prompt to collect them when payment is
 * required, and a Close button (or the caller's `footer`). Render it inside
 * the dialog's `DialogContent` in place of the form.
 */
function BookingChangeSummary({
  title,
  description,
  guestName,
  rows,
  payment,
  children,
  footer,
}: BookingChangeSummaryProps) {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-xl font-bold">
          <CircleCheck
            aria-hidden="true"
            className="size-5 text-emerald-600 dark:text-emerald-400"
          />
          {title}
        </DialogTitle>
        <DialogDescription className="text-base text-muted-foreground">
          {description}
        </DialogDescription>
      </DialogHeader>

      <dl className="grid gap-3 rounded-lg border bg-muted/40 p-4 text-sm">
        {rows.map((row) => (
          <div
            key={row.label}
            className={cn(
              "flex items-center justify-between gap-4",
              row.emphasis && "border-t pt-3 font-semibold"
            )}
          >
            <dt
              className={
                row.emphasis ? "text-foreground" : "text-muted-foreground"
              }
            >
              {row.label}
            </dt>
            <dd className="text-right text-foreground tabular-nums">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>

      {payment.required ? (
        <p
          role="status"
          className="flex items-start gap-3 rounded-md border border-tertiary/40 bg-tertiary/10 px-3.5 py-3 text-sm text-tertiary"
        >
          <Wallet aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>
            Ask {guestName} to pay{" "}
            <span className="font-semibold">
              {formatCurrency(payment.amount)}
            </span>{" "}
            {payment.reason}, quoting booking reference{" "}
            <span className="font-semibold">{payment.reference}</span>.
          </span>
        </p>
      ) : (
        <p role="status" className="text-sm text-muted-foreground">
          No payment is needed for this change.
        </p>
      )}

      {children}

      {footer === undefined ? (
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" className={primaryButtonClassName}>
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      ) : (
        footer
      )}
    </>
  )
}

const primaryButtonClassName =
  "h-11 rounded-full bg-brand-azure px-5 text-white hover:bg-brand-azure/90 focus-visible:ring-brand-azure/30"

/** "1 night" / "2 nights". */
function pluralizeNights(count: number) {
  return `${count} night${count === 1 ? "" : "s"}`
}

export { BookingChangeSummary, pluralizeNights, primaryButtonClassName }
