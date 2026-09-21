import { axiosInstance } from "@/lib/axios"
import type { UnitPayload } from "@/lib/schemas/units"
import type { RoomPhoto, Unit, UnitsOccupancyStats } from "@/lib/types"
import { normalizeUnit } from "@/lib/units"

export const unitsQueryKey = ["units"] as const
export const unitStatsQueryKey = ["units", "stats"] as const
export const unitQueryKey = (roomId: string) => ["units", roomId] as const

/** GET /bookings/rooms → every room on the property. */
export async function fetchUnits() {
  const response = await axiosInstance.get<Unit[]>("/bookings/rooms")
  return response.data.map(normalizeUnit)
}

/** POST /bookings/rooms → creates a room and returns it. */
export async function createUnit(payload: UnitPayload) {
  const response = await axiosInstance.post<Unit>("/bookings/rooms", payload)
  return normalizeUnit(response.data)
}

/** GET /bookings/rooms/stats → room counts by occupancy status. */
export async function fetchUnitsStats() {
  const response = await axiosInstance.get<UnitsOccupancyStats>(
    "/bookings/rooms/stats"
  )
  return response.data
}

/** GET /bookings/rooms/{id} → a single room with its photos. */
export async function fetchUnitDetails(roomId: string) {
  const response = await axiosInstance.get<Unit>(
    `/bookings/rooms/${encodeURIComponent(roomId)}`
  )
  return normalizeUnit(response.data)
}

/** PATCH /bookings/rooms/{id} → updates a room's details and returns it. */
export async function updateUnit(roomId: string, payload: UnitPayload) {
  const response = await axiosInstance.patch<Unit>(
    `/bookings/rooms/${encodeURIComponent(roomId)}`,
    payload
  )
  return normalizeUnit(response.data)
}

/** DELETE /bookings/rooms/{id} → permanently removes the room. */
export async function deleteUnit(roomId: string) {
  await axiosInstance.delete(`/bookings/rooms/${encodeURIComponent(roomId)}`)
}

export async function uploadUnitPhoto(roomId: string, file: File) {
  console.log("Room ID: ", roomId)

  const body = new FormData()
  body.append("file", file)
  const response = await axiosInstance.post<RoomPhoto>(
    `/bookings/rooms/${encodeURIComponent(roomId)}/photos`,
    body
  )

  console.log("Response object: ", response)

  return response.data
}
