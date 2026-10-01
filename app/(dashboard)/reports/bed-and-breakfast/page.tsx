import type { Metadata } from "next"
import { RequireRole } from "@/components/auth/require-role"
import { BbSummaryReportView } from "@/components/reports/bb-summary-report-view"
import { REPORTS_ROLES } from "@/lib/roles"
import {
  parseBbSummaryReportFilters,
  type ReportSearchParams,
} from "@/lib/reports"

export const metadata: Metadata = { title: "Breakfast List Report" }

interface BbSummaryReportPageProps {
  searchParams: Promise<ReportSearchParams>
}

export default async function BbSummaryReportPage({
  searchParams,
}: BbSummaryReportPageProps) {
  const filters = parseBbSummaryReportFilters(await searchParams)

  return (
    <RequireRole roles={REPORTS_ROLES} area="reports">
      <BbSummaryReportView filters={filters} />
    </RequireRole>
  )
}
