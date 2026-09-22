"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"
import {
  bookingsListQueryKey,
  fetchBookings,
  type BookingListFilters,
} from "@/lib/api/bookings"

/** Bookings raised from the website sit in this status until staff decide. */
export const BOOKING_REQUEST_STATUS = "pending"

/** No date bounds — every pending request, which is what the badge counts. */
const ALL_DATES = { date_from: "", date_to: "" } as const

/**
 * `GET /bookings/list` for one set of filters. Every bookings list goes
 * through here so two surfaces asking for the same filters share one query
 * (and one request) instead of drifting apart.
 */
export function useBookingsList(
  filters: BookingListFilters,
  { enabled = true }: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: bookingsListQueryKey(filters),
    queryFn: () => fetchBookings(filters),
    // Filter changes dim the old rows instead of showing a skeleton.
    placeholderData: keepPreviousData,
    enabled,
  })
}

/**
 * The pending bookings — the requests guests raise from the website home
 * page — plus how many there are. The `/requests` table and the sidebar's
 * nav badge both read this, so the count in the rail can't disagree with
 * the rows in the table, and approving or rejecting a request (which
 * invalidates `bookingsQueryKey`) updates both at once.
 */
export function useBookingRequests() {
  const query = useBookingsList({
    ...ALL_DATES,
    status: BOOKING_REQUEST_STATUS,
  })

  return {
    requests: query.data ?? [],
    count: query.data?.length ?? 0,
    isPending: query.isPending,
    isError: query.isError,
  }
}
