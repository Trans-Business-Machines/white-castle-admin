"use client"

import { cn } from "cn"
import { Check } from "lucide-react"
import type { Role } from "@/lib/types"

interface RoleMultiSelectProps {
  roles: Role[]
  value: string[]
  onChange: (next: string[]) => void
  disabled?: boolean
  /** Optional id prefix so labels stay unique across dialogs. */
  idPrefix?: string
}

/**
 * Check-list of every role defined by the backend. A user may hold several
 * roles; their effective access is the union of those roles' permissions.
 */
export function RoleMultiSelect({
  roles,
  value,
  onChange,
  disabled,
  idPrefix = "role",
}: RoleMultiSelectProps) {
  function toggle(name: string, checked: boolean) {
    if (checked) {
      onChange(value.includes(name) ? value : [...value, name])
    } else {
      onChange(value.filter((role) => role !== name))
    }
  }

  return (
    <div className="max-h-64 overflow-y-auto rounded-lg border border-border bg-background">
      {roles.map((role) => {
        const id = `${idPrefix}-${role.name}`
        const checked = value.includes(role.name)
        return (
          <label
            key={role.name}
            htmlFor={id}
            className={cn(
              "flex cursor-pointer items-start gap-3 px-3.5 py-3 transition-colors",
              "border-b border-border last:border-b-0",
              checked ? "bg-brand-azure/5" : "hover:bg-muted/60",
              disabled && "pointer-events-none opacity-60"
            )}
          >
            <input
              id={id}
              type="checkbox"
              className="sr-only"
              checked={checked}
              disabled={disabled}
              onChange={(event) => toggle(role.name, event.target.checked)}
            />
            <span
              aria-hidden="true"
              className={cn(
                "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border transition-colors",
                checked
                  ? "border-brand-azure bg-brand-azure text-white"
                  : "border-border bg-background"
              )}
            >
              {checked ? <Check className="size-3.5" /> : null}
            </span>
            <span className="grid gap-0.5">
              <span className="text-sm font-semibold text-foreground">
                {role.label}
              </span>
              <span className="text-xs text-muted-foreground">
                {role.description || role.name}
              </span>
            </span>
          </label>
        )
      })}
    </div>
  )
}
