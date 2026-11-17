import type { Metadata } from "next"
import { RequirePermission } from "@/components/auth/require-permission"
import { MealPlanReportView } from "@/components/reports/meal-plan-report-view"
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
    <RequirePermission permission="reports:meal_plans" area="reports">
      <MealPlanReportView filters={filters} />
    </RequirePermission>
  )
}
