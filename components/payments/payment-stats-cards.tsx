"use client"

import { useQuery } from "@tanstack/react-query"
import {
  ReportError,
  StatCardSkeleton,
} from "@/components/dashboard/report-state"
import { StatCard } from "@/components/stat-card"
import { getApiErrorMessage } from "@/lib/api/errors"
import { fetchPaymentStats, paymentStatsQueryKey } from "@/lib/api/payments"
import { getCurrentMonthRange, PAYMENT_STAT_CARDS } from "@/lib/payments"
import { hasRole, PAYMENT_STATS_ROLES } from "@/lib/roles"
import { useAuth } from "@/providers/auth-provider"

// Same grid as the bookings page's cards so the pages line up.
const gridClassName =
  "grid grid-cols-[repeat(auto-fit,minmax(min(15rem,100%),1fr))] gap-4"

/**
 * The payment cards with the gap beneath them, or nothing for roles outside
 * `PAYMENT_STATS_ROLES` (receptionists), who then never fetch them.
 */
export function PaymentStatsCards() {
  const { user } = useAuth()

  if (!hasRole(user?.role, PAYMENT_STATS_ROLES)) return null

  return (
    <div className="mb-6">
      <PaymentStats />
    </div>
  )
}

/**
 * This month's payment totals by status, from `GET /payments/stats` with
 * `date_from` / `date_to` pinned to the current month.
 */
function PaymentStats() {
  // Recomputed each render, so the cards follow the calendar month.
  const range = getCurrentMonthRange()
  const stats = useQuery({
    queryKey: paymentStatsQueryKey(range),
    queryFn: () => fetchPaymentStats(range),
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
