"use client"

import { useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { getBookingHref } from "@/components/bookings/booking-actions-menu"
import {
  BookingStatusBadge,
  PaymentStatusBadge,
} from "@/components/bookings/booking-status-badge"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { bookingQueryKey, fetchBookingDetails } from "@/lib/api/bookings"
import { getApiErrorMessage } from "@/lib/api/errors"
import { fetchGuestBookings, guestBookingsQueryKey } from "@/lib/api/guests"
import { formatDate, formatTimestamp } from "@/lib/format"

const COLUMNS = 6

/** How long a hover-prefetched booking stays fresh before another hover refetches it. */
const PREFETCH_STALE_MS = 30_000

function StayMoment({
  actual,
  scheduled,
}: {
  actual: string | null
  scheduled: string
}) {
  if (actual) return <>{formatTimestamp(actual)}</>
  return (
    <span className="flex flex-col text-muted-foreground">
      {formatDate(scheduled)}
      <span className="text-xs">Scheduled</span>
    </span>
  )
}

/** Every stay this guest has booked, most recent first. */
function GuestBookingsTable({
  guestId,
  guestName,
}: {
  guestId: string
  guestName: string
}) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: guestBookingsQueryKey(guestId),
    queryFn: () => fetchGuestBookings(guestId),
  })

  const rows = useMemo(
    () =>
      [...(query.data ?? [])].sort((a, b) =>
        b.check_in_date.localeCompare(a.check_in_date)
      ),
    [query.data]
  )

  /** Warms the booking's details query and route chunk on hover / focus. */
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
    <Card className="border-iron/30 shadow-md">
      <CardHeader>
        <CardTitle className="text-lg font-bold">Stays</CardTitle>
        <CardDescription>Every booking made by {guestName}</CardDescription>
      </CardHeader>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={tableHeadClassName}>Reference</TableHead>
            <TableHead className={tableHeadClassName}>Checked in</TableHead>
            <TableHead className={tableHeadClassName}>Checked out</TableHead>
            <TableHead className={tableHeadClassName}>Nights</TableHead>
            <TableHead className={tableHeadClassName}>Status</TableHead>
            <TableHead className={tableHeadClassName}>Payment</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {query.isPending ? (
            <TableSkeletonRows rows={3} columns={COLUMNS} />
          ) : query.isError ? (
            <TableMessageRow columns={COLUMNS}>
              <TableError
                message={getApiErrorMessage(
                  query.error,
                  "We couldn't load this guest's stays."
                )}
                onRetry={() => query.refetch()}
              />
            </TableMessageRow>
          ) : rows.length === 0 ? (
            <TableMessageRow columns={COLUMNS}>
              This guest hasn&apos;t booked a stay yet.
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
                <TableCell className="px-4">
                  <StayMoment
                    actual={booking.check_in_at}
                    scheduled={booking.check_in_date}
                  />
                </TableCell>
                <TableCell className="px-4">
                  <StayMoment
                    actual={booking.check_out_at}
                    scheduled={booking.check_out_date}
                  />
                </TableCell>
                <TableCell className="px-4">
                  {booking.nights} {booking.nights === 1 ? "night" : "nights"}
                </TableCell>
                <TableCell className="px-4">
                  <BookingStatusBadge status={booking.status} />
                </TableCell>
                <TableCell className="px-4">
                  <PaymentStatusBadge status={booking.payment_status} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  )
}

export { GuestBookingsTable }
