"use client"

import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { UnitStatusBadge } from "@/components/units/unit-status-badge"
import { SearchInput } from "@/components/users/table-toolbar"
import {
  TableError,
  TableMessageRow,
  TableSkeletonRows,
  tableHeadClassName,
} from "@/components/users/table-state"
import { fetchUnits, unitsQueryKey } from "@/lib/api/units"
import { formatCurrency, humanizeSlug } from "@/lib/format"
import { getRoomTypeLabel } from "@/lib/units"

const COLUMNS = 5

export function UnitsTable() {
  const [search, setSearch] = useState("")

  const units = useQuery({ queryKey: unitsQueryKey, queryFn: fetchUnits })

  const visibleUnits = useMemo(() => {
    const list = units.data ?? []
    const term = search.trim().toLowerCase()
    if (!term) return list
    return list.filter((unit) =>
      [
        unit.room_number,
        getRoomTypeLabel(unit.room_type),
        humanizeSlug(unit.status),
      ].some((value) => value.toLowerCase().includes(term))
    )
  }, [units.data, search])

  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-foreground/10">
      <div className="flex max-w-xl flex-wrap items-center gap-3 p-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search room number, type or status"
          label="Search units"
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={tableHeadClassName}>Room</TableHead>
            <TableHead className={tableHeadClassName}>Type</TableHead>
            <TableHead className={tableHeadClassName}>Max occupancy</TableHead>
            <TableHead className={tableHeadClassName}>Rate / night</TableHead>
            <TableHead className={tableHeadClassName}>Status</TableHead>
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
            <TableMessageRow columns={COLUMNS}>
              {search
                ? `No units match "${search.trim()}".`
                : "No units yet. Add the first one above."}
            </TableMessageRow>
          ) : (
            visibleUnits.map((unit) => (
              <TableRow key={unit.room_id} className="h-14">
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
                <TableCell className="px-4 font-mono">
                  {formatCurrency(unit.base_rate)}
                </TableCell>
                <TableCell className="px-4">
                  <UnitStatusBadge status={unit.status} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
