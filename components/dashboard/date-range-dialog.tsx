"use client"

import { useState, type PropsWithChildren } from "react"
import { format, isAfter, parseISO, startOfToday } from "date-fns"
import { StayDatePicker } from "@/components/bookings/stay-date-picker"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import type { ReportRange } from "@/lib/api/reports"
import { getMonthToDateRange } from "@/lib/bookings"
import { getLastMonthRange, isMonthToDate } from "@/lib/dashboard"

const labelClassName =
  "font-heading text-xs font-semibold tracking-wide text-iron uppercase"
const inputClassName =
  "h-11 rounded-lg border-border bg-canvas px-3.5 text-base focus-visible:border-brand-azure focus-visible:ring-brand-azure/20 md:text-base dark:bg-input/30"

interface DateRangeDialogProps extends PropsWithChildren {
  value: ReportRange
  onChange: (range: ReportRange) => void
}

/**
 * "Change dates" dialog for the dashboard reports. Edits a draft copy of the
 * range and only commits on Apply, so a half-picked range never refetches.
 * The start can't be in the future (the calendar disables those days, and
 * `parseReportRange` applies the same rule to hand-typed URLs); the end only
 * has to be on or after the start, so last month and next month both work.
 * The form is mounted only while open so each open re-seeds from `value`.
 */
export function DateRangeDialog({
  value,
  onChange,
  children,
}: DateRangeDialogProps) {
  const [open, setOpen] = useState(false)

  function commit(range: ReportRange) {
    onChange(range)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="md:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Change dates</DialogTitle>
          <DialogDescription>
            Every figure on the dashboard is for bookings in this window.
          </DialogDescription>
        </DialogHeader>
        {open ? <DateRangeForm initial={value} onSubmit={commit} /> : null}
      </DialogContent>
    </Dialog>
  )
}

function DateRangeForm({
  initial,
  onSubmit,
}: {
  initial: ReportRange
  onSubmit: (range: ReportRange) => void
}) {
  // Fixed for the dialog's lifetime so the calendar bounds keep their identity.
  const [today] = useState(startOfToday)
  const [from, setFrom] = useState<Date | null>(parseISO(initial.from_date))
  const [to, setTo] = useState<Date | null>(parseISO(initial.to_date))

  const fromError =
    from && isAfter(from, today) ? "Start date can't be in the future." : null
  const toError =
    from && to && isAfter(from, to)
      ? "End date must be on or after the start date."
      : null
  const canApply = from !== null && to !== null && !fromError && !toError

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        if (!canApply) return
        onSubmit({
          from_date: format(from, "yyyy-MM-dd"),
          to_date: format(to, "yyyy-MM-dd"),
        })
      }}
      noValidate
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="report-from" className={labelClassName}>
            From
          </Label>
          <StayDatePicker
            id="report-from"
            value={from}
            onChange={(date) => {
              setFrom(date)
              // Keep the range valid if "from" jumps past "to".
              if (date && to && isAfter(date, to)) setTo(null)
            }}
            maxDate={today}
            placeholder="Start date"
            clearLabel="Clear start date"
            invalid={Boolean(fromError)}
            describedBy={fromError ? "report-from-error" : undefined}
            className={inputClassName}
          />
          {fromError ? (
            <p id="report-from-error" className="text-sm text-destructive">
              {fromError}
            </p>
          ) : null}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="report-to" className={labelClassName}>
            To
          </Label>
          <StayDatePicker
            id="report-to"
            value={to}
            onChange={setTo}
            minDate={from ?? undefined}
            placeholder="End date"
            clearLabel="Clear end date"
            invalid={Boolean(toError)}
            describedBy={toError ? "report-to-error" : undefined}
            className={inputClassName}
          />
          {toError ? (
            <p id="report-to-error" className="text-sm text-destructive">
              {toError}
            </p>
          ) : null}
        </div>
      </div>

      <DialogFooter className="mt-6 sm:justify-between">
        <div className="flex flex-wrap gap-1">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onSubmit(getLastMonthRange())}
            className="h-11 rounded-full px-4 text-muted-foreground hover:text-foreground"
          >
            Last month
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={isMonthToDate(initial)}
            onClick={() => onSubmit(getMonthToDateRange())}
            className="h-11 rounded-full px-4 text-muted-foreground hover:text-foreground"
          >
            Month to date
          </Button>
        </div>
        <div className="flex gap-2">
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-full px-5"
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="submit"
            disabled={!canApply}
            className="h-11 flex-1 rounded-full bg-brand-azure px-5 text-white hover:bg-brand-azure/90 focus-visible:ring-brand-azure/30"
          >
            Apply
          </Button>
        </div>
      </DialogFooter>
    </form>
  )
}
