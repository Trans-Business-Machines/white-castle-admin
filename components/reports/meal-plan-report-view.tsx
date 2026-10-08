"use client"

import { cn } from "cn"
import {
  ReportError,
  StatCardSkeleton,
} from "@/components/dashboard/report-state"
import { MealPlanReportDialog } from "@/components/reports/meal-plan-report-dialog"
import {
  ChangeFiltersButton,
  ReportHeader,
} from "@/components/reports/report-header"
import { ReportCsvDownload } from "@/components/reports/report-csv"
import { ShareBreakdown } from "@/components/reports/share-breakdown"
import { StatCard } from "@/components/stat-card"
import { Skeleton } from "@/components/ui/skeleton"
import { useMealPlanReport } from "@/hooks/use-meal-plan-report"
import { getApiErrorMessage } from "@/lib/api/errors"
import {
  exportMealPlanReport,
  type MealPlanReportFilters,
} from "@/lib/api/reports"
import { getMealPlanLabel } from "@/lib/bookings"
import { formatCurrency, humanizeSlug } from "@/lib/format"
import {
  formatBookingCount,
  formatCount,
  getCurrencyLabel,
  getMealPlanReportStatCards,
  getMealPlanSegments,
} from "@/lib/reports"
import type { MealPlanReport } from "@/lib/types"

const STAT_CARD_COUNT = 6

const statGridClassName =
  "grid grid-cols-[repeat(auto-fit,minmax(min(13rem,100%),1fr))] gap-4"

/**
 * `/reports/meal-plans`: the filters come from the URL (set by
 * `MealPlanReportDialog`), so the report survives a reload and can be
 * shared as a link.
 */
export function MealPlanReportView({
  filters,
}: {
  filters: MealPlanReportFilters
}) {
  const report = useMealPlanReport(filters)

  const chips = [
    filters.meal_plan && `Meal plan: ${getMealPlanLabel(filters.meal_plan)}`,
    filters.status && `Status: ${humanizeSlug(filters.status)}`,
    filters.currency && `Residency: ${getCurrencyLabel(filters.currency)}`,
  ].filter((chip) => chip !== "")

  return (
    <section className="grid gap-6">
      <ReportHeader
        title="Meal plan report"
        from={filters.from_date}
        to={filters.to_date}
        chips={chips}
        action={
          <>
            <ReportCsvDownload
              filters={filters}
              noun="meal plan report"
              exportFile={exportMealPlanReport}
            />
            <MealPlanReportDialog initialFilters={filters}>
              <ChangeFiltersButton />
            </MealPlanReportDialog>
          </>
        }
      />

      {report.isPending ? (
        <MealPlanSummarySkeleton />
      ) : report.isError ? (
        <ReportError
          message={getApiErrorMessage(
            report.error,
            "We couldn't generate the meal plan report."
          )}
          onRetry={() => report.refetch()}
        />
      ) : (
        <div
          className={cn(
            "grid gap-6 transition-opacity",
            report.isPlaceholderData && "opacity-60"
          )}
        >
          <MealPlanSummary
            summary={report.data.summary}
            currency={filters.currency}
          />
        </div>
      )}
    </section>
  )
}

function MealPlanSummary({
  summary,
  currency,
}: {
  summary: MealPlanReport["summary"]
  currency: string
}) {
  return (
    <>
      <div className={statGridClassName}>
        {getMealPlanReportStatCards(summary, currency).map((card) => (
          <StatCard
            key={card.key}
            title={card.title}
            titleClassName={card.titleClassName}
            text={card.text}
            label={card.label}
          />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ShareBreakdown
          title="Bookings by meal plan"
          total={summary.total_bookings}
          totalLabel={formatBookingCount(summary.total_bookings)}
          segments={getMealPlanSegments(summary.by_plan)}
          format={formatCount}
          emptyMessage="No bookings match this report."
        />
        <ShareBreakdown
          title="Meal revenue by plan"
          total={summary.total_meal_plan_revenue}
          totalLabel={formatCurrency(summary.total_meal_plan_revenue)}
          // Bed Only has no meal revenue, so it would only add a 0% row.
          segments={getMealPlanSegments(summary.revenue_by_plan, ["room_only"])}
          format={formatCurrency}
          emptyMessage="No meal plan revenue in this report."
        />
      </div>
    </>
  )
}

function MealPlanSummarySkeleton() {
  return (
    <>
      <div className={statGridClassName}>
        {Array.from({ length: STAT_CARD_COUNT }, (_, index) => (
          <StatCardSkeleton key={index} />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }, (_, index) => (
          <div
            key={index}
            className="grid gap-4 rounded-xl bg-card p-5 shadow-sm ring-1 ring-foreground/10"
          >
            <Skeleton className="h-3 w-28 rounded" />
            <Skeleton className="h-3 w-full rounded-full" />
            <Skeleton className="h-4 w-3/4 rounded" />
            <Skeleton className="h-4 w-2/3 rounded" />
          </div>
        ))}
      </div>
    </>
  )
}
