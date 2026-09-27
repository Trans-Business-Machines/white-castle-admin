"use client"

import { parseISO } from "date-fns"
import { ReportError } from "@/components/dashboard/report-state"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useDashboardReport } from "@/hooks/use-dashboard-report"
import { getApiErrorMessage } from "@/lib/api/errors"
import { OVERVIEW_PERIODS } from "@/lib/dashboard"
import { formatCurrency, formatDate } from "@/lib/format"
import type { DashboardPeriod } from "@/lib/types"

const gridClassName =
  "grid grid-cols-[repeat(auto-fit,minmax(min(18rem,100%),1fr))] gap-4"

/** Bookings and revenue for the current week and month. */
export function PeriodOverview() {
  const report = useDashboardReport()

  if (report.isError) {
    return (
      <ReportError
        message={getApiErrorMessage(
          report.error,
          "Could not load the week and month overview."
        )}
        onRetry={() => report.refetch()}
      />
    )
  }

  return (
    <div className={gridClassName}>
      {OVERVIEW_PERIODS.map(({ key, title }) =>
        report.isPending ? (
          <PeriodCardSkeleton key={key} />
        ) : (
          <PeriodCard key={key} title={title} period={report.data[key]} />
        )
      )}
    </div>
  )
}

function PeriodCard({
  title,
  period,
}: {
  title: string
  period: DashboardPeriod
}) {
  return (
    <Card className="h-full border-iron shadow-md">
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          {/* `font-poppins!` beats CardTitle's own `font-heading`, as in StatCard. */}
          <CardTitle className="font-poppins! font-bold text-neutral uppercase">
            {title}
          </CardTitle>
          <p className="font-poppins text-sm text-ring">
            Since {formatDate(parseISO(period.from), "EEE d MMM")}
          </p>
        </div>
        <dl className="flex flex-wrap gap-x-10 gap-y-3">
          <div>
            <dt className="font-poppins text-sm text-ring">Revenue</dt>
            <dd className="font-poppins text-3xl font-bold text-navy-azul">
              {formatCurrency(period.revenue)}
            </dd>
          </div>
          <div>
            <dt className="font-poppins text-sm text-ring">Bookings</dt>
            <dd className="font-poppins text-3xl font-bold text-navy-azul">
              {period.bookings}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  )
}

function PeriodCardSkeleton() {
  return (
    <Card className="border-iron shadow-md">
      <CardContent className="space-y-4">
        <Skeleton className="h-4 w-28 rounded" />
        <div className="flex gap-10">
          <Skeleton className="h-12 w-36 rounded" />
          <Skeleton className="h-12 w-16 rounded" />
        </div>
      </CardContent>
    </Card>
  )
}
