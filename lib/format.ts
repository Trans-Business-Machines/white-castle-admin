import { format } from "date-fns"

const kes = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  currencyDisplay: "code",
  maximumFractionDigits: 0,
})

/** Formats an amount as "KES 13,500". */
export function formatCurrency(amount: number) {
  return kes.format(amount)
}

/** Formats a date as "16 Sep 2026" by default. */
export function formatDate(
  date: Date | number | string,
  pattern = "d MMM yyyy"
) {
  return format(date, pattern)
}
