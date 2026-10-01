import { axiosInstance } from "@/lib/axios"
import { prepareUploads } from "@/lib/image-compression"
import {
  ROOM_PHOTO_MAX_BYTES,
  type UnitPayload,
  type UnitStatusPayload,
} from "@/lib/schemas/units"
import type { Unit, UnitsOccupancyStats } from "@/lib/types"
import { normalizeUnit } from "@/lib/units"

export const unitsQueryKey = ["units"] as const
export const unitStatsQueryKey = ["units", "stats"] as const
export const unitQueryKey = (roomId: string) => ["units", roomId] as const
export const roomTypesQueryKey = ["units", "room-types"] as const

/** Default rate card returned by `GET /bookings/room-types`. */
export interface RoomTypeDefault {
  type: string
  display_name: string
  description: string
  max_occupancy: number
  base_rate: number
  bb_rate: number
  hb_rate: number
  fb_rate: number
  base_rate_usd: number
  bb_rate_usd: number
  hb_rate_usd: number
  fb_rate_usd: number
}

/** GET /bookings/room-types → default rate cards for each room type. */
export async function fetchRoomTypes(): Promise<RoomTypeDefault[]> {
  const response = await axiosInstance.get<RoomTypeDefault[]>("/bookings/room-types")
  return response.data
}

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

/**
 * PATCH /bookings/rooms/{id} with `{ status, changed_by, notes }` → moves
 * the room between available, housekeeping and maintenance.
 */
export async function updateUnitStatus(
  roomId: string,
  payload: UnitStatusPayload
) {
  await axiosInstance.patch(
    `/bookings/rooms/${encodeURIComponent(roomId)}/status`,
    payload
  )
}

/** DELETE /bookings/rooms/{id} → permanently removes the room. */
export async function deleteUnit(roomId: string) {
  await axiosInstance.delete(`/bookings/rooms/${encodeURIComponent(roomId)}`)
}

/**
 * POST /bookings/rooms/{id}/photos → uploads every picked photo in one
 * multipart request. The backend reads a repeated `files` field and caps a
 * room at `MAX_ROOM_PHOTOS` in total, so the caller deletes before it adds.
 * Photos over 1 MB are compressed first and must then fit
 * `ROOM_PHOTO_MAX_BYTES` (`prepareUploads`).
 */
export async function uploadUnitPhotos(roomId: string, files: File[]) {
  const body = new FormData()
  for (const file of await prepareUploads(files, ROOM_PHOTO_MAX_BYTES))
    body.append("files", file)
  await axiosInstance.post(
    `/bookings/rooms/${encodeURIComponent(roomId)}/photos`,
    body
  )
}

/**
 * DELETE /bookings/rooms/{id}/photos?photo_url=… → removes one photo. The
 * endpoint takes a single URL, so removing several means one call each.
 */
export async function deleteUnitPhoto(roomId: string, photoUrl: string) {
  await axiosInstance.delete(
    `/bookings/rooms/${encodeURIComponent(roomId)}/photos`,
    { params: { photo_url: photoUrl } }
  )
}
