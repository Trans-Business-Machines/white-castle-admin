"use client"

import { useMemo, useState } from "react"
import { cn } from "cn"
import { Check, Search } from "lucide-react"

import { Input } from "@/components/ui/input"
import { humanizeSlug } from "@/lib/format"
import type { Permission } from "@/lib/types"

interface PermissionPickerProps {
  permissions: Permission[]
  selected: string[]
  onChange: (next: string[]) => void
  disabled?: boolean
  /** Optional empty-state text while the catalogue is loading. */
  loading?: boolean
}

/**
 * Grouped permission checklist. Used both when creating a role and when
 * editing an existing role's bundle.
 */
export function PermissionPicker({
  permissions,
  selected,
  onChange,
  disabled,
  loading,
}: PermissionPickerProps) {
  const [search, setSearch] = useState("")

  const grouped = useMemo(() => {
    const term = search.trim().toLowerCase()
    const map = new Map<
      string,
      { slug: string; description: string | null }[]
    >()
    for (const permission of permissions) {
      if (
        term &&
        !permission.slug.toLowerCase().includes(term) &&
        !(permission.description ?? "").toLowerCase().includes(term)
      ) {
        continue
      }
      const list = map.get(permission.module) ?? []
      list.push({
        slug: permission.slug,
        description: permission.description,
      })
      map.set(permission.module, list)
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [permissions, search])

  function toggle(slug: string, checked: boolean) {
    onChange(
      checked
        ? selected.includes(slug)
          ? selected
          : [...selected, slug]
        : selected.filter((item) => item !== slug)
    )
  }

  return (
    <div className="grid gap-4">
      <div className="relative">
        <Search
          aria-hidden="true"
          className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search permissions"
          className="h-11 rounded-lg pl-9"
        />
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Loading permissions…
        </p>
      ) : grouped.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No permissions match &quot;{search.trim()}&quot;.
        </p>
      ) : (
        grouped.map(([module, items]) => {
          const allSelected = items.every((item) =>
            selected.includes(item.slug)
          )
          return (
            <section key={module} className="rounded-lg border border-border">
              <header className="flex items-center justify-between gap-3 border-b border-border px-3.5 py-2.5">
                <h3 className="text-sm font-bold text-foreground">
                  {humanizeSlug(module)}
                </h3>
                <button
                  type="button"
                  disabled={disabled}
                  className="text-xs font-semibold text-brand-azure underline-offset-4 hover:underline disabled:opacity-50"
                  onClick={() => {
                    const slugs = items.map((item) => item.slug)
                    const others = selected.filter(
                      (slug) => !slugs.includes(slug)
                    )
                    onChange(
                      allSelected ? others : [...new Set([...others, ...slugs])]
                    )
                  }}
                >
                  {allSelected ? "Clear module" : "Select all"}
                </button>
              </header>
              <div>
                {items.map((item) => {
                  const checked = selected.includes(item.slug)
                  return (
                    <label
                      key={item.slug}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 border-b border-border px-3.5 py-2.5 last:border-b-0",
                        checked ? "bg-brand-azure/5" : "hover:bg-muted/60",
                        disabled && "pointer-events-none opacity-60"
                      )}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={checked}
                        disabled={disabled}
                        onChange={(event) =>
                          toggle(item.slug, event.target.checked)
                        }
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
                        <span className="text-sm font-medium text-foreground">
                          {item.description ?? item.slug}
                        </span>
                        <code className="text-[11px] text-muted-foreground">
                          {item.slug}
                        </code>
                      </span>
                    </label>
                  )
                })}
              </div>
            </section>
          )
        })
      )}
    </div>
  )
}
