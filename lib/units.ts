import { ROOM_TYPES } from "@/lib/schemas/units"
import { humanizeSlug } from "@/lib/format"
import type { Unit, UnitsOccupancyStats } from "@/lib/types"

const STATUS_BADGES: Record<string, string> = {
  available:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  occupied:
    "bg-brand-azure/15 text-brand-navy dark:bg-brand-azure/20 dark:text-sky-200",
  reserved:
    "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  cleaning:
    "bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-300",
  maintenance:
    "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300",
  out_of_service:
    "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300",
}

const NEUTRAL_BADGE = "bg-muted text-muted-foreground"

export function getUnitStatusClasses(status: string) {
  return STATUS_BADGES[status.toLowerCase()] ?? NEUTRAL_BADGE
}

const ROOM_TYPE_LABELS = new Map<string, string>(
  ROOM_TYPES.map((type) => [type.value, type.label])
)

/** "1_bedroom" → "1 bedroom"; unknown slugs are humanised. */
export function getRoomTypeLabel(slug: string) {
  return ROOM_TYPE_LABELS.get(slug) ?? humanizeSlug(slug)
}

/** Text colour that matches each occupancy stat's badge tone. */
const STAT_TITLE_CLASSES: Record<keyof UnitsOccupancyStats, string> = {
  total: "text-brand-navy dark:text-sky-200",
  available: "text-emerald-700 dark:text-emerald-300",
  occupied: "text-brand-azure dark:text-sky-300",
  maintenance: "text-rose-700 dark:text-rose-300",
  other: "text-muted-foreground",
}

/**
 * Cards rendered for `GET /bookings/rooms/stats`, in display order. Keys
 * mirror `UnitsOccupancyStats` so a new field in the API shape fails the
 * typecheck here until it gets a card.
 */
export const UNIT_STAT_CARDS: ReadonlyArray<{
  key: keyof UnitsOccupancyStats
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
  {
    key: "other",
    title: "Other",
    label: "reserved, cleaning, etc.",
    titleClassName: STAT_TITLE_CLASSES.other,
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

/** Applies `parseAmenities` to a room straight from the API. */
export function normalizeUnit(unit: Unit): Unit {
  return { ...unit, amenities: parseAmenities(unit.amenities) }
}
