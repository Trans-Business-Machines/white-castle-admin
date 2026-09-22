"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { cn } from "cn"
import {
  BookingActionsMenu,
  getBookingHref,
} from "@/components/bookings/booking-actions-menu"
import {
  BookingStatusBadge,
  PaymentStatusBadge,
} from "@/components/bookings/booking-status-badge"
import {
  BookingsFilters,
  EMPTY_BOOKING_FILTERS,
  hasActiveFilters,
} from "@/components/bookings/bookings-filters"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useSidebar } from "@/components/ui/sidebar"
import {
  TableError,
  TableMessageRow,
  TableSkeletonRows,
  tableHeadClassName,
} from "@/components/users/table-state"
import { SearchInput } from "@/components/users/table-toolbar"
import {
  BOOKING_REQUEST_STATUS,
  useBookingsList,
} from "@/hooks/use-booking-requests"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import {
  bookingLookupQueryKey,
  bookingQueryKey,
  fetchBookingDetails,
  lookupBooking,
} from "@/lib/api/bookings"
import { getApiErrorStatus } from "@/lib/api/errors"
import { fetchUnits, unitsQueryKey } from "@/lib/api/units"
import { formatCurrency, formatDate } from "@/lib/format"

const COLUMNS = 9

/** How long a hover-prefetched booking stays fresh before another hover refetches it. */
const PREFETCH_STALE_MS = 30_000

/**
 * Copy and behaviour that differ between the two surfaces this table
 * serves. `requests` pins the list to pending bookings — the requests
 * guests raise from the website — so its status filter is dropped and its
 * row menu offers the approve / reject decisions instead of the
 * lifecycle actions.
 */
const VARIANTS = {
  bookings: {
    lockedStatus: "",
    menu: "booking",
    noun: "booking",
    plural: "bookings",
    empty: "No bookings yet. Create the first one above.",
  },
  requests: {
    lockedStatus: BOOKING_REQUEST_STATUS,
    menu: "request",
    noun: "booking request",
    plural: "booking requests",
    empty: "No pending booking requests right now.",
  },
} as const

export type BookingsTableVariant = keyof typeof VARIANTS

function normalizeReference(value: string) {
  return value.trim().toUpperCase()
}

/**
 * Bookings list with server-side status / date filters and a reference
 * lookup. A typed reference calls `/bookings/lookup/{reference}` and shows
 * that one booking (filters are greyed out meanwhile); otherwise the
 * filtered list is shown. Filtering keeps the previous rows on screen
 * (dimmed) until the new page arrives so the table doesn't collapse to a
 * skeleton on every change.
 */
