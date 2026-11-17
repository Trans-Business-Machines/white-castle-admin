import type { Metadata } from "next"
import { RequirePermission } from "@/components/auth/require-permission"
import { RevenueReportView } from "@/components/reports/revenue-report-view"
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
    <RequirePermission permission="reports:revenue" area="reports">
      <RevenueReportView range={range} />
    </RequirePermission>
  )
}
