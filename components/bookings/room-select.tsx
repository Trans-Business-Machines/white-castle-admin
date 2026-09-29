"use client"

import type { Ref } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { humanizeSlug } from "@/lib/format"
import type { Unit } from "@/lib/types"
import { getRoomTypeLabel } from "@/lib/units"

/**
 * Statuses a new booking can take. A room in `housekeeping` is only being
 * cleaned, which doesn't block a booking (per the backend), so it counts.
 */
const BOOKABLE_STATUSES = ["available", "housekeeping"]

export function isRoomBookable(room: Unit) {
  return BOOKABLE_STATUSES.includes(room.status.toLowerCase())
}

interface RoomSelectProps {
  id: string
  /** Selected room id, or "" when none is chosen. */
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  ref?: Ref<HTMLButtonElement>
  rooms: Unit[] | undefined
  loading: boolean
  disabled?: boolean
  invalid?: boolean
  describedBy?: string
  className?: string
}

/**
 * Room picker for a new booking. Every room is listed so staff see the
 * whole inventory, but only bookable ones can be chosen. Rooms that aren't
 * `available` show their status in brackets, e.g. "Room 104 (Occupied)".
 */
export function RoomSelect({
  id,
  value,
  onChange,
  onBlur,
  ref,
  rooms,
  loading,
  disabled,
  invalid,
  describedBy,
  className,
}: RoomSelectProps) {
  return (
    <Select
      value={value}
      onValueChange={onChange}
      disabled={disabled || loading || !rooms}
    >
      <SelectTrigger
        id={id}
        ref={ref}
        onBlur={onBlur}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        className={className}
      >
        <SelectValue
          placeholder={loading ? "Loading rooms…" : "Choose a room"}
        />
      </SelectTrigger>
      <SelectContent>
        {rooms?.map((room) => (
          <SelectItem
            key={room.room_id}
            value={room.room_id}
            disabled={!isRoomBookable(room)}
          >
            Room {room.room_number} · {getRoomTypeLabel(room.room_type)}
            {room.status.toLowerCase() === "available"
              ? ""
              : ` (${humanizeSlug(room.status)})`}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
