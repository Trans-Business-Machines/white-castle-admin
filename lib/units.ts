import { ROOM_TYPES } from "@/lib/schemas/units"
import { humanizeSlug } from "@/lib/format"

/**
 * Colour per room status. Unknown statuses fall back to a neutral pill so a
 * new value from the API never renders unstyled.
 */
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
