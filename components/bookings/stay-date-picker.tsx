"use client"

import { useState, type Ref } from "react"
import { cn } from "cn"
import { CalendarIcon, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { formatDate } from "@/lib/format"

interface StayDatePickerProps {
  id: string
  value: Date | null
  onChange: (value: Date | null) => void
  onBlur?: () => void
  ref?: Ref<HTMLButtonElement>
  /** Earliest selectable day; omit to allow any date. */
  minDate?: Date
  placeholder?: string
  clearLabel: string
  disabled?: boolean
  invalid?: boolean
  describedBy?: string
  className?: string
}

/**
 * Single-day picker (shadcn Popover + Calendar) used for check-in /
 * check-out and the bookings date filters. Days before `minDate`, when
 * given, are disabled so a stay can't start in the past or end before it
 * begins.
 */
export function StayDatePicker({
  id,
  value,
  onChange,
  onBlur,
  ref,
  minDate,
  placeholder = "Pick a date",
  clearLabel,
  disabled,
  invalid,
  describedBy,
  className,
}: StayDatePickerProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex gap-2">
      <Popover open={open} onOpenChange={setOpen} modal>
        <PopoverTrigger asChild>
          <Button
            id={id}
            ref={ref}
            type="button"
            variant="outline"
            aria-invalid={invalid}
            aria-describedby={describedBy}
            disabled={disabled}
            onBlur={onBlur}
            className={cn(
              "w-full min-w-0 flex-1 justify-start font-normal",
              !value && "text-muted-foreground",
              className
            )}
          >
            <CalendarIcon aria-hidden="true" className="opacity-60" />
            <span className="truncate">
              {value ? formatDate(value) : placeholder}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-2">
          <Calendar
            mode="single"
            selected={value ?? undefined}
            onSelect={(date) => {
              onChange(date ?? null)
              if (date) setOpen(false)
            }}
            defaultMonth={value ?? minDate}
            startMonth={minDate}
            disabled={minDate ? { before: minDate } : undefined}
            autoFocus
            className="p-4 [--cell-size:--spacing(9)]"
          />
        </PopoverContent>
      </Popover>
      {value ? (
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          disabled={disabled}
          onClick={() => onChange(null)}
          aria-label={clearLabel}
          className="size-11 shrink-0 rounded-lg"
        >
          <X aria-hidden="true" />
        </Button>
      ) : null}
    </div>
  )
}
