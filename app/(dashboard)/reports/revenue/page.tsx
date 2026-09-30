import type { Metadata } from "next"
import { RequireRole } from "@/components/auth/require-role"
import { RevenueReportView } from "@/components/reports/revenue-report-view"
import { REPORTS_ROLES } from "@/lib/roles"
import { parseReportDateRange, type ReportSearchParams } from "@/lib/reports"

export const metadata: Metadata = { title: "Revenue report" }

interface RevenueReportPageProps {
  searchParams: Promise<ReportSearchParams>
}

export default async function RevenueReportPage({
  searchParams,
}: RevenueReportPageProps) {
  const range = parseReportDateRange(await searchParams)

  return (
    <RequireRole roles={REPORTS_ROLES} area="reports">
      <RevenueReportView range={range} />
    </RequireRole>
  )
}
