import type { Metadata } from "next"
import { RequireRole } from "@/components/auth/require-role"
import { CancellationsReportView } from "@/components/reports/cancellations-report-view"
import { REPORTS_ROLES } from "@/lib/roles"
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
    <RequireRole roles={REPORTS_ROLES} area="reports">
      <CancellationsReportView range={range} />
    </RequireRole>
  )
}
