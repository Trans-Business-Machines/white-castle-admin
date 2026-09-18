import { cn } from "cn"
import { humanizeSlug } from "@/lib/format"
import { getRoleClasses } from "@/lib/roles"

interface RoleBadgeProps {
  /** Role slug from the API, e.g. "super_admin". */
  role: string
  /** Display text; defaults to a humanised slug. */
  label?: string
  className?: string
}

/** Tinted pill whose colour follows the role (see `lib/roles.ts`). */
function RoleBadge({ role, label, className }: RoleBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        getRoleClasses(role).badge,
        className
      )}
    >
      {label ?? humanizeSlug(role)}
    </span>
  )
}

export { RoleBadge }
