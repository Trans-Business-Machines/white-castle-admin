export interface AuthUser {
  user_id: string
  username: string
  email: string
  full_name: string
  role: string
  active: boolean
  must_change_password: boolean
  last_login_at: string
  created_at: string
  updated_at: string
}

export interface Role {
  name: string
  label: string
  description: string
  created_at: string
}

export interface Unit {
  room_id: string
  room_number: string
  room_type: string
  description: string
  max_occupancy: number
  base_rate: number
  status: string
  amenities: string[]
  photos: string[]
  created_at: string
  updated_at: string
}

export interface Guest {
  guest_id: string
  full_name: string
  email: string | null
  phone: string | null
  national_id: string | null
  id_type: string
  nationality: string | null
  date_of_birth: string | null
  total_stays: number
  total_spent: number
  blacklisted: boolean
  blacklist_reason: string | null
  notes: string | null
  created_at: string
  updated_at: string
  id_documents: string[]
}

export interface GuestsStats {
  total_guests: number
  active: number
  blacklisted: number
}

/** Body `POST /bookings/create` expects. Dates are "yyyy-MM-dd". */
export interface CreateBookingPayload {
  room_id: string
  check_in_date: string
  check_out_date: string
  adults: number
  children: number
  special_requests: string
  guest_name: string
  guest_email: string
  guest_phone: string
}

export type BookingStatus =
  | "pending"
  | "approved"
  | "checked_in"
  | "checked_out"
  | "confirmed"
  | "cancelled"
  | "rejected"

/**
 * A booking as returned by `POST /bookings/create`, `GET /bookings/list` and
 * `GET /bookings/lookup/{reference}`. Only `room_id` is included, so the room
 * number is resolved from the units query.
 */
export interface Booking {
  booking_id: string
  /** Human-readable reference shown to guests, e.g. "WCM-2026-30A19E61". */
  reference: string
  guest_id: string | null
  room_id: string
  check_in_date: string
  check_out_date: string
  nights: number
  adults: number
  children: number
  special_requests: string | null
  status: BookingStatus | string
  payment_status: string
  payment_deadline: string | null
  total_amount: number
  deposit_amount: number
  guest_name: string
  guest_email: string | null
  guest_phone: string | null
  approved_by: string | null
  approved_at: string | null
  rejection_reason: string | null
  cancelled_at: string | null
  cancelled_by: string | null
  cancellation_reason: string | null
  check_in_at: string | null
  check_out_at: string | null
  /** Data URI of the booking's QR code image. */
  qr_code: string | null
  created_at: string
  updated_at: string
}

/** `GET /bookings/occupancy` for a date range (both ends "yyyy-MM-dd"). */
export interface BookingsOccupancyStats {
  from_date: string
  to_date: string
  total_rooms: number
  confirmed_bookings: number
  currently_occupied: number
  revenue_kes: number
  occupancy_rate_pct: number
}

export interface RoomPhoto {
  url: string
}

export interface UserStats {
  total_users: number
  active_users: number
  inactive_users: number
  by_role: Record<string, number>
}

export interface UnitsOccupancyStats {
  total: number
  available: number
  occupied: number
  maintenance: number
  other: number
}
