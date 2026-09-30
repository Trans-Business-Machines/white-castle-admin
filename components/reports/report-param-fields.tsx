"use client"

import { isAfter } from "date-fns"
import { toDate, toIso } from "@/components/bookings/bookings-filters"
import {
  inputClassName,
  labelClassName,
} from "@/components/bookings/booking-form-fields"
import { StayDatePicker } from "@/components/bookings/stay-date-picker"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { ReportDateRange } from "@/lib/api/reports"

/** Select can't hold "" as an item value, so "no filter" uses a sentinel. */
const ALL = "all"

interface ReportDateRangeFieldsProps {
  /** Prefix for the two inputs' ids, e.g. "revenue-report". */
  idPrefix: string
  value: ReportDateRange
  onChange: (patch: Partial<ReportDateRange>) => void
}

/** From / To pickers shared by the report dialogs; "to" can't precede "from". */
export function ReportDateRangeFields({
  idPrefix,
  value,
  onChange,
}: ReportDateRangeFieldsProps) {
  const from = toDate(value.from_date)
  const to = toDate(value.to_date)

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="grid min-w-0 gap-2">
        <Label htmlFor={`${idPrefix}-from`} className={labelClassName}>
          From
        </Label>
        <StayDatePicker
          id={`${idPrefix}-from`}
          value={from}
          onChange={(date) =>
            onChange({
              from_date: toIso(date),
              // Keep the range valid if "from" jumps past "to".
              ...(date && to && isAfter(date, to) ? { to_date: "" } : {}),
            })
          }
          placeholder="Any date"
          clearLabel="Clear start date"
          className={inputClassName}
        />
      </div>

      <div className="grid min-w-0 gap-2">
        <Label htmlFor={`${idPrefix}-to`} className={labelClassName}>
          To
        </Label>
        <StayDatePicker
          id={`${idPrefix}-to`}
          value={to}
          onChange={(date) => onChange({ to_date: toIso(date) })}
          minDate={from ?? undefined}
          placeholder="Any date"
          clearLabel="Clear end date"
          className={inputClassName}
        />
      </div>
    </div>
  )
}

interface ReportDateFieldProps {
  id: string
  label: string
  /** "yyyy-MM-dd", or "" when not picked. */
  value: string
  onChange: (value: string) => void
  placeholder: string
  /** Muted line under the picker explaining the default. */
  hint?: string
}

/** One optional day, e.g. the B&B report's breakfast list date. */
export function ReportDateField({
  id,
  label,
  value,
  onChange,
  placeholder,
  hint,
}: ReportDateFieldProps) {
  return (
    <div className="grid min-w-0 gap-2">
      <Label htmlFor={id} className={labelClassName}>
        {label}
      </Label>
      <StayDatePicker
        id={id}
        value={toDate(value)}
        onChange={(date) => onChange(toIso(date))}
        placeholder={placeholder}
        clearLabel={`Clear ${label.toLowerCase()}`}
        describedBy={hint ? `${id}-hint` : undefined}
        className={inputClassName}
      />
      {hint ? (
        <p id={`${id}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

interface ReportSelectFieldProps {
  id: string
  label: string
  /** Label of the "no filter" option, e.g. "All statuses". */
  allLabel: string
  /** The chosen slug, or "" for no filter. */
  value: string
  options: readonly { value: string; label: string }[]
  onChange: (value: string) => void
}

/** Optional single-choice filter with an "All …" option that maps to "". */
export function ReportSelectField({
  id,
  label,
  allLabel,
  value,
  options,
  onChange,
}: ReportSelectFieldProps) {
  return (
    <div className="grid min-w-0 gap-2">
      <Label htmlFor={id} className={labelClassName}>
        {label}
      </Label>
      <Select
        value={value || ALL}
        onValueChange={(next) => onChange(next === ALL ? "" : next)}
      >
        <SelectTrigger
          id={id}
          className={`${inputClassName} w-full data-[size=default]:h-11`}
        >
          <SelectValue placeholder={allLabel} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{allLabel}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

interface ReportTableFilterProps {
  /** Accessible name, e.g. "Filter by status". */
  label: string
  allLabel: string
  /** The chosen slug, or "" for no filter. */
  value: string
  options: readonly { value: string; label: string }[]
  onChange: (value: string) => void
}

/** Unlabelled select for a report table's toolbar, beside the search box. */
export function ReportTableFilter({
  label,
  allLabel,
  value,
  options,
  onChange,
}: ReportTableFilterProps) {
  return (
    <Select
      value={value || ALL}
      onValueChange={(next) => onChange(next === ALL ? "" : next)}
    >
      <SelectTrigger
        aria-label={label}
        className="h-11 w-full rounded-lg border-border bg-background px-3.5 text-base focus-visible:border-brand-azure focus-visible:ring-brand-azure/20 data-[size=default]:h-11 sm:w-44 md:text-base"
      >
        <SelectValue placeholder={allLabel} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{allLabel}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
