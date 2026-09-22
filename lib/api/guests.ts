import { axiosInstance } from "@/lib/axios"
import type { BlacklistPayload, GuestPayload } from "@/lib/schemas/guests"
import type { Booking, Guest, GuestsStats } from "@/lib/types"
export const guestsQueryKey = ["guests"] as const
export const guestStatsQueryKey = ["guests", "stats"] as const
export const guestQueryKey = (guestId: string) => ["guests", guestId] as const
export const guestBookingsQueryKey = (guestId: string) =>
  ["guests", guestId, "bookings"] as const

/** GET /guests/ → every guest on record. */
export async function fetchGuests() {
  const response = await axiosInstance.get<Guest[]>("/guests/list")
  return response.data
}

/** GET /guests/{id} → a single guest's record. */
export async function fetchGuestDetails(guestId: string) {
  const response = await axiosInstance.get<Guest>(
    `/guests/${encodeURIComponent(guestId)}`
  )
  return response.data
}

/** GET /guests/{id}/bookings → every booking this guest has made. */
export async function fetchGuestBookings(guestId: string) {
  const response = await axiosInstance.get<Booking[]>(
    `/guests/${encodeURIComponent(guestId)}/bookings`
  )
  return response.data
}

/** GET /guests/stats → headline guest totals. */
export async function fetchGuestsStats() {
  const response = await axiosInstance.get<GuestsStats>("/guests/stats")
  return response.data
}

/** POST /guests/ → creates a guest record and returns it. */
export async function createGuest(payload: GuestPayload) {
  const response = await axiosInstance.post<Guest>("/guests/create", payload)
  return response.data
}

/** PATCH /guests/{id} → updates a guest's details and returns them. */
export async function updateGuest(guestId: string, payload: GuestPayload) {
  const response = await axiosInstance.patch<Guest>(
    `/guests/${encodeURIComponent(guestId)}`,
    payload
  )
  return response.data
}

/** PATCH /guests/{id}/blacklist → blocks the guest from new bookings. */
export async function blacklistGuest(
  guestId: string,
  payload: BlacklistPayload
) {
  const response = await axiosInstance.patch<Guest>(
    `/guests/${encodeURIComponent(guestId)}/blacklist`,
    payload
  )
  return response.data
}

/** PATCH /guests/{id}/unblacklist → lets the guest book again. */
export async function unblacklistGuest(guestId: string) {
  const response = await axiosInstance.patch<Guest>(
    `/guests/${encodeURIComponent(guestId)}/unblacklist`
  )
  return response.data
}
