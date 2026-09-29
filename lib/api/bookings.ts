import { axiosInstance } from "@/lib/axios"
import { downloadCsv, type ExportFilters } from "@/lib/api/files"
import type {
  ApproveBookingPayload,
  BbList,
  Booking,
  BookingsOccupancyStats,
  CancelBookingPayload,
  CheckInBookingPayload,
  CreateBookingPayload,
  ExtendBookingPayload,
  ExtendBookingResponse,
  ExtraPersonsPayload,
  ExtraPersonsResponse,
  RejectBookingPayload,
} from "@/lib/types"

export const bookingsQueryKey = ["bookings"] as const
export const bookingsListQueryKey = (filters: BookingListFilters) =>
  ["bookings", "list", filters] as const

export interface BookingListFilters {
  /** Booking status slug; "" means every status. */
  status: string
  /** Inclusive bounds, "yyyy-MM-dd"; "" means unbounded. */
  date_from: string
  date_to: string
}

export const bookingLookupQueryKey = (reference: string) =>
  ["bookings", "lookup", reference] as const
export const bookingQueryKey = (bookingId: string) =>
  ["bookings", bookingId] as const

// Under the bookings prefix so any booking change (create, cancel, check
// out, delete) refreshes the kitchen's list too.
export const bbListQueryKey = (date: string) =>
  ["bookings", "bb-list", date] as const

/** GET /bookings/bb-list?date= → the bed and breakfast list for a "yyyy-MM-dd" day. */
export async function fetchBbList(date: string) {
  const response = await axiosInstance.get<BbList>("/bookings/bb-list", {
    params: { date },
  })
  return response.data
}

/** GET /bookings/{id} → a single booking. */
export async function fetchBookingDetails(bookingId: string) {
  const response = await axiosInstance.get<Booking>(
    `/bookings/${encodeURIComponent(bookingId)}`
  )
  return response.data
}

/** GET /bookings/lookup/{reference} → the booking with that reference (404 if none). */
export async function lookupBooking(reference: string) {
  const response = await axiosInstance.get<Booking>(
    `/bookings/lookup/${encodeURIComponent(reference)}`
  )
  return response.data
}

/** GET /bookings/list → bookings matching the filters (empty ones are omitted). */
export async function fetchBookings(filters: BookingListFilters) {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== "")
  )
  const response = await axiosInstance.get<Booking[]>("/bookings/list", {
    params,
  })
  return response.data
}
/**
 * GET /bookings/export/bookings → the bookings matching the filters as a CSV
 * file (every filter is optional; empty ones are omitted).
 */
export function exportBookings(filters: ExportFilters) {
  return downloadCsv("/bookings/export/bookings", filters, "bookings")
}

export const bookingStatsQueryKey = (range: OccupancyRange) =>
  ["bookings", "stats", range.from_date, range.to_date] as const

export interface OccupancyRange {
  /** Inclusive start, "yyyy-MM-dd". */
  from_date: string
  /** Inclusive end, "yyyy-MM-dd". */
  to_date: string
}

/** GET /bookings/occupancy → room, booking and revenue totals for a range. */
export async function fetchBookingsOccupancy(range: OccupancyRange) {
  const response = await axiosInstance.get<BookingsOccupancyStats>(
    "/bookings/occupancy",
    { params: range }
  )
  return response.data
}

/** POST /bookings/create → creates a booking and returns it. */
export async function createBooking(payload: CreateBookingPayload) {
  const response = await axiosInstance.post<Booking>(
    "/bookings/create",
    payload
  )
  return response.data
}

/** PATCH /bookings/{id}/approve → moves a pending request to approved. */
export async function approveBooking(
  bookingId: string,
  payload: ApproveBookingPayload
) {
  const response = await axiosInstance.patch<Booking>(
    `/bookings/${encodeURIComponent(bookingId)}/approve`,
    payload
  )
  return response.data
}

/** PATCH /bookings/{id}/reject → rejects a pending request with a reason. */
export async function rejectBooking(
  bookingId: string,
  payload: RejectBookingPayload
) {
  const response = await axiosInstance.patch<Booking>(
    `/bookings/${encodeURIComponent(bookingId)}/reject`,
    payload
  )
  return response.data
}

/** PATCH /bookings/{id}/extend → moves a checked-in stay's check-out later and
 * returns the extension's charges. */
export async function extendBooking(
  bookingId: string,
  payload: ExtendBookingPayload
) {
  const response = await axiosInstance.patch<ExtendBookingResponse>(
    `/bookings/${encodeURIComponent(bookingId)}/extend`,
    payload
  )
  return response.data
}

/**
 * PATCH /bookings/{id}/extra-persons → adds adults / children to a
 * checked-in stay and returns the added people's charges.
 */
export async function addExtraPersons(
  bookingId: string,
  payload: ExtraPersonsPayload
) {
  const response = await axiosInstance.patch<ExtraPersonsResponse>(
    `/bookings/${encodeURIComponent(bookingId)}/extra-persons`,
    payload
  )
  return response.data
}

/** PATCH /bookings/{id}/cancel → cancels the booking and frees the room. */
export async function cancelBooking(
  bookingId: string,
  payload: CancelBookingPayload
) {
  const response = await axiosInstance.patch<Booking>(
    `/bookings/${encodeURIComponent(bookingId)}/cancel`,
    payload
  )
  return response.data
}

/** PATCH /bookings/{id}/checkin → checks the named guest into their room. */
export async function checkInBooking(
  bookingId: string,
  payload: CheckInBookingPayload
) {
  const response = await axiosInstance.patch<Booking>(
    `/bookings/${encodeURIComponent(bookingId)}/checkin`,
    payload
  )
  return response.data
}

/** DELETE /bookings/{id} → permanently removes the booking. */
export async function deleteBooking(bookingId: string) {
  await axiosInstance.delete(`/bookings/${encodeURIComponent(bookingId)}`)
}

/** PATCH /bookings/{id}/checkout → checks the guest out and frees the room. */
export async function checkOutBooking(bookingId: string) {
  const response = await axiosInstance.patch<Booking>(
    `/bookings/${encodeURIComponent(bookingId)}/checkout`
  )
  return response.data
}
