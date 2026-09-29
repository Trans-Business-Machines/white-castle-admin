import type { RoleName } from "@/lib/roles"

export interface AuthUser {
  user_id: string
  username: string
  email: string
  full_name: string
  role: RoleName
  active: boolean
  must_change_password: boolean
  last_login_at: string
  /** Failed sign-ins since the last success; the account locks at 5. */
  failed_login_attempts: number
  /** ISO timestamp the lock lifts; null when the account isn't locked. */
  locked_until: string | null
  is_locked: boolean
  created_at: string
  updated_at: string
}

export interface Role {
  name: RoleName
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
  /** Whether the room can be booked on the bed and breakfast meal plan. */
  bb_available: boolean
  /** The bed and breakfast charge; `null` when the room doesn't offer it. */
  bb_rate: number | null
  created_at: string
  updated_at: string
}

/**
 * A short-lived signed link to an uploaded file, as returned by `GET
 * /guests/documents/{file_id}` and `GET /payments/evidence/{file_id}`.
 */
export interface SignedFile {
  /** Presigned storage URL, valid for `expires_in` seconds. */
  url: string
  expires_in: number
  filename: string
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

/**
 * `bed_and_breakfast` puts the guest on the bed and breakfast list (and
 * costs extra); `room_only` leaves them off it.
 */
export type MealPlan = "room_only" | "bed_and_breakfast"

/** One booking on the bed and breakfast list (`GET /bookings/bb-list`). */
export interface BbListBooking {
  booking_id: string
  reference: string
  guest_name: string
  guest_phone: string
  /** `""` when the guest gave none. */
  guest_email: string
  adults: number
  children: number
  check_in_date: string
  check_out_date: string
  nights: number
  room_id: string
  room_number: string
  room_type: string
  meal_plan: MealPlan
  /** Per-person nightly breakfast rate. */
  bb_rate: number
  /** Breakfast charge for the whole stay. */
  bb_total: number
  /** `""` when there are none. */
  special_requests: string
}

/** `GET /bookings/bb-list?date=` → who's taking breakfast on `date`. */
export interface BbList {
  date: string
  total_guests: number
  total_adults: number
  total_children: number
  bookings: BbListBooking[]
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
  meal_plan: MealPlan
}

/** Body for `PATCH /bookings/{id}/checkin`. */
export interface CheckInBookingPayload {
  /** The guest record being checked in. */
  guest_id: string
}

/** Body for `PATCH /bookings/{id}/approve`. */
export interface ApproveBookingPayload {
  /** `user_id` of the staff member approving the request. */
  approved_by: string
  deposit_required: boolean
}

/** Body for `PATCH /bookings/{id}/cancel`. */
export interface CancelBookingPayload {
  cancellation_reason: string
  /** `user_id` of the staff member cancelling the booking. */
  cancelled_by: string
}

/** Body for `PATCH /bookings/{id}/extend`. */
export interface ExtendBookingPayload {
  /** The later check-out day, "yyyy-MM-dd". */
  new_check_out_date: string
  /** `user_id` of the staff member extending the stay. */
  extended_by: string
}

/** What `PATCH /bookings/{id}/extend` charged for the added nights. */
export interface BookingExtension {
  extra_nights: number
  room_rate_charge: number
  /** Bed-and-breakfast cost of the added nights, 0 when `includes_bb` is false. */
  bb_charge: number
  total_extra_charge: number
  includes_bb: boolean
  /** Whether the guest owes money for the extension. */
  payment_required: boolean
  /** The booking's total after the extension. */
  new_total: number
  booking_ref: string
}

/** Booking fields returned by the stay-changing endpoints (extend, extra people). */
export interface BookingChangeResponse {
  booking_id: string
  reference: string
  room_number: string
  room_type: string
  check_in_date: string
  check_out_date: string
  nights: number
  adults: number
  children: number
  meal_plan: string
  status: string
  payment_status: string
  total_amount: number
}

/** Response of `PATCH /bookings/{id}/extend`: the updated stay plus the extension's charges. */
export interface ExtendBookingResponse extends BookingChangeResponse {
  extension: BookingExtension
}

/** What `PATCH /bookings/{id}/extra-persons` charged for the added adults. */
export interface BookingExtraPersons {
  previous_adults: number
  new_adults: number
  children: number
  extra_adults: number
  /** Nightly room rate the surcharge is a percentage of. */
  base_rate: number
  extra_person_percentage: number
  /** Nightly surcharge per added adult: `base_rate` × `extra_person_percentage`%. */
  rate_per_extra_adult: number
  /** Nights the surcharge applies to. */
  nights: number
  room_charge: number
  /** Bed-and-breakfast cost for the added people, 0 when `includes_bb` is false. */
  bb_charge: number
  total_extra_charge: number
  includes_bb: boolean
  /** Whether the guest owes money for the added people. */
  payment_required: boolean
  /** The booking's total after the change. */
  new_total: number
  booking_ref: string
}

/** Response of `PATCH /bookings/{id}/extra-persons`: the updated stay plus the added people's charges. */
export interface ExtraPersonsResponse extends BookingChangeResponse {
  extra_persons: BookingExtraPersons
}

/** Body for `PATCH /bookings/{id}/extra-persons`. */
export interface ExtraPersonsPayload {
  /** Adults joining the stay, on top of those already booked. */
  add_adults: number
  /** Children joining the stay, on top of those already booked. */
  add_children: number
}

/** Body for `PATCH /bookings/{id}/reject`. */
export interface RejectBookingPayload {
  rejection_reason: string
  /** `user_id` of the staff member rejecting the request. */
  rejected_by: string
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
  /** `bed_and_breakfast` puts the booking on the kitchen's list. */
  meal_plan?: MealPlan | string
  /** Breakfast charge for the whole stay; only meaningful on a B&B booking. */
  bb_total?: number | null
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

/** Bookings and revenue since the start of a week or month ("yyyy-MM-dd"). */
export interface DashboardPeriod {
  from: string
  bookings: number
  revenue: number
}

/**
 * `GET /motel/reports/dashboard`: today's front-desk counts plus week and
 * month totals, as of `date`. Only the fields the dashboard renders are
 * typed; the response also carries room counts, housekeeping and
 * maintenance figures, and arrival/departure/task/issue lists.
 */
export interface DashboardReport {
  date: string
  today: {
    arrivals: number
    departures: number
    pending_approvals: number
    pending_payments: number
  }
  this_week: DashboardPeriod
  this_month: DashboardPeriod
  details: {
    /** Newest pending bookings; may be capped below `today.pending_approvals`. */
    pending_bookings: Booking[]
  }
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

export type PaymentMethod = "mpesa" | "cash"

/**
 * `extension` and `extra_persons` are only recorded from the extend-booking
 * and extra-person dialogs, for what the stay change added; the record
 * form offers the other two.
 */
export type PaymentType =
  "full_payment" | "deposit" | "extension" | "extra_persons"

/** The payment types a stay change (extend / extra people) records. */
export type StayChangePaymentType = Extract<
  PaymentType,
  "extension" | "extra_persons"
>

/**
 * Body `POST /payments/create` expects. `recorded_by` isn't sent: the
 * backend takes it from the access token.
 */
export interface CreatePaymentPayload {
  booking_id: string
  /** The booking's human-readable reference, copied from the chosen booking. */
  booking_ref: string
  amount: number
  method: PaymentMethod
  /** Transaction reference from the payment channel, e.g. an M-Pesa code; empty for cash. */
  reference: string
  payment_type: PaymentType
}

/**
 * A payment as returned by `POST /payments/create` and `GET /payments/list`.
 * Everything up to `payment_type` mirrors `CreatePaymentPayload`; the rest
 * is set by the backend (`recorded_by` from the access token, the others as
 * the payment is checked).
 */
export interface Payment {
  payment_id: string
  booking_id: string
  booking_ref: string
  amount: number
  /** ISO currency code; every rate in the app is quoted in KES. */
  currency: string
  method: string
  reference: string
  payment_type: string
  notes: string | null
  /** `user_id` of the staff member who recorded the payment. */
  recorded_by: string | null
  status: string
  /** Proof of payment, set by `POST /payments/{id}/evidence`. */
  evidence_url: string | null
  evidence_filename: string | null
  /** Username of whoever verified the payment, e.g. "alice_finance". */
  verified_by: string | null
  verified_at: string | null
  rejection_reason: string | null
  created_at: string
  updated_at: string | null
}

/**
 * Query params for `POST /payments/complete/{booking_ref}`, which records
 * the balance on a booking whose deposit is already in. `recorded_by` isn't
 * sent: the backend takes it from the access token.
 */
export interface CompletePaymentParams {
  amount: number
  method: PaymentMethod
  /** Transaction reference; left out for cash. */
  reference?: string
}

/**
 * Body for `PATCH /payments/{id}/reject`. The backend records who rejected
 * it from the access token.
 */
export interface RejectPaymentPayload {
  rejection_reason: string
}

/** A count of payments and what they add up to, in the report's currency. */
export interface PaymentTotals {
  count: number
  amount: number
}

/**
 * `GET /payments/stats`. There is no overall amount; the cards add the
 * three statuses up (see `getPaymentsTotalAmount` in `lib/payments.ts`).
 */
export interface PaymentStats {
  period: { from: string | null; to: string | null }
  currency: string
  total_payments: number
  verified: PaymentTotals
  pending: PaymentTotals
  rejected: PaymentTotals
  /** Keyed by method slug, e.g. "mpesa", "cash". */
  by_method: Record<string, PaymentTotals>
}

/** One motel-wide setting from `GET /motel/settings`. Values are strings. */
export interface MotelSetting {
  /** Snake-case identifier, e.g. "bb_cutoff_time". */
  key: string
  /** Always a string; "" when the setting hasn't been filled in. */
  value: string
  description: string
  updated_at: string
}
