"use client"

import { useQuery } from "@tanstack/react-query"
import {
  ReportError,
  StatCardSkeleton,
} from "@/components/dashboard/report-state"
import { StatCard } from "@/components/stat-card"
import { getApiErrorMessage } from "@/lib/api/errors"
import { fetchPaymentStats, paymentStatsQueryKey } from "@/lib/api/payments"
import { PAYMENT_STAT_CARDS } from "@/lib/payments"

// Same grid as the bookings page's cards so the pages line up.
const gridClassName =
  "grid grid-cols-[repeat(auto-fit,minmax(min(15rem,100%),1fr))] gap-4"

/** All-time payment totals by status, from `GET /payments/stats`. */
export function PaymentStatsCards() {
  const stats = useQuery({
    queryKey: paymentStatsQueryKey,
    queryFn: fetchPaymentStats,
  })

  if (stats.isPending) {
    return (
      <div className={gridClassName}>
        {PAYMENT_STAT_CARDS.map((card) => (
          <StatCardSkeleton key={card.key} />
        ))}
      </div>
    )
  }

  if (stats.isError) {
    return (
      <ReportError
        message={getApiErrorMessage(
          stats.error,
          "Could not load payment statistics."
        )}
        onRetry={() => stats.refetch()}
      />
    )
  }

  return (
    <div className={gridClassName}>
      {PAYMENT_STAT_CARDS.map((card) => (
        <StatCard
          key={card.key}
          title={card.title}
          titleClassName={card.titleClassName}
          text={card.value(stats.data)}
          label={card.label(stats.data)}
        />
      ))}
    </div>
  )
}
