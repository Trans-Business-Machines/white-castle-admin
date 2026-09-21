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
