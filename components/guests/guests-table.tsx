"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { cn } from "cn"
import {
  getGuestHref,
  GuestActionsMenu,
} from "@/components/guests/guest-actions-menu"
import { GuestBlacklistBadge } from "@/components/guests/guest-blacklist-badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SearchInput } from "@/components/users/table-toolbar"
import {
  TableError,
  TableMessageRow,
  TableSkeletonRows,
  tableHeadClassName,
} from "@/components/users/table-state"
import {
  fetchGuestDetails,
  fetchGuests,
  guestQueryKey,
  guestsQueryKey,
} from "@/lib/api/guests"
import { getInitials } from "@/lib/format"
import { getIdTypeLabel } from "@/lib/schemas/guests"

const COLUMNS = 6

/** How long a hover-prefetched guest stays fresh before another hover refetches. */
const PREFETCH_STALE_MS = 30_000

export function GuestsTable() {
  const [search, setSearch] = useState("")
  const router = useRouter()
  const queryClient = useQueryClient()

  const guests = useQuery({ queryKey: guestsQueryKey, queryFn: fetchGuests })

  const visibleGuests = useMemo(() => {
    const list = guests.data ?? []
    const term = search.trim().toLowerCase()
    if (!term) return list
    return list.filter((guest) =>
      [guest.full_name, guest.phone, guest.email].some((value) =>
        value?.toLowerCase().includes(term)
      )
    )
  }, [guests.data, search])

  /**
   * Warms the guest's details query and route so View / Update open
   * instantly. Failures are swallowed; the profile page surfaces them.
   */
  function prefetchGuest(guestId: string) {
    queryClient
      .query({
        queryKey: guestQueryKey(guestId),
        queryFn: () => fetchGuestDetails(guestId),
        staleTime: PREFETCH_STALE_MS,
      })
      .catch(() => undefined)
    router.prefetch(getGuestHref(guestId))
  }

  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-foreground/10">
      <div className="flex max-w-xl flex-wrap items-center gap-3 p-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search name, phone or email"
          label="Search guests"
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={tableHeadClassName}>Name</TableHead>
            <TableHead className={tableHeadClassName}>Phone</TableHead>
            <TableHead className={tableHeadClassName}>Email</TableHead>
            <TableHead className={tableHeadClassName}>Nationality</TableHead>
            <TableHead className={tableHeadClassName}>ID</TableHead>
            <TableHead className={cn(tableHeadClassName, "w-24 text-center")}>
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {guests.isPending ? (
            <TableSkeletonRows columns={COLUMNS} />
          ) : guests.isError ? (
            <TableMessageRow columns={COLUMNS}>
              <TableError
                message="We couldn't load guests."
                onRetry={() => guests.refetch()}
              />
            </TableMessageRow>
          ) : visibleGuests.length === 0 ? (
            <TableMessageRow columns={COLUMNS}>
              {search
                ? `No guests match "${search.trim()}".`
                : "No guests yet. Add the first one above."}
            </TableMessageRow>
          ) : (
            visibleGuests.map((guest) => (
              <TableRow
                key={guest.guest_id}
                className="h-14"
                onMouseEnter={() => prefetchGuest(guest.guest_id)}
                onFocus={() => prefetchGuest(guest.guest_id)}
              >
                <TableCell className="px-4">
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                        guest.blacklisted
                          ? "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300"
                          : "bg-brand-azure/15 text-brand-navy dark:bg-brand-azure/20 dark:text-sky-200"
                      )}
                    >
                      {getInitials(guest.full_name)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">
                        {guest.full_name}
                      </p>
                      {guest.blacklisted ? (
                        <GuestBlacklistBadge className="mt-0.5" />
                      ) : null}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-4 font-mono">
                  {guest.phone || "—"}
                </TableCell>
                <TableCell className="px-4">{guest.email || "—"}</TableCell>
                <TableCell className="px-4">
                  {guest.nationality || "—"}
                </TableCell>
                <TableCell className="px-4">
                  {guest.national_id ? (
                    <div className="grid">
                      <span className="font-mono text-foreground">
                        {guest.national_id}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {getIdTypeLabel(guest.id_type)}
                      </span>
                    </div>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="px-4 text-center">
                  <GuestActionsMenu guest={guest} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
