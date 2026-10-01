"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { cn } from "cn"
import { TablePagination } from "@/components/table-pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  getUnitHref,
  UnitActionsMenu,
} from "@/components/units/unit-actions-menu"
import { UnitStatusBadge } from "@/components/units/unit-status-badge"
import { SearchInput } from "@/components/users/table-toolbar"
import {
  TableError,
  TableMessageRow,
  TableSkeletonRows,
  tableHeadClassName,
} from "@/components/users/table-state"
import { usePagination } from "@/hooks/use-pagination"
import {
  fetchUnitDetails,
  fetchUnits,
  unitQueryKey,
  unitsQueryKey,
} from "@/lib/api/units"
import { formatCurrency, humanizeSlug } from "@/lib/format"
import type { Unit } from "@/lib/types"
import { getRoomTypeLabel, UNIT_STATUSES } from "@/lib/units"

const COLUMNS = 7

/** Select can't hold "" as an item value, so "every status" uses a sentinel. */
const ALL_STATUSES = "all"

/** How long a hover-prefetched room stays fresh before another hover refetches it. */
const PREFETCH_STALE_MS = 30_000

/** Shows full meal plan rates. */
function RatesSummary({ unit }: { unit: Unit }) {
  return (
    <span className="font-mono text-xs text-muted-foreground">
      Bed Only {formatCurrency(unit.base_rate)}
      {unit.bb_rate != null ? ` · B&B ${formatCurrency(unit.bb_rate)}` : ""}
      {unit.hb_rate != null ? ` · Half Board ${formatCurrency(unit.hb_rate)}` : ""}
      {unit.fb_rate != null ? ` · Full Board ${formatCurrency(unit.fb_rate)}` : ""}
    </span>
  )
}

export function UnitsTable() {
  const [search, setSearch] = useState("")
  // "" means every status; filtered here since the endpoint lists all rooms.
  const [status, setStatus] = useState("")
  const router = useRouter()
  const queryClient = useQueryClient()

  const units = useQuery({ queryKey: unitsQueryKey, queryFn: fetchUnits })

  /**
   * Warms the room's details query and route chunk when the pointer (or
   * keyboard focus) lands on its row, so View / Update open instantly.
   * `query` is a no-op while the cached data is still fresh; failures are
   * swallowed because the details page surfaces them itself.
   */
  function prefetchUnit(roomId: string) {
    queryClient
      .query({
        queryKey: unitQueryKey(roomId),
        queryFn: () => fetchUnitDetails(roomId),
        staleTime: PREFETCH_STALE_MS,
      })
      .catch(() => undefined)
    router.prefetch(getUnitHref(roomId))
  }

  const visibleUnits = useMemo(() => {
    const term = search.trim().toLowerCase()
    return (units.data ?? []).filter(
      (unit) =>
        (!status || unit.status.toLowerCase() === status) &&
        (!term ||
          [unit.room_number, getRoomTypeLabel(unit.room_type)].some((value) =>
            value.toLowerCase().includes(term)
          ))
    )
  }, [units.data, search, status])

  // Paged client-side; the endpoint returns every room at once.
  const pagination = usePagination(visibleUnits)
  const { setPage } = pagination

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  function handleStatusChange(value: string) {
    setStatus(value === ALL_STATUSES ? "" : value)
    setPage(1)
  }

  const term = search.trim()
  const statusLabel = status ? humanizeSlug(status).toLowerCase() : ""
  const emptyMessage = term
    ? `No ${statusLabel ? `${statusLabel} ` : ""}units match "${term}".`
    : statusLabel
      ? `No ${statusLabel} units right now.`
      : "No units yet. Add the first one above."

  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-foreground/10">
      <div className="flex max-w-3xl flex-wrap items-center gap-3 p-4">
        <SearchInput
          value={search}
          onChange={handleSearchChange}
          placeholder="Search room number or type"
          label="Search units"
        />
        <Select
          value={status || ALL_STATUSES}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger
            aria-label="Filter by status"
            className="h-11 w-full rounded-lg border-border bg-background px-3.5 text-base focus-visible:border-brand-azure focus-visible:ring-brand-azure/20 data-[size=default]:h-11 sm:w-52 md:text-base"
          >
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_STATUSES}>All statuses</SelectItem>
            {UNIT_STATUSES.map((value) => (
              <SelectItem key={value} value={value}>
                {humanizeSlug(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
           <TableRow className="hover:bg-transparent">
             <TableHead className={tableHeadClassName}>Room</TableHead>
             <TableHead className={tableHeadClassName}>Type</TableHead>
             <TableHead className={tableHeadClassName}>Max occupancy</TableHead>
             <TableHead className={tableHeadClassName}>Rates / night</TableHead>
             <TableHead className={tableHeadClassName}>Status</TableHead>
             <TableHead className={cn(tableHeadClassName, "w-24 text-center")}>
               Actions
             </TableHead>
           </TableRow>
        </TableHeader>
        <TableBody>
          {units.isPending ? (
            <TableSkeletonRows columns={COLUMNS} />
          ) : units.isError ? (
            <TableMessageRow columns={COLUMNS}>
              <TableError
                message="We couldn't load units."
                onRetry={() => units.refetch()}
              />
            </TableMessageRow>
          ) : visibleUnits.length === 0 ? (
            <TableMessageRow columns={COLUMNS}>{emptyMessage}</TableMessageRow>
          ) : (
            pagination.pageItems.map((unit) => (
              <TableRow
                key={unit.room_id}
                className="h-14"
                onMouseEnter={() => prefetchUnit(unit.room_id)}
                onFocus={() => prefetchUnit(unit.room_id)}
              >
                <TableCell className="px-4 font-semibold text-foreground">
                  Room {unit.room_number}
                </TableCell>
                <TableCell className="px-4">
                  {getRoomTypeLabel(unit.room_type)}
                </TableCell>
                <TableCell className="px-4">
                  {unit.max_occupancy}{" "}
                  {unit.max_occupancy === 1 ? "guest" : "guests"}
                </TableCell>
                <TableCell className="px-4">
                  <RatesSummary unit={unit} />
                </TableCell>
                <TableCell className="px-4">
                  <UnitStatusBadge status={unit.status} />
                </TableCell>
                <TableCell className="px-4 text-center">
                  <UnitActionsMenu unit={unit} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {units.isSuccess ? (
        <TablePagination
          page={pagination.page}
          pageCount={pagination.pageCount}
          pageSize={pagination.pageSize}
          total={pagination.total}
          onPageChange={setPage}
          itemLabel="units"
        />
      ) : null}
    </div>
  )
}
