import { cn } from "cn"
import { getAuditActionClasses, getAuditActionLabel } from "@/lib/audit"

/** Tinted pill whose colour follows the audit action (see `lib/audit.ts`). */
function AuditActionBadge({
  action,
  className,
}: {
  /** Action from the API, e.g. "LOGIN_FAILED". */
  action: string
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        getAuditActionClasses(action),
        className
      )}
    >
      {getAuditActionLabel(action)}
    </span>
  )
}

export { AuditActionBadge }
