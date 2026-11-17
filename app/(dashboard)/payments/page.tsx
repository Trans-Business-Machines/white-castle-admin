import { RequirePermission } from "@/components/auth/require-permission"
import { ExportPaymentsDialog } from "@/components/payments/export-payments-dialog"
import { PaymentStatsCards } from "@/components/payments/payment-stats-cards"
import { PaymentsTable } from "@/components/payments/payments-table"
import { RecordPaymentButton } from "@/components/payments/record-payment-button"

export default function Payments() {
  return (
    <RequirePermission permission="payments:view" area="payments">
      <section>
        {/* Export + record payment CTAs */}
        <div className="mb-4 flex flex-wrap justify-end gap-2">
          <ExportPaymentsDialog />
          <RecordPaymentButton />
        </div>

        {/* This month's totals by status (hidden from receptionists);
            carries its own gap */}
        <PaymentStatsCards />

        {/* Payment listings */}
        <PaymentsTable />
      </section>
    </RequirePermission>
  )
}
