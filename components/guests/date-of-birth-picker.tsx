"use client"

import { useState, type Ref } from "react"
import { cn } from "cn"
import { startOfToday, subYears } from "date-fns"
import { CalendarIcon, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { formatDate } from "@/lib/format"

interface DateOfBirthPickerProps {
  id: string
  value: Date | null
  onChange: (value: Date | null) => void
  onBlur?: () => void
  ref?: Ref<HTMLButtonElement>
  disabled?: boolean
  invalid?: boolean
  describedBy?: string
  className?: string
}

const EARLIEST_YEAR = 1900

/**
 * Date of birth picker (shadcn Popover + Calendar). Month and year are
 * dropdowns so staff can jump decades without paging, and future dates
 * are disabled.
 */
export function DateOfBirthPicker({
  id,
  value,
  onChange,
  onBlur,
  ref,
  disabled,
  invalid,
  describedBy,
  className,
}: DateOfBirthPickerProps) {
  const [open, setOpen] = useState(false)
  const today = startOfToday()

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
              {value ? formatDate(value) : "Pick a date"}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-2">
          <Calendar
            mode="single"
            captionLayout="dropdown"
            selected={value ?? undefined}
            onSelect={(date) => {
              onChange(date ?? null)
              if (date) setOpen(false)
            }}
            // Open on the selected month, or roughly an adult's birth year.
            defaultMonth={value ?? subYears(today, 30)}
            startMonth={new Date(EARLIEST_YEAR, 0)}
            endMonth={today}
            disabled={{ after: today }}
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
          aria-label="Clear date of birth"
          className="size-11 shrink-0 rounded-lg"
        >
          <X aria-hidden="true" />
        </Button>
      ) : null}
    </div>
  )
}
