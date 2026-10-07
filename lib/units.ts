import { MEAL_PLANS } from "@/lib/schemas/bookings"
import { ROOM_TYPES } from "@/lib/schemas/units"
import { humanizeSlug } from "@/lib/format"
import type {
  BookingCurrency,
  MealPlan,
  Unit,
  UnitsOccupancyStats,
} from "@/lib/types"
/** Every status a room can be in; also the units table's status filter. */
export const UNIT_STATUSES = [
  "available",
  "occupied",
  "housekeeping",
  "maintenance",
] as const

export type UnitStatus = (typeof UNIT_STATUSES)[number]

const STATUS_BADGES: Record<UnitStatus, string> = {
  available:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  occupied: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  housekeeping:
    "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  maintenance:
    "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
}

function isUnitStatus(status: string): status is UnitStatus {
  return (UNIT_STATUSES as readonly string[]).includes(status)
}

const NEUTRAL_BADGE = "bg-muted text-muted-foreground"

/** Badge tone for a room status; anything outside `UNIT_STATUSES` is neutral. */
export function getUnitStatusClasses(status: string) {
  const slug = status.toLowerCase()
  return isUnitStatus(slug) ? STATUS_BADGES[slug] : NEUTRAL_BADGE
}

const ROOM_TYPE_LABELS = new Map<string, string>(
  ROOM_TYPES.map((type) => [type.value, type.label])
)

/** "1_bedroom" → "1 bedroom"; unknown slugs are humanised. */
export function getRoomTypeLabel(slug: string) {
  return ROOM_TYPE_LABELS.get(slug) ?? humanizeSlug(slug)
}

/**
 * The occupancy fields that get a card. `other` (rooms in housekeeping) is
 * left out on purpose: it's a catch-all with no action attached.
 */
export type UnitStatKey = keyof Omit<UnitsOccupancyStats, "other">

/** Text colour that matches each occupancy stat's badge tone. */
const STAT_TITLE_CLASSES: Record<UnitStatKey, string> = {
  total: "text-brand-navy dark:text-sky-200",
  available: "text-emerald-700 dark:text-emerald-300",
  occupied: "text-rose-700 dark:text-rose-300",
  maintenance: "text-orange-700 dark:text-orange-300",
}

/**
 * Cards rendered for `GET /bookings/rooms/stats`, in display order. Keys
 * mirror `UnitStatKey` so a new field in the API shape fails the typecheck
 * here until it gets a card or is excluded.
 */
export const UNIT_STAT_CARDS: ReadonlyArray<{
  key: UnitStatKey
  title: string
  label: string
  titleClassName: string
}> = [
  {
    key: "total",
    title: "Total units",
    label: "on the property",
    titleClassName: STAT_TITLE_CLASSES.total,
  },
  {
    key: "available",
    title: "Available",
    label: "ready for guests",
    titleClassName: STAT_TITLE_CLASSES.available,
  },
  {
    key: "occupied",
    title: "Occupied",
    label: "currently checked in",
    titleClassName: STAT_TITLE_CLASSES.occupied,
  },
  {
    key: "maintenance",
    title: "Maintenance",
    label: "out of rotation",
    titleClassName: STAT_TITLE_CLASSES.maintenance,
  },
]

/**
 * The API sometimes returns `amenities` as a JSON-encoded string
 * (`'["Wi-Fi","TV"]'`) instead of an array. Accepts either and always
 * returns a clean `string[]`; anything unparseable becomes an empty list.
 */
export function parseAmenities(value: unknown): string[] {
  let list: unknown = value
  if (typeof value === "string") {
    try {
      list = JSON.parse(value)
    } catch {
      // Not JSON — treat a bare string as a single amenity.
      list = value.trim() ? [value] : []
    }
  }
  if (!Array.isArray(list)) return []
  return list
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
}

/**
 * Cleans up a room straight from the API: applies `parseAmenities`, and
 * defaults the meal plan rate fields for responses that omit them.
 */
export function normalizeUnit(unit: Unit): Unit {
  return {
    ...unit,
    amenities: parseAmenities(unit.amenities),
    bb_rate: unit.bb_rate ?? null,
    hb_rate: unit.hb_rate ?? null,
    fb_rate: unit.fb_rate ?? null,
    base_rate_usd: unit.base_rate_usd ?? null,
    bb_rate_usd: unit.bb_rate_usd ?? null,
    hb_rate_usd: unit.hb_rate_usd ?? null,
    fb_rate_usd: unit.fb_rate_usd ?? null,
  }
}

/** Which `Unit` fields hold each meal plan's nightly rate, per currency. */
const RATE_FIELDS = {
  room_only: { abbr: "BO", KES: "base_rate", USD: "base_rate_usd" },
  bed_and_breakfast: { abbr: "BB", KES: "bb_rate", USD: "bb_rate_usd" },
  half_board: { abbr: "HB", KES: "hb_rate", USD: "hb_rate_usd" },
  full_board: { abbr: "FB", KES: "fb_rate", USD: "fb_rate_usd" },
} as const satisfies Record<
  MealPlan,
  { abbr: string } & Record<BookingCurrency, keyof Unit>
>

/**
 * The room's nightly rate for every meal plan in one currency, in
 * `MEAL_PLANS` order; `rate` is null when the room has none set.
 */
export function getUnitRates(unit: Unit, currency: BookingCurrency) {
  return MEAL_PLANS.map(({ value, label }) => {
    const fields = RATE_FIELDS[value]
    return {
      plan: value,
      label,
      abbr: fields.abbr,
      rate: unit[fields[currency]] as number | null,
    }
  })
}
