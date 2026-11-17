import type { Metadata } from "next"
import { RequirePermission } from "@/components/auth/require-permission"
import { GuestsReportView } from "@/components/reports/guests-report-view"
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
    <RequirePermission permission="reports:guests" area="reports">
      <GuestsReportView range={range} />
    </RequirePermission>
  )
}
