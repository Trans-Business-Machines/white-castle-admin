import type { Metadata } from "next"
import { RequireRole } from "@/components/auth/require-role"
import { GuestsReportView } from "@/components/reports/guests-report-view"
import { REPORTS_ROLES } from "@/lib/roles"
import { parseReportDateRange, type ReportSearchParams } from "@/lib/reports"

export const metadata: Metadata = { title: "Guests report" }

interface GuestsReportPageProps {
  searchParams: Promise<ReportSearchParams>
}

export default async function GuestsReportPage({
  searchParams,
}: GuestsReportPageProps) {
  const range = parseReportDateRange(await searchParams)

  return (
    <RequireRole roles={REPORTS_ROLES} area="reports">
      <GuestsReportView range={range} />
    </RequireRole>
  )
}
