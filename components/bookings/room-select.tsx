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

function isAvailable(room: Unit) {
  return room.status.toLowerCase() === "available"
}

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
 * Room picker for a booking. Every room is listed so staff can see the full
 * inventory, but only `available` and `housekeeping` rooms can be chosen;
 * the rest are disabled. Any room that isn't `available` shows its status
 * in brackets, e.g. "Room 104 (Occupied)" or a selectable
 * "Room 102 (Housekeeping)".
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
        {rooms?.map((room) => {
          const bookable = isRoomBookable(room)
          return (
            <SelectItem
              key={room.room_id}
              value={room.room_id}
              disabled={!bookable}
            >
              Room {room.room_number} · {getRoomTypeLabel(room.room_type)}
              {isAvailable(room) ? "" : ` (${humanizeSlug(room.status)})`}
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}
