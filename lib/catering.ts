import { format } from "date-fns"
import type { BbList, BbListBooking } from "@/lib/types"

/** The `date` query param `GET /bookings/bb-list` expects: "yyyy-MM-dd". */
export function toBbListDate(date: Date) {
  return format(date, "yyyy-MM-dd")
}

/** Case-insensitive match on the guest's name, the reference or the room number. */
export function matchesBbSearch(booking: BbListBooking, term: string) {
  const needle = term.trim().toLowerCase()
  if (!needle) return true
  return [booking.guest_name, booking.reference, booking.room_number].some(
    (value) => value?.toLowerCase().includes(needle)
  )
}

/** "2 adults, 1 child" (children left out when there are none). */
export function formatPartySize(adults: number, children: number) {
  const parts = [`${adults} ${adults === 1 ? "adult" : "adults"}`]
  if (children > 0) {
    parts.push(`${children} ${children === 1 ? "child" : "children"}`)
  }
  return parts.join(", ")
}

/** The bed and breakfast list's headline figures, one card each. */
export const BB_STAT_CARDS: ReadonlyArray<{
  key: string
  title: string
  titleClassName: string
  value: (list: BbList) => number
  label: string
}> = [
  {
    key: "total_guests",
    title: "Breakfasts",
    titleClassName: "text-brand-azure dark:text-sky-300",
    value: (list) => list.total_guests,
    label: "Guests to serve",
  },
  {
    key: "total_adults",
    title: "Adults",
    titleClassName: "text-emerald-700 dark:text-emerald-300",
    value: (list) => list.total_adults,
    label: "On the list",
  },
  {
    key: "total_children",
    title: "Children",
    titleClassName: "text-amber-700 dark:text-amber-300",
    value: (list) => list.total_children,
    label: "On the list",
  },
  {
    key: "rooms",
    title: "Rooms",
    titleClassName: "text-violet-700 dark:text-violet-300",
    value: (list) => list.bookings.length,
    label: "Bookings taking breakfast",
  },
]
