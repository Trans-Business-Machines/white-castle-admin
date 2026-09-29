"use client"

import { useState } from "react"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface Props {
  value: Date
  onChange: (value: Date) => void
}

/**
 * "Choose date" CTA: opens a calendar and closes on pick. Any day can be
 * chosen, so the kitchen can plan ahead or look back.
 */
export function BbDateButton({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button className="h-11 bg-brand-azure rounded-md px-5 text-base">
          <CalendarIcon aria-hidden="true" className="size-5" />
          Choose date
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-2">
        <Calendar
          mode="single"
          required
          selected={value}
          onSelect={(date) => {
            onChange(date)
            setOpen(false)
          }}
          defaultMonth={value}
          autoFocus
          className="p-4 [--cell-size:--spacing(9)]"
        />
      </PopoverContent>
    </Popover>
  )
}
