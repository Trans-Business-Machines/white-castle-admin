import { RequireRole } from "@/components/auth/require-role"
import { ExportPaymentsDialog } from "@/components/payments/export-payments-dialog"
import { PaymentStatsCards } from "@/components/payments/payment-stats-cards"
import { PaymentsTable } from "@/components/payments/payments-table"
import { RecordPaymentButton } from "@/components/payments/record-payment-button"
import { PAYMENTS_ROLES } from "@/lib/roles"

export default function Payments() {
  return (
    <RequireRole roles={PAYMENTS_ROLES} area="payments">
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
    </RequireRole>
  )
}
