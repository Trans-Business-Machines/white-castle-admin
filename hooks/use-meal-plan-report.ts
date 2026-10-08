import { keepPreviousData, useQuery } from "@tanstack/react-query"
import {
  fetchMealPlanReport,
  mealPlanReportQueryKey,
  type MealPlanReportFilters,
} from "@/lib/api/reports"

/**
 * `GET /motel/reports/meal-plan-report` for the given filters. The cards
 * and the breakdowns all call this and TanStack dedupes the request.
 */
export function useMealPlanReport(filters: MealPlanReportFilters) {
  return useQuery({
    queryKey: mealPlanReportQueryKey(filters),
    queryFn: () => fetchMealPlanReport(filters),
    // Changing the filters dims the old report instead of blanking it.
    placeholderData: keepPreviousData,
  })
}
