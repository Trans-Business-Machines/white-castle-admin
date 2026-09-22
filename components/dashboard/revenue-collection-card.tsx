"use client"

import { ChartCard } from "@/components/dashboard/chart-card"
import { useDashboardReports } from "@/hooks/use-dashboard-reports"
import { getApiErrorMessage } from "@/lib/api/errors"
import type { ReportRange } from "@/lib/api/reports"
import { getCollectionProgress } from "@/lib/dashboard"
import { formatCurrency } from "@/lib/format"

/**
 * Meter of revenue received against what the period's bookings should
 * bring in, with the deposit total marked as the first milestone. Money
 * isn't a part-to-whole, so this is a bar toward a target rather than a pie.
 */
export function RevenueCollectionCard({ range }: { range: ReportRange }) {
  const { occupancy, revenue } = useDashboardReports(range)
  const loading = occupancy.isPending || revenue.isPending
  const error = occupancy.error ?? revenue.error
  const progress =
    occupancy.data && revenue.data
      ? getCollectionProgress({
          occupancy: occupancy.data,
          revenue: revenue.data,
        })
      : null

  return (
    <ChartCard
      title="Revenue collection"
      description="Received so far against what this period's bookings are worth."
      loading={loading}
      error={
        error
          ? getApiErrorMessage(error, "Could not load revenue progress.")
          : undefined
      }
      onRetry={() => {
        if (occupancy.isError) occupancy.refetch()
        if (revenue.isError) revenue.refetch()
      }}
      stale={occupancy.isPlaceholderData || revenue.isPlaceholderData}
    >
      {progress ? (
        <div className="space-y-5">
          <div>
            <p className="font-heading text-3xl font-bold text-foreground">
              {formatCurrency(progress.collected)}
            </p>
            <p className="text-sm text-muted-foreground">
              of {formatCurrency(progress.expected)} expected
              {progress.expected > 0 ? (
                <span className="ml-1 font-semibold text-foreground">
                  ({Math.round(progress.collectedPct)}%)
                </span>
              ) : null}
            </p>
          </div>

          <div className="space-y-2">
            <div
              role="meter"
              aria-label="Revenue collected"
              aria-valuemin={0}
              aria-valuemax={progress.expected}
              aria-valuenow={Math.min(progress.collected, progress.expected)}
              aria-valuetext={`${formatCurrency(progress.collected)} of ${formatCurrency(progress.expected)}`}
              className="relative h-3 w-full overflow-hidden rounded-full bg-muted"
            >
              <div
                className="h-full rounded-full bg-brand-azure transition-[width]"
                style={{ width: `${progress.collectedPct}%` }}
              />
              {progress.deposits > 0 && progress.depositsPct < 100 ? (
                <div
                  aria-hidden="true"
                  title={`Deposits due: ${formatCurrency(progress.deposits)}`}
                  className="absolute inset-y-0 w-0.5 bg-foreground/60"
                  style={{ left: `${progress.depositsPct}%` }}
                />
              ) : null}
            </div>
            {progress.deposits > 0 ? (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <span
                  aria-hidden="true"
                  className="inline-block h-3 w-0.5 bg-foreground/60"
                />
                Deposits due: {formatCurrency(progress.deposits)}
              </p>
            ) : null}
          </div>

          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Outstanding</dt>
              <dd className="font-semibold text-foreground tabular-nums">
                {formatCurrency(progress.outstanding)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Deposits expected</dt>
              <dd className="font-semibold text-foreground tabular-nums">
                {formatCurrency(progress.deposits)}
              </dd>
            </div>
          </dl>
        </div>
      ) : null}
    </ChartCard>
  )
}
