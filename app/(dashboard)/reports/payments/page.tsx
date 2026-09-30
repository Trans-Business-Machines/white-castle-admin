import type { Metadata } from "next"
import { RequireRole } from "@/components/auth/require-role"
import { PaymentsReportView } from "@/components/reports/payments-report-view"
import { REPORTS_ROLES } from "@/lib/roles"
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
    <RequireRole roles={REPORTS_ROLES} area="reports">
      <PaymentsReportView filters={filters} />
    </RequireRole>
  )
}
