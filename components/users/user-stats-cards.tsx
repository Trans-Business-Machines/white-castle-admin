"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { StatCard } from "@/components/stat-card"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchRoles, rolesQueryKey } from "@/lib/api/roles"
import { fetchUserStats, userStatsQueryKey } from "@/lib/api/users"
import { getApiErrorMessage } from "@/lib/api/errors"
import { humanizeSlug } from "@/lib/format"

const SKELETON_CARDS = 4

const gridClassName =
  "grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4"

export function UserStatsCards() {
  const stats = useQuery({
    queryKey: userStatsQueryKey,
    queryFn: fetchUserStats,
  })
  const roles = useQuery({ queryKey: rolesQueryKey, queryFn: fetchRoles })

  const roleLabels = useMemo(() => {
    const map = new Map<string, string>()
    roles.data?.forEach((role) => map.set(role.name, role.label))
    return map
  }, [roles.data])

  const cards = useMemo(
    () =>
      Object.entries(stats.data?.by_role ?? {}).map(([slug, count]) => ({
        slug,
        label: roleLabels.get(slug) ?? humanizeSlug(slug),
        count,
      })),
    [stats.data, roleLabels]
  )

  if (stats.isPending) {
    return (
      <div className={gridClassName}>
        {Array.from({ length: SKELETON_CARDS }, (_, index) => (
          <Card key={index} className="border-iron shadow-md">
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
        {getApiErrorMessage(stats.error, "Could not load user statistics.")}
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

  if (cards.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No user accounts yet.</p>
    )
  }

  return (
    <div className={gridClassName}>
      {cards.map((card) => (
        <StatCard
          key={card.slug}
          title={card.label}
          role={card.slug}
          text={String(card.count)}
          label={card.count === 1 ? "account" : "accounts"}
        />
      ))}
    </div>
  )
}
