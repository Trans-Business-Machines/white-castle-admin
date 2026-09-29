"use client"

import { useQuery } from "@tanstack/react-query"
import {
  fetchPendingPayments,
  pendingPaymentsQueryKey,
} from "@/lib/api/payments"
import { hasRole, PAYMENTS_ROLES } from "@/lib/roles"
import { useAuth } from "@/providers/auth-provider"

/**
 * How many payments are waiting to be verified (`GET /payments/pending`),
 * for the sidebar's Payments badge. Only fetched for roles that can see the
 * payments page; everyone else gets 0.
 */
export function usePendingPaymentsCount() {
  const { user } = useAuth()
  const query = useQuery({
    queryKey: pendingPaymentsQueryKey,
    queryFn: fetchPendingPayments,
    enabled: hasRole(user?.role, PAYMENTS_ROLES),
  })
  return query.data?.length ?? 0
}
