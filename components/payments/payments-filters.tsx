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
import type { PaymentListFilters } from "@/lib/api/payments"
import { humanizeSlug } from "@/lib/format"
import { PAYMENT_STATUSES } from "@/lib/payments"

/** Select can't hold "" as an item value, so "every status" uses a sentinel. */
const ALL_STATUSES = "all"

const labelClassName =
  "font-heading text-xs font-semibold tracking-wide text-iron uppercase"
const controlClassName =
  "h-11 rounded-lg border-border bg-background px-3.5 text-base focus-visible:border-brand-azure focus-visible:ring-brand-azure/20 md:text-base"

/** The filters these controls own; the reference comes from the table's search box. */
export type PaymentFilterValues = Omit<PaymentListFilters, "reference">

export const EMPTY_PAYMENT_FILTERS: PaymentFilterValues = {
  status: "",
  date_from: "",
  date_to: "",
}

export function hasActivePaymentFilters(filters: PaymentFilterValues) {
  return Object.values(filters).some((value) => value !== "")
}

function toDate(value: string) {
  return value ? parseISO(value) : null
}

function toIso(date: Date | null) {
  return date ? format(date, "yyyy-MM-dd") : ""
}

interface PaymentsFiltersProps {
  value: PaymentFilterValues
  onChange: (value: PaymentFilterValues) => void
}

/** Status + date-range filters for the payments list; each change refetches. */
export function PaymentsFilters({ value, onChange }: PaymentsFiltersProps) {
  const dateFrom = toDate(value.date_from)
  const dateTo = toDate(value.date_to)

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="grid min-w-44 flex-1 gap-2 sm:flex-none">
        <Label htmlFor="payments-status" className={labelClassName}>
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
            id="payments-status"
            className={`${controlClassName} w-full data-[size=default]:h-11`}
          >
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_STATUSES}>All statuses</SelectItem>
            {PAYMENT_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {humanizeSlug(status)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid min-w-44 flex-1 gap-2 sm:flex-none">
        <Label htmlFor="payments-date-from" className={labelClassName}>
          From
        </Label>
        <StayDatePicker
          id="payments-date-from"
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
          className={controlClassName}
        />
      </div>

      <div className="grid min-w-44 flex-1 gap-2 sm:flex-none">
        <Label htmlFor="payments-date-to" className={labelClassName}>
          To
        </Label>
        <StayDatePicker
          id="payments-date-to"
          value={dateTo}
          onChange={(date) => onChange({ ...value, date_to: toIso(date) })}
          minDate={dateFrom ?? undefined}
          placeholder="Any date"
          clearLabel="Clear end date"
          className={controlClassName}
        />
      </div>

      {hasActivePaymentFilters(value) ? (
        <Button
          type="button"
          variant="ghost"
          onClick={() => onChange(EMPTY_PAYMENT_FILTERS)}
          className="h-11 rounded-lg text-muted-foreground hover:text-foreground"
        >
          <X aria-hidden="true" />
          Clear filters
        </Button>
      ) : null}
    </div>
  )
}
