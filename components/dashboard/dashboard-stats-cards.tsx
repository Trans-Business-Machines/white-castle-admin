"use client"

import { cn } from "cn"
import {
  ReportError,
  StatCardSkeleton,
} from "@/components/dashboard/report-state"
import { StatCard } from "@/components/stat-card"
import { useDashboardReports } from "@/hooks/use-dashboard-reports"
import { getApiErrorMessage } from "@/lib/api/errors"
import type { ReportRange } from "@/lib/api/reports"
import { DASHBOARD_STAT_CARDS } from "@/lib/dashboard"

// 15rem columns: wide enough for a "KES 1,250,000" value, so with the
// sidebar expanded the fourth card wraps to a new row instead of squeezing.
const gridClassName =
  "grid grid-cols-[repeat(auto-fit,minmax(15rem,1fr))] gap-4"

/** Headline figures for the range, drawn from both reports. */
export function DashboardStatsCards({ range }: { range: ReportRange }) {
  const { occupancy, revenue } = useDashboardReports(range)

  if (occupancy.isPending || revenue.isPending) {
    return (
      <div className={gridClassName}>
        {DASHBOARD_STAT_CARDS.map((card) => (
          <StatCardSkeleton key={card.key} />
        ))}
      </div>
    )
  }

  if (occupancy.isError || revenue.isError) {
    return (
      <ReportError
        message={getApiErrorMessage(
          occupancy.error ?? revenue.error,
          "Could not load the dashboard figures."
        )}
        onRetry={() => {
          if (occupancy.isError) occupancy.refetch()
          if (revenue.isError) revenue.refetch()
        }}
      />
    )
  }

  const reports = { occupancy: occupancy.data, revenue: revenue.data }
  const stale = occupancy.isPlaceholderData || revenue.isPlaceholderData

  return (
    <div
      className={cn(gridClassName, stale && "opacity-60 transition-opacity")}
    >
      {DASHBOARD_STAT_CARDS.map((card) => (
        <StatCard
          key={card.key}
          title={card.title}
          titleClassName={card.titleClassName}
          text={card.text(reports)}
          label={card.label(reports)}
        />
      ))}
    </div>
  )
}
