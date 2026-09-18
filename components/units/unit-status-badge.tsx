import { cn } from "cn"
import { humanizeSlug } from "@/lib/format"
import { getUnitStatusClasses } from "@/lib/units"

interface UnitStatusBadgeProps {
  /** Status slug from the API, e.g. "available". */
  status: string
  className?: string
}

/** Tinted pill whose colour follows the room status (see `lib/units.ts`). */
function UnitStatusBadge({ status, className }: UnitStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        getUnitStatusClasses(status),
        className
      )}
    >
      {humanizeSlug(status)}
    </span>
  )
}

export { UnitStatusBadge }
