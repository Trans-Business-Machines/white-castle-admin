"use client"

import { useMemo, useState } from "react"
import { cn } from "cn"
import { TablePagination } from "@/components/table-pagination"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  TableError,
  TableMessageRow,
  TableSkeletonRows,
  tableHeadClassName,
} from "@/components/users/table-state"
import { SearchInput } from "@/components/users/table-toolbar"
import { useBbList } from "@/hooks/use-bb-list"
import { usePagination } from "@/hooks/use-pagination"
import { formatPartySize, matchesBbSearch } from "@/lib/catering"
import { formatCurrency, formatDate } from "@/lib/format"
import { getMealPlanLabel } from "@/lib/bookings"
import { getRoomTypeLabel } from "@/lib/units"

const COLUMNS = 7

/**
 * Bookings taking breakfast on `date`, searchable by guest, reference or
 * room and paged client-side (the endpoint returns the whole day at once).
 */
export function BbListTable({ date }: { date: string }) {
  const [search, setSearch] = useState("")
  const list = useBbList(date)

  const rows = useMemo(
    () =>
      (list.data?.bookings ?? []).filter((booking) =>
        matchesBbSearch(booking, search)
      ),
    [list.data, search]
  )
  const pagination = usePagination(rows)
  const { setPage } = pagination

  // A new day starts back on page 1 (the date lives in the parent, so this
  // is the render-time equivalent of a change handler).
  const [pagedDate, setPagedDate] = useState(date)
  if (pagedDate !== date) {
    setPagedDate(date)
    setPage(1)
  }

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  const emptyMessage = search.trim()
    ? `No guests on this day's list match "${search.trim()}".`
    : `No guests are on the breakfast list for ${formatDate(date)}.`

  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-foreground/10">
      <div className="flex max-w-xl flex-wrap items-center gap-3 p-4">
        <SearchInput
          value={search}
          onChange={handleSearchChange}
          placeholder="Search guest, reference or room"
          label="Search the breakfast list"
        />
      </div>

      <Table
        className={cn(
          "mt-4 transition-opacity",
          list.isPlaceholderData && "opacity-60"
        )}
      >
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={tableHeadClassName}>Guest</TableHead>
            <TableHead className={tableHeadClassName}>Booking Ref</TableHead>
            <TableHead className={tableHeadClassName}>Room</TableHead>
            <TableHead className={tableHeadClassName}>Party</TableHead>
            <TableHead className={tableHeadClassName}>Stay</TableHead>
            <TableHead className={tableHeadClassName}>Meal Plan</TableHead>
            <TableHead className={tableHeadClassName}>
              Special requests
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.isPending ? (
            <TableSkeletonRows columns={COLUMNS} />
          ) : list.isError ? (
            <TableMessageRow columns={COLUMNS}>
              <TableError
                message="We couldn't load the breakfast list."
                onRetry={() => list.refetch()}
              />
            </TableMessageRow>
          ) : pagination.total === 0 ? (
            <TableMessageRow columns={COLUMNS}>{emptyMessage}</TableMessageRow>
          ) : (
            pagination.pageItems.map((booking) => (
              <TableRow key={booking.booking_id} className="h-14">
                <TableCell className="px-4">
                  <div className="grid">
                    <span className="font-semibold text-foreground">
                      {booking.guest_name}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {booking.guest_phone || "—"}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="px-4 font-mono text-sm font-semibold text-foreground">
                  {booking.reference}
                </TableCell>
                <TableCell className="px-4">
                  <div className="grid">
                    <span className="font-semibold text-foreground">
                      {booking.room_number}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {getRoomTypeLabel(booking.room_type)}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="px-4">
                  {formatPartySize(booking.adults, booking.children)}
                </TableCell>
                <TableCell className="px-4">
                  <div className="grid">
                    <span className="text-foreground">
                      {formatDate(booking.check_in_date, "d MMM")} –{" "}
                      {formatDate(booking.check_out_date, "d MMM yyyy")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {booking.nights}{" "}
                      {booking.nights === 1 ? "night" : "nights"}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="px-4">
                  <div className="grid">
                    <span className="text-foreground text-sm font-medium">
                      {getMealPlanLabel(booking.meal_plan)}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {formatCurrency(booking.bb_total)} total
                    </span>
                  </div>
                </TableCell>
                <TableCell className="max-w-64 px-4 whitespace-normal">
                  {booking.special_requests || (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {list.isSuccess ? (
        <TablePagination
          page={pagination.page}
          pageCount={pagination.pageCount}
          pageSize={pagination.pageSize}
          total={pagination.total}
          onPageChange={setPage}
          itemLabel="bookings"
        />
      ) : null}
    </div>
  )
}
