"use client"

import { useState, type Ref } from "react"
import { cn } from "cn"
import { ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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

function getRoomLabel(room: Unit) {
  return `Room ${room.room_number} · ${getRoomTypeLabel(room.room_type)}`
}

/**
 * Searchable room picker for a new booking. Every room is listed so staff
 * see the whole inventory, but only bookable ones can be chosen. Rooms that
 * aren't `available` show their status in brackets, e.g. "Room 104
 * (Occupied)". The search matches the room number, room type and status.
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
  const [open, setOpen] = useState(false)
  const selected = rooms?.find((room) => room.room_id === value)

  return (
    // `modal` keeps wheel scrolling inside the list working when the
    // combobox is rendered inside a Dialog.
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          id={id}
          ref={ref}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          disabled={disabled || loading || !rooms}
          onBlur={onBlur}
          className={cn(
            "w-full justify-between font-normal",
            !selected && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">
            {selected
              ? getRoomLabel(selected)
              : loading
                ? "Loading rooms…"
                : "Choose a room"}
          </span>
          <ChevronsUpDown aria-hidden="true" className="ml-2 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) p-0"
      >
        <Command>
          <CommandInput placeholder="Search room number or type" />
          <CommandList>
            <CommandEmpty>No room found.</CommandEmpty>
            <CommandGroup>
              {rooms?.map((room) => (
                <CommandItem
                  key={room.room_id}
                  value={room.room_id}
                  keywords={[
                    room.room_number,
                    getRoomTypeLabel(room.room_type),
                    humanizeSlug(room.status),
                  ]}
                  disabled={!isRoomBookable(room)}
                  data-checked={value === room.room_id}
                  onSelect={() => {
                    onChange(room.room_id)
                    setOpen(false)
                  }}
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate">{getRoomLabel(room)}</span>
                    {room.status.toLowerCase() === "available" ? null : (
                      <span className="truncate text-xs text-muted-foreground">
                        {humanizeSlug(room.status)}
                      </span>
                    )}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
