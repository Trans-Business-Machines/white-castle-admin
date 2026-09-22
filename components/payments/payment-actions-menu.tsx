"use client"

import { useState } from "react"
import { EllipsisVertical, Receipt } from "lucide-react"
import { RecordPaymentDialog } from "@/components/payments/record-payment-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Payment } from "@/lib/types"

/**
 * Row menu for the payments table. Record payment reopens the form
 * pre-filled from this row, for the common case of a guest settling the
 * rest of a booking through the same channel.
 */
function PaymentActionsMenu({ payment }: { payment: Payment }) {
  const [recording, setRecording] = useState(false)

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
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onSelect={() => setRecording(true)}>
            <Receipt aria-hidden="true" />
            Record payment
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <RecordPaymentDialog
        payment={payment}
        open={recording}
        onOpenChange={setRecording}
      />
    </>
  )
}

export { PaymentActionsMenu }
