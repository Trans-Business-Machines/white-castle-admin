"use client"

import { ChartCard } from "@/components/dashboard/chart-card"
import { useDashboardReports } from "@/hooks/use-dashboard-reports"
import { getApiErrorMessage } from "@/lib/api/errors"
import type { ReportRange } from "@/lib/api/reports"
import { toShare } from "@/lib/dashboard"

// Half-ring geometry in viewBox units: centre (100, 100), radius 82, so the
// 20-unit stroke fits inside a 200 × 110 box with room for round caps.
const RADIUS = 82
const ARC = "M 18 100 A 82 82 0 0 1 182 100"
const ARC_LENGTH = Math.PI * RADIUS

/**
 * Half-ring gauge of rooms in use right now. Unlike the rest of the
 * dashboard this is a point-in-time figure, so the date range only feeds
 * the query key. Drawn by hand rather than with Recharts, whose radius is
 * bounded by the shorter side and leaves a half-donut at half size.
 */
export function OccupancyGauge({ range }: { range: ReportRange }) {
  const { occupancy } = useDashboardReports(range)
  const total = occupancy.data?.total_rooms ?? 0
  const occupied = occupancy.data?.currently_occupied ?? 0
  const free = Math.max(0, total - occupied)
  const share = toShare(occupied, total)

  return (
    <ChartCard
      title="Rooms tonight"
      description="Occupied right now, not for the selected dates."
      loading={occupancy.isPending}
      error={
        occupancy.isError
          ? getApiErrorMessage(occupancy.error, "Could not load room status.")
          : undefined
      }
      onRetry={() => occupancy.refetch()}
      stale={occupancy.isPlaceholderData}
    >
      <div className="relative mx-auto w-full max-w-64">
        <svg
          viewBox="0 0 200 110"
          role="meter"
          aria-label="Rooms occupied right now"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={occupied}
          aria-valuetext={`${occupied} of ${total} rooms`}
          className="block w-full"
        >
          <path
            d={ARC}
            fill="none"
            strokeWidth={20}
            strokeLinecap="round"
            className="stroke-muted"
          />
          {share > 0 ? (
            <path
              d={ARC}
              fill="none"
              strokeWidth={20}
              strokeLinecap="round"
              strokeDasharray={`${(share / 100) * ARC_LENGTH} ${ARC_LENGTH}`}
              className="stroke-brand-azure transition-[stroke-dasharray]"
            />
          ) : null}
        </svg>
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center leading-none">
          <span className="font-heading text-4xl font-bold text-foreground">
            {total > 0 ? occupied : "—"}
          </span>
          <span className="mt-1.5 text-sm text-muted-foreground">
            {total > 0 ? `of ${total} rooms` : "no rooms yet"}
          </span>
        </div>
      </div>

      {total > 0 ? (
        <dl className="mt-5 flex justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="size-2.5 rounded-full bg-brand-azure"
            />
            <dt className="text-muted-foreground">Occupied</dt>
            <dd className="font-semibold text-foreground">
              {occupied}
              <span className="ml-1 font-normal text-muted-foreground">
                ({Math.round(share)}%)
              </span>
            </dd>
          </div>
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="size-2.5 rounded-full bg-muted"
            />
            <dt className="text-muted-foreground">Free</dt>
            <dd className="font-semibold text-foreground">{free}</dd>
          </div>
        </dl>
      ) : null}
    </ChartCard>
  )
}
