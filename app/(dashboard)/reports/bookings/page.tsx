import type { Metadata } from "next"
import { RequirePermission } from "@/components/auth/require-permission"
import { BookingsReportView } from "@/components/reports/bookings-report-view"
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
    <RequirePermission permission="reports:bookings" area="reports">
      <BookingsReportView filters={filters} />
    </RequirePermission>
  )
}
