import { RequireRole } from "@/components/auth/require-role"
import { ReportCards } from "@/components/reports/report-cards"
import { REPORTS_ROLES } from "@/lib/roles"

export default function ReportsPage() {
  return (
    <RequireRole roles={REPORTS_ROLES} area="reports">
      <ReportCards />
    </RequireRole>
  )
}
