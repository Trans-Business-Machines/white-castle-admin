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
  /** Slug from the API, e.g. "available" or "occupied". */
  status: string
  amenities: string[]
  /** Absolute URLs of uploaded room photos. */
  photos: string[]
  created_at: string
  updated_at: string
}

export interface RoomPhoto {
  url: string
}
