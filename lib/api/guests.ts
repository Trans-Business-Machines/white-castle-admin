import { axiosInstance } from "@/lib/axios"
import type { BlacklistPayload, GuestPayload } from "@/lib/schemas/guests"
import type { Booking, Guest, GuestsStats, SignedFile } from "@/lib/types"
export const guestsQueryKey = ["guests"] as const
export const guestStatsQueryKey = ["guests", "stats"] as const
export const guestQueryKey = (guestId: string) => ["guests", guestId] as const
// Not `["guests", guestId, …]`: a document is looked up by its file id.
export const guestDocumentQueryKey = (fileId: string) =>
  ["guests", "documents", fileId] as const
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

/**
 * POST /guests/{id}/id-document → attaches the guest's ID scan (PNG, JPG or
 * PDF) as multipart `file`. The guest has to exist first, so the dialogs
 * save the details before they upload.
 */
export async function uploadGuestIdDocument(guestId: string, file: File) {
  const body = new FormData()
  body.append("file", file)
  await axiosInstance.post(
    `/guests/${encodeURIComponent(guestId)}/id-document`,
    body
  )
}

/**
 * GET /guests/documents/{file_id} → a signed, short-lived URL for one of the
 * guest's ID scans (image or PDF), plus its file name. `file_id` is the last
 * path segment of an `id_documents` URL.
 */
export async function fetchGuestDocument(fileId: string) {
  const response = await axiosInstance.get<SignedFile>(
    `/guests/documents/${encodeURIComponent(fileId)}`
  )
  return response.data
}

/** DELETE /guests/{id} → permanently removes the guest record. */
export async function deleteGuest(guestId: string) {
  await axiosInstance.delete(`/guests/${encodeURIComponent(guestId)}`)
}

/** Marks a failure that happened after the guest itself was saved. */
export class IdDocumentUploadError extends Error {
  constructor(public readonly cause: unknown) {
    super("ID document upload failed")
  }
}

/**
 * Uploads the picked ID document, if any, for a guest that's already
 * saved. A failure is rethrown as `IdDocumentUploadError` so the dialog can
 * tell it apart from a failed save.
 */
export async function uploadPickedIdDocument(guestId: string, files: File[]) {
  if (files.length === 0) return
  try {
    await uploadGuestIdDocument(guestId, files[0])
  } catch (error) {
    throw new IdDocumentUploadError(error)
  }
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
