import type { Metadata } from "next"
import { RequirePermission } from "@/components/auth/require-permission"
import { CancellationsReportView } from "@/components/reports/cancellations-report-view"
import { parseReportDateRange, type ReportSearchParams } from "@/lib/reports"

export const metadata: Metadata = { title: "Cancellations report" }

interface CancellationsReportPageProps {
  searchParams: Promise<ReportSearchParams>
}

export default async function CancellationsReportPage({
  searchParams,
}: CancellationsReportPageProps) {
  const range = parseReportDateRange(await searchParams)

  return (
    <RequirePermission permission="reports:cancellations" area="reports">
      <CancellationsReportView range={range} />
    </RequirePermission>
  )
}
