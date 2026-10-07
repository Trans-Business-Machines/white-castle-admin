"use client"

import { cn } from "cn"
import { useRateCurrency } from "@/hooks/use-rate-currency"
import { CURRENCIES } from "@/lib/schemas/bookings"

/** Header toggle for the currency room rates are shown in. */
function RateCurrencySwitch() {
  const [currency, setCurrency] = useRateCurrency()

  return (
    <div
      role="group"
      aria-label="Show room rates in"
      className="flex h-10 shrink-0 items-center gap-1 rounded-full border border-border p-1"
    >
      {CURRENCIES.map((option) => {
        const selected = option.value === currency
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            title={option.label}
            onClick={() => setCurrency(option.value)}
            className={cn(
              "h-full rounded-full px-3 text-sm font-semibold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-brand-azure/20",
              selected
                ? "bg-brand-azure text-white"
                : "text-muted-foreground hover:bg-porcelain hover:text-foreground dark:hover:bg-muted"
            )}
          >
            {option.value}
          </button>
        )
      })}
    </div>
  )
}

export { RateCurrencySwitch }
