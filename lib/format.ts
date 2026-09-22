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

/** "21 Sep 2026, 11:00 PM" from an ISO timestamp, or "—" when absent/invalid. */
export function formatTimestamp(value: string | null | undefined) {
  if (!value) return "—"
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? "—"
    : formatDate(date, "dd MMM yyyy, hh:mm a")
}

/** Builds avatar initials from a full name, e.g. "Grace Noor" → "GN". */
export function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

/** Turns a role slug into a readable fallback label: "super_admin" → "Super admin". */
export function humanizeSlug(slug: string) {
  const words = slug.replace(/[_-]+/g, " ").trim()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/** Formats a byte count as "1.2 MB" / "840 KB". */
export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
