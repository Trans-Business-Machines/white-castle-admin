"use client"

import { useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowRight } from "lucide-react"
import { getBookingHref } from "@/components/bookings/booking-actions-menu"
import { PaymentStatusBadge } from "@/components/bookings/booking-status-badge"
import { Button } from "@/components/ui/button"
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
import {
  bookingQueryKey,
  bookingsListQueryKey,
  fetchBookingDetails,
  fetchBookings,
  type BookingListFilters,
} from "@/lib/api/bookings"
import { getApiErrorMessage } from "@/lib/api/errors"
import { formatCurrency, formatDate } from "@/lib/format"

const COLUMNS = 5

/** How many pending bookings the dashboard lists before pointing at /bookings. */
const MAX_ROWS = 5

/** How long a hover-prefetched booking stays fresh before another hover refetches it. */
const PREFETCH_STALE_MS = 30_000

/** Same filter object the bookings page builds, so the cache entry is shared. */
const PENDING_FILTERS: BookingListFilters = {
  status: "pending",
  date_from: "",
  date_to: "",
}

/**
 * Bookings waiting for approval, newest first. Deliberately ignores the
 * dashboard's date range: a pending request needs attention whenever it was
 * made.
 */
export function PendingBookings() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const pending = useQuery({
    queryKey: bookingsListQueryKey(PENDING_FILTERS),
    queryFn: () => fetchBookings(PENDING_FILTERS),
  })

  const rows = useMemo(
    () =>
      [...(pending.data ?? [])]
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, MAX_ROWS),
    [pending.data]
  )
  const count = pending.data?.length ?? 0

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

  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-foreground/10">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <h3 className="flex items-center gap-2 font-sans font-bold text-neutral uppercase">
            Needs attention
            {count > 0 ? (
              <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                {count}
              </span>
            ) : null}
          </h3>
          <p className="text-sm text-muted-foreground">
            Bookings waiting for approval, regardless of the dates above.
          </p>
        </div>
        <Button asChild variant="ghost" className="h-10 rounded-full px-4">
          <Link href="/bookings">
            All bookings
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={tableHeadClassName}>Reference</TableHead>
            <TableHead className={tableHeadClassName}>Guest</TableHead>
            <TableHead className={tableHeadClassName}>Stay</TableHead>
            <TableHead className={tableHeadClassName}>Total</TableHead>
            <TableHead className={tableHeadClassName}>Payment</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pending.isPending ? (
            <TableSkeletonRows rows={3} columns={COLUMNS} />
          ) : pending.isError ? (
            <TableMessageRow columns={COLUMNS}>
              <TableError
                message={getApiErrorMessage(
                  pending.error,
                  "Could not load pending bookings."
                )}
                onRetry={() => pending.refetch()}
              />
            </TableMessageRow>
          ) : rows.length === 0 ? (
            <TableMessageRow columns={COLUMNS}>
              Nothing waiting for approval.
            </TableMessageRow>
          ) : (
            rows.map((booking) => (
              <TableRow
                key={booking.booking_id}
                className="h-14 cursor-pointer"
                onClick={() => router.push(getBookingHref(booking.booking_id))}
                onMouseEnter={() => prefetchBooking(booking.booking_id)}
                onFocus={() => prefetchBooking(booking.booking_id)}
              >
                <TableCell className="px-4 font-mono text-sm font-semibold">
                  <Link
                    href={getBookingHref(booking.booking_id)}
                    className="text-foreground hover:underline"
                    onClick={(event) => event.stopPropagation()}
                  >
                    {booking.reference}
                  </Link>
                </TableCell>
                <TableCell className="px-4 font-semibold text-foreground">
                  {booking.guest_name}
                </TableCell>
                <TableCell className="px-4">
                  {formatDate(booking.check_in_date)} · {booking.nights}{" "}
                  {booking.nights === 1 ? "night" : "nights"}
                </TableCell>
                <TableCell className="px-4 font-mono">
                  {formatCurrency(booking.total_amount)}
                </TableCell>
                <TableCell className="px-4">
                  <PaymentStatusBadge status={booking.payment_status} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {count > MAX_ROWS ? (
        <p className="border-t px-4 py-3 text-sm text-muted-foreground">
          Showing the {MAX_ROWS} most recent of {count}.
        </p>
      ) : null}
    </div>
  )
}
