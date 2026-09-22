"use client"

import { format, isAfter, parseISO } from "date-fns"
import { X } from "lucide-react"
import { StayDatePicker } from "@/components/bookings/stay-date-picker"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { BookingListFilters } from "@/lib/api/bookings"
import { BOOKING_STATUSES } from "@/lib/bookings"
import { humanizeSlug } from "@/lib/format"

/** Select can't hold "" as an item value, so "every status" uses a sentinel. */
const ALL_STATUSES = "all"

const labelClassName =
  "font-heading text-xs font-semibold tracking-wide text-iron uppercase"
const controlClassName =
  "h-11 rounded-lg border-border bg-background px-3.5 text-base focus-visible:border-brand-azure focus-visible:ring-brand-azure/20 md:text-base"

export const EMPTY_BOOKING_FILTERS: BookingListFilters = {
  status: "",
  date_from: "",
  date_to: "",
}

export function hasActiveFilters(filters: BookingListFilters) {
  return Object.values(filters).some((value) => value !== "")
}

function toDate(value: string) {
  return value ? parseISO(value) : null
}

function toIso(date: Date | null) {
  return date ? format(date, "yyyy-MM-dd") : ""
}

interface BookingsFiltersProps {
  value: BookingListFilters
  onChange: (value: BookingListFilters) => void
  /** Greys the controls out, e.g. while a reference lookup overrides them. */
  disabled?: boolean
  /** Hidden where the list already pins a status, e.g. pending on /requests. */
  showStatus?: boolean
}

/** Status + date-range filters for the bookings list; each change refetches. */
export function BookingsFilters({
  value,
  onChange,
  disabled = false,
  showStatus = true,
}: BookingsFiltersProps) {
  const dateFrom = toDate(value.date_from)
  const dateTo = toDate(value.date_to)

  return (
    <fieldset
      disabled={disabled}
      className="flex flex-wrap items-end gap-3 disabled:opacity-60"
    >
      {showStatus ? (
        <div className="grid min-w-44 flex-1 gap-2 sm:flex-none">
          <Label htmlFor="bookings-status" className={labelClassName}>
            Status
          </Label>
          <Select
            value={value.status || ALL_STATUSES}
            onValueChange={(status) =>
              onChange({
                ...value,
                status: status === ALL_STATUSES ? "" : status,
              })
            }
          >
            <SelectTrigger
              id="bookings-status"
              className={`${controlClassName} w-full data-[size=default]:h-11`}
            >
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_STATUSES}>All statuses</SelectItem>
              {BOOKING_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {humanizeSlug(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <div className="grid min-w-44 flex-1 gap-2 sm:flex-none">
        <Label htmlFor="bookings-date-from" className={labelClassName}>
          From
        </Label>
        <StayDatePicker
          id="bookings-date-from"
          value={dateFrom}
          onChange={(date) =>
            onChange({
              ...value,
              date_from: toIso(date),
              // Keep the range valid if "from" jumps past "to".
              date_to:
                date && dateTo && isAfter(date, dateTo) ? "" : value.date_to,
            })
          }
          placeholder="Any date"
          clearLabel="Clear start date"
          disabled={disabled}
          className={controlClassName}
        />
      </div>

      <div className="grid min-w-44 flex-1 gap-2 sm:flex-none">
        <Label htmlFor="bookings-date-to" className={labelClassName}>
          To
        </Label>
        <StayDatePicker
          id="bookings-date-to"
          value={dateTo}
          onChange={(date) => onChange({ ...value, date_to: toIso(date) })}
          minDate={dateFrom ?? undefined}
          placeholder="Any date"
          clearLabel="Clear end date"
          disabled={disabled}
          className={controlClassName}
        />
      </div>

      {hasActiveFilters(value) ? (
        <Button
          type="button"
          variant="ghost"
          onClick={() => onChange(EMPTY_BOOKING_FILTERS)}
          className="h-11 rounded-lg text-muted-foreground hover:text-foreground"
        >
          <X aria-hidden="true" />
          Clear filters
        </Button>
      ) : null}
    </fieldset>
  )
}
