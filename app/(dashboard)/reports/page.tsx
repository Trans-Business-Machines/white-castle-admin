import { RequirePermission } from "@/components/auth/require-permission"
import { ReportCards } from "@/components/reports/report-cards"

export default function ReportsPage() {
  return (
    <RequirePermission permission="reports:view" area="reports">
      <ReportCards />
    </RequirePermission>
  )
}
