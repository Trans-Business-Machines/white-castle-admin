"use client"

import { parseISO } from "date-fns"
import { DashboardStatsCards } from "@/components/dashboard/dashboard-stats-cards"
import { PendingBookings } from "@/components/dashboard/pending-bookings"
import { PeriodOverview } from "@/components/dashboard/period-overview"
import { Skeleton } from "@/components/ui/skeleton"
import { useDashboardReport } from "@/hooks/use-dashboard-report"
import { formatDate } from "@/lib/format"

const eyebrowClassName =
  "font-heading text-xs font-semibold tracking-wide text-iron uppercase"

/** The dashboard body: today's counts, the week/month overview, then pending bookings. */
export function DashboardView() {
  const report = useDashboardReport()

  return (
    <section className="space-y-6">
      <div>
        <p className={eyebrowClassName}>Today</p>
        {report.data ? (
          <h2 className="mt-1 font-heading text-2xl font-bold text-foreground">
            {/* The report's own date, so the heading matches the figures. */}
            {formatDate(parseISO(report.data.date), "EEEE, d MMM yyyy")}
          </h2>
        ) : (
          <Skeleton className="mt-1 h-8 w-56 rounded" />
        )}
      </div>

      <DashboardStatsCards />

      <div className="space-y-3">
        <h2 className={eyebrowClassName}>Overview</h2>
        <PeriodOverview />
      </div>

      <PendingBookings />
    </section>
  )
}
