"use client"

import { useBookingRequests } from "@/hooks/use-booking-requests"

/** "1 request is" / "4 requests are" waiting. */
function formatWaiting(count: number) {
  return count === 1
    ? "1 request is waiting for approval."
    : `${count} requests are waiting for approval.`
}

/**
 * Explains where these bookings come from, with a live count from the same
 * query that feeds the table below and the sidebar's nav badge.
 */
function BookingRequestsHeader() {
  const { count, isPending, isError } = useBookingRequests()

  return (
    <header className="mb-6 max-w-2xl">
      <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">
        Booking requests
      </h2>
      <p className="mt-1 text-base text-muted-foreground">
        The table below lists the bookings requested by clients from the website
        home page. They stay here while they are pending — approve a request to
        turn it into a booking, or reject it with a reason.
      </p>
      {isPending || isError ? null : (
        <p
          aria-live="polite"
          className="mt-2 text-base font-semibold text-foreground"
        >
          {count === 0
            ? "Nothing is waiting for approval."
            : formatWaiting(count)}
        </p>
      )}
    </header>
  )
}

export { BookingRequestsHeader }
