"use client"

import { X } from "lucide-react"
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

export const EMPTY_PAYMENT_FILTERS: PaymentListFilters = { status: "" }

export function hasActivePaymentFilters(filters: PaymentListFilters) {
  return Object.values(filters).some((value) => value !== "")
}

interface PaymentsFiltersProps {
  value: PaymentListFilters
  onChange: (value: PaymentListFilters) => void
}

/** Status filter for the payments list; each change refetches. */
export function PaymentsFilters({ value, onChange }: PaymentsFiltersProps) {
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
