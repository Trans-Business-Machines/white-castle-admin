import type { Metadata } from "next"
import { RequireRole } from "@/components/auth/require-role"
import { BookingsReportView } from "@/components/reports/bookings-report-view"
import { REPORTS_ROLES } from "@/lib/roles"
import {
  parseBookingsReportFilters,
  type ReportSearchParams,
} from "@/lib/reports"

export const metadata: Metadata = { title: "Bookings report" }

interface BookingsReportPageProps {
  searchParams: Promise<ReportSearchParams>
}

export default async function BookingsReportPage({
  searchParams,
}: BookingsReportPageProps) {
  const filters = parseBookingsReportFilters(await searchParams)

  return (
    <RequireRole roles={REPORTS_ROLES} area="reports">
      <BookingsReportView filters={filters} />
    </RequireRole>
  )
}
