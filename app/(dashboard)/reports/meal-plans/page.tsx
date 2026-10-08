import type { Metadata } from "next"
import { RequireRole } from "@/components/auth/require-role"
import { MealPlanReportView } from "@/components/reports/meal-plan-report-view"
import { REPORTS_ROLES } from "@/lib/roles"
import {
  parseMealPlanReportFilters,
  type ReportSearchParams,
} from "@/lib/reports"

export const metadata: Metadata = { title: "Meal Plan Report" }

interface MealPlanReportPageProps {
  searchParams: Promise<ReportSearchParams>
}

export default async function MealPlanReportPage({
  searchParams,
}: MealPlanReportPageProps) {
  const filters = parseMealPlanReportFilters(await searchParams)

  return (
    <RequireRole roles={REPORTS_ROLES} area="reports">
      <MealPlanReportView filters={filters} />
    </RequireRole>
  )
}
