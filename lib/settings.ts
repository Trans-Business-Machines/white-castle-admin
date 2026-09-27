import {
  Banknote,
  BellRing,
  CalendarX2,
  Coffee,
  Settings2,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react"
import { humanizeSlug } from "@/lib/format"
import type { MotelSetting } from "@/lib/types"

/**
 * Readable names for the setting keys, kept close to the key itself; only
 * abbreviations are spelled out ("bb" → "Bed and breakfast"). Anything the
 * API adds later falls back to its humanized key.
 */
const SETTING_LABELS: Record<string, string> = {
  bb_cutoff_time: "Bed and breakfast cutoff time",
  cancellation_fee_percentage: "Cancellation fee percentage",
  catering_email: "Catering email",
  deposit_percentage: "Deposit percentage",
  free_cancellation_hours: "Free cancellation hours",
  lockout_minutes: "Lockout minutes",
  max_login_attempts: "Maximum login attempts",
  mpesa_paybill: "M-Pesa paybill",
  payment_deadline_hours: "Payment deadline hours",
  staff_email: "Staff email",
}

export function getSettingLabel(key: string) {
  return SETTING_LABELS[key] ?? humanizeSlug(key)
}

function plural(count: string, one: string, many: string) {
  return `${count} ${count === "1" ? one : many}`
}

/**
 * The value as it reads on the card, with its unit taken from the key's
 * suffix ("50" → "50%", "24" → "24 hours"). Returns `null` for an empty
 * value so the card can say it isn't set.
 */
export function formatSettingValue({ key, value }: MotelSetting) {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (key.endsWith("_percentage")) return `${trimmed}%`
  if (key.endsWith("_hours")) return plural(trimmed, "hour", "hours")
  if (key.endsWith("_minutes")) return plural(trimmed, "minute", "minutes")
  if (key.endsWith("_attempts")) return plural(trimmed, "attempt", "attempts")
  if (key.endsWith("_email")) {
    // Comma-separated lists read better with a space after each comma.
    return trimmed
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
      .join(", ")
  }
  return trimmed
}

/** The groups the settings page is split into, in display order. */
const CATEGORIES = [
  {
    id: "payments",
    title: "Payments",
    summary: "Deposits, payment deadlines and how guests pay.",
    icon: Banknote,
  },
  {
    id: "cancellations",
    title: "Cancellations",
    summary: "When cancelling is free, and what a guest forfeits after.",
    icon: CalendarX2,
  },
  {
    id: "breakfast",
    title: "Bed & breakfast",
    summary: "The daily breakfast list sent to the caterer.",
    icon: Coffee,
  },
  {
    id: "notifications",
    title: "Notifications",
    summary: "Where staff alerts are sent.",
    icon: BellRing,
  },
  {
    id: "security",
    title: "Security",
    summary: "Sign-in limits for staff accounts.",
    icon: ShieldCheck,
  },
  {
    id: "general",
    title: "General",
    summary: "Other motel-wide settings.",
    icon: Settings2,
  },
] as const satisfies readonly {
  id: string
  title: string
  summary: string
  icon: LucideIcon
}[]

export type SettingCategory = (typeof CATEGORIES)[number]

type CategoryId = SettingCategory["id"]

/** Which group each known key belongs to; anything else lands in General. */
const SETTING_CATEGORY: Record<string, CategoryId> = {
  deposit_percentage: "payments",
  payment_deadline_hours: "payments",
  mpesa_paybill: "payments",
  free_cancellation_hours: "cancellations",
  cancellation_fee_percentage: "cancellations",
  bb_cutoff_time: "breakfast",
  catering_email: "breakfast",
  staff_email: "notifications",
  max_login_attempts: "security",
  lockout_minutes: "security",
}

/** Reading order within a group follows `SETTING_CATEGORY`'s key order. */
const SETTING_ORDER = Object.keys(SETTING_CATEGORY)

function orderOf(key: string) {
  const index = SETTING_ORDER.indexOf(key)
  return index === -1 ? SETTING_ORDER.length : index
}

/**
 * Splits the settings into their categories, in `CATEGORIES` order, and
 * drops categories with nothing in them. Unknown keys keep the API's order
 * at the end of their group.
 */
export function groupSettings(settings: readonly MotelSetting[]) {
  return CATEGORIES.map((category) => ({
    category,
    settings: settings
      .filter(
        (setting) =>
          (SETTING_CATEGORY[setting.key] ?? "general") === category.id
      )
      .sort((a, b) => orderOf(a.key) - orderOf(b.key)),
  })).filter((group) => group.settings.length > 0)
}
