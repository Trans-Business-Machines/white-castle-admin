"use client"

import { useMemo } from "react"
import {
  ReportError,
  StatCardSkeleton,
} from "@/components/dashboard/report-state"
import { StatCard } from "@/components/stat-card"
import { useBookingRequests } from "@/hooks/use-booking-requests"
import { getApiErrorMessage } from "@/lib/api/errors"
import {
  BOOKING_REQUEST_STAT_CARDS,
  getBookingRequestStats,
} from "@/lib/bookings"

// Same grid as the bookings page's cards so the two pages line up.
const gridClassName =
  "grid grid-cols-[repeat(auto-fit,minmax(min(15rem,100%),1fr))] gap-4"

/**
 * Totals for the pending requests. They are derived from the list
 * `useBookingRequests` already fetches for the table and the nav badge, so
 * approving or rejecting a request updates the cards with no extra request.
 */
export function BookingRequestStatsCards() {
  const { requests, isPending, isError, error, refetch } = useBookingRequests()
  const stats = useMemo(() => getBookingRequestStats(requests), [requests])

  if (isPending) {
    return (
      <div className={gridClassName}>
        {BOOKING_REQUEST_STAT_CARDS.map((card) => (
          <StatCardSkeleton key={card.key} />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <ReportError
        message={getApiErrorMessage(
          error,
          "Could not load booking request statistics."
        )}
        onRetry={() => refetch()}
      />
    )
  }

  return (
    <div className={gridClassName}>
      {BOOKING_REQUEST_STAT_CARDS.map((card) => (
        <StatCard
          key={card.key}
          title={card.title}
          titleClassName={card.titleClassName}
          text={card.value(stats)}
          label={card.label}
        />
      ))}
    </div>
  )
}
