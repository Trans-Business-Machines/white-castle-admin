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
import { formatCurrency, formatDate } from "@/lib/format"
import type { Booking } from "@/lib/types"

interface PaymentBookingComboboxProps {
  id: string
  /** Selected booking id, or "" when none is chosen. */
  value: string
  /** The chosen booking, or null when the selection is cleared. */
  onChange: (booking: Booking | null) => void
  onBlur?: () => void
  ref?: Ref<HTMLButtonElement>
  /** Bookings that can still be paid for. */
  bookings: Booking[] | undefined
  /**
   * Reference to show when `value` isn't in `bookings` — a row prefill can
   * point at a booking that has since been paid and left the list.
   */
  fallbackRef?: string
  loading: boolean
  disabled?: boolean
  invalid?: boolean
  describedBy?: string
  className?: string
}

/** Secondary line under a booking's reference: "Jane Doe · KES 13,500". */
function getSummaryLine(booking: Booking) {
  return `${booking.guest_name} · ${formatCurrency(booking.total_amount)}`
}

/**
 * Searchable picker over the bookings that still owe money. The search
 * matches reference, guest name, email or phone via cmdk `keywords`.
 * Choosing a booking hands the whole record back so the form can store its
 * id and its reference, both of which `POST /payments/create` wants.
 */
export function PaymentBookingCombobox({
  id,
  value,
  onChange,
  onBlur,
  ref,
  bookings,
  fallbackRef,
  loading,
  disabled,
  invalid,
  describedBy,
  className,
}: PaymentBookingComboboxProps) {
  const [open, setOpen] = useState(false)
  const selected = bookings?.find((booking) => booking.booking_id === value)
  const label = selected
    ? `${selected.reference} · ${selected.guest_name}`
    : value && fallbackRef
      ? fallbackRef
      : ""

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
          disabled={disabled || loading || !bookings}
          onBlur={onBlur}
          className={cn(
            "w-full justify-between font-normal",
            !label && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">
            {label || (loading ? "Loading bookings…" : "Choose a booking")}
          </span>
          <ChevronsUpDown aria-hidden="true" className="ml-2 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) p-0"
      >
        <Command>
          <CommandInput placeholder="Search by reference or guest" />
          <CommandList>
            <CommandEmpty>No unpaid booking found.</CommandEmpty>
            <CommandGroup>
              {bookings?.map((booking) => (
                <CommandItem
                  key={booking.booking_id}
                  value={booking.booking_id}
                  keywords={[
                    booking.reference,
                    booking.guest_name,
                    booking.guest_email ?? "",
                    booking.guest_phone ?? "",
                  ]}
                  data-checked={value === booking.booking_id}
                  onSelect={() => {
                    onChange(value === booking.booking_id ? null : booking)
                    setOpen(false)
                  }}
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate font-mono text-sm font-semibold">
                      {booking.reference}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {getSummaryLine(booking)} ·{" "}
                      {formatDate(booking.check_in_date)}
                    </span>
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
