import type { Metadata } from "next"
import { RequirePermission } from "@/components/auth/require-permission"
import { PaymentsReportView } from "@/components/reports/payments-report-view"
import {
  parsePaymentsReportFilters,
  type ReportSearchParams,
} from "@/lib/reports"

export const metadata: Metadata = { title: "Payments report" }

interface PaymentsReportPageProps {
  searchParams: Promise<ReportSearchParams>
}

export default async function PaymentsReportPage({
  searchParams,
}: PaymentsReportPageProps) {
  const filters = parsePaymentsReportFilters(await searchParams)

  return (
    <RequirePermission permission="reports:payments" area="reports">
      <PaymentsReportView filters={filters} />
    </RequirePermission>
  )
}