export function BookingsTable({
  variant = "bookings",
}: {
  variant?: BookingsTableVariant
}) {
  const config = VARIANTS[variant]
  const [filters, setFilters] = useState(EMPTY_BOOKING_FILTERS)
  const [search, setSearch] = useState("")
  const router = useRouter()
  const queryClient = useQueryClient()
  // With the sidebar expanded the content column is too narrow for the
  // search box and three filters on one line, so stack them; collapsed,
  // they sit side by side.
  const sidebarExpanded = useSidebar().state === "expanded"
  const reference = normalizeReference(useDebouncedValue(search))
  const searching = reference !== ""

  // The requests view pins `status`, so the filter state only ever holds
  // its dates and `hasActiveFilters` stays truthful.
  const listFilters = config.lockedStatus
    ? { ...filters, status: config.lockedStatus }
    : filters

  // With no dates set, the requests variant resolves to exactly the query
  // `useBookingRequests` runs for the sidebar badge, so both share one fetch.
  const list = useBookingsList(listFilters, { enabled: !searching })

  const lookup = useQuery({
    queryKey: bookingLookupQueryKey(reference),
    queryFn: () => lookupBooking(reference),
    enabled: searching,
    // A miss is a normal outcome, not something to retry.
    retry: (count, error) => getApiErrorStatus(error) !== 404 && count < 2,
  })

  // Bookings only carry `room_id`; the units list (already warmed by the
  // create dialog) maps it to a room number.
  const units = useQuery({ queryKey: unitsQueryKey, queryFn: fetchUnits })
  const roomNumbers = useMemo(
    () => new Map(units.data?.map((unit) => [unit.room_id, unit.room_number])),
    [units.data]
  )

  /**
   * Warms the booking's details query and route chunk when the pointer (or
   * keyboard focus) lands on its row, so View opens instantly. Failures are
   * swallowed; the details page surfaces them itself.
   */
  function prefetchBooking(bookingId: string) {
    queryClient
      .query({
        queryKey: bookingQueryKey(bookingId),
        queryFn: () => fetchBookingDetails(bookingId),
        staleTime: PREFETCH_STALE_MS,
      })
      .catch(() => undefined)
    router.prefetch(getBookingHref(bookingId))
  }

  const active = searching ? lookup : list
  const rows = useMemo(() => {
    if (!searching) return list.data ?? []
    // Lookup ignores status, so a reference outside this view's status
    // (e.g. an already-approved booking on /requests) counts as a miss.
    if (!lookup.data) return []
    if (config.lockedStatus && lookup.data.status !== config.lockedStatus) {
      return []
    }
    return [lookup.data]
  }, [searching, lookup.data, list.data, config.lockedStatus])

  // Either the reference doesn't exist (404) or it resolved to a booking
  // this view doesn't list; both read as "no such reference here".
  const lookupMissed =
    searching &&
    !lookup.isPending &&
    rows.length === 0 &&
    (!lookup.isError || getApiErrorStatus(lookup.error) === 404)

  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-foreground/10">
      <div
        className={cn(
          "flex gap-3 p-4",
          sidebarExpanded ? "flex-col" : "flex-wrap items-end"
        )}
      >
        <div
          className={cn(
            "flex",
            sidebarExpanded ? "max-w-xl" : "min-w-64 flex-1"
          )}
        >
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by reference, e.g. WCM-2026-30A19E61"
            label={`Search ${config.plural} by reference`}
          />
        </div>
        <BookingsFilters
          value={filters}
          onChange={setFilters}
          disabled={searching}
          showStatus={config.lockedStatus === ""}
        />
      </div>

      <Table
        className={cn(
          "mt-4 transition-opacity",
          list.isPlaceholderData && !searching && "opacity-60"
        )}
      >
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={tableHeadClassName}>Ref</TableHead>
            <TableHead className={tableHeadClassName}>Guest</TableHead>
            <TableHead className={tableHeadClassName}>Room</TableHead>
            <TableHead className={tableHeadClassName}>Check in</TableHead>
            <TableHead className={tableHeadClassName}>Check out</TableHead>
            <TableHead className={tableHeadClassName}>Status</TableHead>
            <TableHead className={tableHeadClassName}>Total cost</TableHead>
            <TableHead className={tableHeadClassName}>Payment</TableHead>
            <TableHead className={cn(tableHeadClassName, "w-24 text-center")}>
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {active.isPending ? (
            <TableSkeletonRows columns={COLUMNS} />
          ) : lookupMissed ? (
            <TableMessageRow columns={COLUMNS}>
              No {config.noun} with reference &ldquo;{reference}&rdquo;.
            </TableMessageRow>
          ) : active.isError ? (
            <TableMessageRow columns={COLUMNS}>
              <TableError
                message={
                  searching
                    ? "We couldn't look up that booking."
                    : `We couldn't load ${config.plural}.`
                }
                onRetry={() => active.refetch()}
              />
            </TableMessageRow>
          ) : rows.length === 0 ? (
            <TableMessageRow columns={COLUMNS}>
              {hasActiveFilters(filters)
                ? `No ${config.plural} match the current filters.`
                : config.empty}
            </TableMessageRow>
          ) : (
            rows.map((booking) => (
              <TableRow
                key={booking.booking_id}
                className="h-14"
                onMouseEnter={() => prefetchBooking(booking.booking_id)}
                onFocus={() => prefetchBooking(booking.booking_id)}
              >
                <TableCell className="px-4 font-mono text-sm font-semibold text-foreground">
                  {booking.reference}
                </TableCell>
                <TableCell className="px-4">
                  <div className="flex flex-col">
                    <span className="font-semibold text-foreground">
                      {booking.guest_name}
                    </span>
                    {booking.guest_email || booking.guest_phone ? (
                      <span className="text-xs text-muted-foreground">
                        {booking.guest_email || booking.guest_phone}
                      </span>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="px-4">
                  {roomNumbers.has(booking.room_id)
                    ? `Room ${roomNumbers.get(booking.room_id)}`
                    : "—"}
                </TableCell>
                <TableCell className="px-4">
                  {formatDate(booking.check_in_date)}
                </TableCell>
                <TableCell className="px-4">
                  {formatDate(booking.check_out_date)}
                </TableCell>
                <TableCell className="px-4">
                  <BookingStatusBadge status={booking.status} />
                </TableCell>
                <TableCell className="px-4 font-mono">
                  {formatCurrency(booking.total_amount)}
                </TableCell>
                <TableCell className="px-4">
                  <PaymentStatusBadge status={booking.payment_status} />
                </TableCell>
                <TableCell className="px-4 text-center">
                  <BookingActionsMenu booking={booking} variant={config.menu} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
