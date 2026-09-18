import { axiosInstance } from "@/lib/axios"
import type { UnitPayload } from "@/lib/schemas/units"
import type { RoomPhoto, Unit } from "@/lib/types"

export const unitsQueryKey = ["units"] as const

export async function fetchUnits() {
  const response = await axiosInstance.get<Unit[]>("/bookings/bookings/rooms")
  return response.data
}

export async function createUnit(payload: UnitPayload) {
  const response = await axiosInstance.post<Unit>(
    "/bookings/bookings/rooms",
    payload
  )
  return response.data
}

export async function uploadUnitPhoto(roomId: string, file: File) {
  const body = new FormData()
  body.append("file", file)
  const response = await axiosInstance.post<RoomPhoto>(
    `/media/media/upload/room-photo/${encodeURIComponent(roomId)}`,
    body
  )
  return response.data
}
