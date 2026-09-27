"use client"

import {
  ReportError,
  StatCardSkeleton,
} from "@/components/dashboard/report-state"
import { StatCard } from "@/components/stat-card"
import { useDashboardReport } from "@/hooks/use-dashboard-report"
import { getApiErrorMessage } from "@/lib/api/errors"
import { TODAY_STAT_CARDS } from "@/lib/dashboard"

const statGridClassName =
  "grid grid-cols-[repeat(auto-fit,minmax(min(15rem,100%),1fr))] gap-4"

/** Today's arrivals, departures and bookings waiting on staff. */
export function DashboardStatsCards() {
  const report = useDashboardReport()

  if (report.isPending) {
    return (
      <div className={statGridClassName}>
        {TODAY_STAT_CARDS.map((card) => (
          <StatCardSkeleton key={card.key} />
        ))}
      </div>
    )
  }

  if (report.isError) {
    return (
      <ReportError
        message={getApiErrorMessage(
          report.error,
          "Could not load today's figures."
        )}
        onRetry={() => report.refetch()}
      />
    )
  }

  return (
    <div className={statGridClassName}>
      {TODAY_STAT_CARDS.map((card) => (
        <StatCard
          key={card.key}
          title={card.title}
          titleClassName={card.titleClassName}
          text={String(report.data.today[card.key])}
          label={card.label}
        />
      ))}
    </div>
  )
}
