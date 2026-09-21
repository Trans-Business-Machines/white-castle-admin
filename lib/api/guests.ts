import { axiosInstance } from "@/lib/axios"
import type { GuestPayload } from "@/lib/schemas/guests"
import type { Guest } from "@/lib/types"

export const guestsQueryKey = ["guests"] as const

/** GET /guests/guests → every guest on record. */
export async function fetchGuests() {
  const response = await axiosInstance.get<Guest[]>("/guests")
  return response.data
}

/** POST /guests/guests → creates a guest record and returns it. */
export async function createGuest(payload: GuestPayload) {
  const response = await axiosInstance.post<Guest>("/guests", payload)
  return response.data
}
