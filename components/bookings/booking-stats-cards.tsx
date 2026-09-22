"use client"

import { useQuery } from "@tanstack/react-query"
import { StatCard } from "@/components/stat-card"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  bookingStatsQueryKey,
  fetchBookingsOccupancy,
} from "@/lib/api/bookings"
import { getApiErrorMessage } from "@/lib/api/errors"
import { BOOKING_STAT_CARDS, getMonthToDateRange } from "@/lib/bookings"

// 15rem columns: wide enough for a "KES 1,250,000" value, so with the
// sidebar expanded the fifth card wraps to a new row instead of squeezing.
const gridClassName =
  "grid grid-cols-[repeat(auto-fit,minmax(15rem,1fr))] gap-4"

export function BookingStatsCards() {
  const range = getMonthToDateRange()
  const stats = useQuery({
    queryKey: bookingStatsQueryKey(range),
    queryFn: () => fetchBookingsOccupancy(range),
  })

  if (stats.isPending) {
    return (
      <div className={gridClassName}>
        {BOOKING_STAT_CARDS.map((card) => (
          <Card key={card.key} className="border-iron shadow-md">
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-9 w-12 rounded" />
              <Skeleton className="h-4 w-16 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (stats.isError) {
    return (
      <p className="inline-flex flex-wrap items-center gap-2 text-sm text-destructive">
        {getApiErrorMessage(stats.error, "Could not load booking statistics.")}
        <button
          type="button"
          onClick={() => stats.refetch()}
          className="font-semibold underline underline-offset-4"
        >
          Retry
        </button>
      </p>
    )
  }

  return (
    <div className={gridClassName}>
      {BOOKING_STAT_CARDS.map((card) => (
        <StatCard
          key={card.key}
          title={card.title}
          titleClassName={card.titleClassName}
          text={card.format(stats.data[card.key])}
          label={card.label}
        />
      ))}
    </div>
  )
}
