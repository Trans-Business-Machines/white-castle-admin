import { PaymentsTable } from "@/components/payments/payments-table"
import { RecordPaymentButton } from "@/components/payments/record-payment-button"

export default function Payments() {
  return (
    <section>
      {/* Record payment CTA */}
      <div className="mb-4 flex justify-end gap-2">
        <RecordPaymentButton />
      </div>

      {/* Payment listings */}
      <PaymentsTable />
    </section>
  )
}
