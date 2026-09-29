"use client"

import { cn } from "cn"
import {
  ReportError,
  StatCardSkeleton,
} from "@/components/dashboard/report-state"
import { StatCard } from "@/components/stat-card"
import { useBbList } from "@/hooks/use-bb-list"
import { getApiErrorMessage } from "@/lib/api/errors"
import { BB_STAT_CARDS } from "@/lib/catering"

// Same grid as the payments and bookings cards so the pages line up.
const gridClassName =
  "grid grid-cols-[repeat(auto-fit,minmax(min(15rem,100%),1fr))] gap-4"

/** Guest, adult, child and room counts for the chosen day's list. */
export function BbStatsCards({ date }: { date: string }) {
  const list = useBbList(date)

  if (list.isPending) {
    return (
      <div className={gridClassName}>
        {BB_STAT_CARDS.map((card) => (
          <StatCardSkeleton key={card.key} />
        ))}
      </div>
    )
  }

  if (list.isError) {
    return (
      <ReportError
        message={getApiErrorMessage(
          list.error,
          "Could not load the bed and breakfast totals."
        )}
        onRetry={() => list.refetch()}
      />
    )
  }

  return (
    <div
      className={cn(
        gridClassName,
        "transition-opacity",
        list.isPlaceholderData && "opacity-60"
      )}
    >
      {BB_STAT_CARDS.map((card) => (
        <StatCard
          key={card.key}
          title={card.title}
          titleClassName={card.titleClassName}
          text={String(card.value(list.data))}
          label={card.label}
        />
      ))}
    </div>
  )
}
