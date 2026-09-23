"use client"

import { useQuery } from "@tanstack/react-query"
import { StatCard } from "@/components/stat-card"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getApiErrorMessage } from "@/lib/api/errors"
import { fetchGuestsStats, guestStatsQueryKey } from "@/lib/api/guests"
import { GUEST_STAT_CARDS } from "@/lib/guests"

const gridClassName =
  "grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-4"

/** Guest totals from `GET /guests/stats`, one card per figure. */
export function GuestStatsCards() {
  const stats = useQuery({
    queryKey: guestStatsQueryKey,
    queryFn: fetchGuestsStats,
  })

  if (stats.isPending) {
    return (
      <div className={gridClassName}>
        {GUEST_STAT_CARDS.map((card) => (
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
        {getApiErrorMessage(stats.error, "Could not load guest statistics.")}
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
      {GUEST_STAT_CARDS.map((card) => (
        <StatCard
          key={card.key}
          title={card.title}
          titleClassName={card.titleClassName}
          text={String(stats.data[card.key])}
          label={card.label}
        />
      ))}
    </div>
  )
}
