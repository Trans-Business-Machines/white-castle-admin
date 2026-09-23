"use client"

import { useMemo } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { Calendar } from "lucide-react"
import { DashboardStatsCards } from "@/components/dashboard/dashboard-stats-cards"
import { DateRangeDialog } from "@/components/dashboard/date-range-dialog"
import { OccupancyGauge } from "@/components/dashboard/occupancy-gauge"
import { PaymentMixChart } from "@/components/dashboard/payment-mix-chart"
import { PendingBookings } from "@/components/dashboard/pending-bookings"
import { RevenueCollectionCard } from "@/components/dashboard/revenue-collection-card"
import { Button } from "@/components/ui/button"
import type { ReportRange } from "@/lib/api/reports"
import {
  formatReportRange,
  isMonthToDate,
  parseReportRange,
  toReportSearch,
} from "@/lib/dashboard"

/**
 * The dashboard body. The report window lives in `?from&to` so a reload or
 * a shared link keeps the same view; with no params it is month to date.
 * Must render under a Suspense boundary (`useSearchParams`).
 */
export function DashboardView() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const range = useMemo(() => parseReportRange(searchParams), [searchParams])
  const monthToDate = isMonthToDate(range)

  /**
   * Writes the range to the URL with the native History API, which Next
   * syncs into `useSearchParams` without a navigation. `router.replace`
   * would refetch the page segment (its cache key includes the search
   * params) and remount this view: the Suspense fallback and every card
   * skeleton flash before the new figures land. In place, the old figures
   * just dim (`keepPreviousData`) until the new ones arrive.
   */
  function setRange(next: ReportRange) {
    window.history.replaceState(null, "", `${pathname}${toReportSearch(next)}`)
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-heading text-xs font-semibold tracking-wide text-iron uppercase">
            Showing
          </p>
          <h2 className="mt-1 flex flex-wrap items-center gap-2 font-heading text-2xl font-bold text-foreground">
            {formatReportRange(range)}
            {monthToDate ? (
              <span className="rounded-full bg-brand-azure/10 px-2.5 py-0.5 text-xs font-semibold text-brand-navy dark:bg-brand-azure/20 dark:text-sky-200">
                Month to date
              </span>
            ) : null}
          </h2>
        </div>
        <DateRangeDialog value={range} onChange={setRange}>
          <Button className="h-11 rounded-md bg-brand-azure px-5 text-white hover:bg-brand-azure/90 focus-visible:ring-brand-azure/30">
            <Calendar aria-hidden="true" />
            Change dates
          </Button>
        </DateRangeDialog>
      </div>

      <DashboardStatsCards range={range} />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(18rem,100%),1fr))] gap-4">
        <OccupancyGauge range={range} />
        <PaymentMixChart range={range} />
        <RevenueCollectionCard range={range} />
      </div>

      <PendingBookings />
    </section>
  )
}
