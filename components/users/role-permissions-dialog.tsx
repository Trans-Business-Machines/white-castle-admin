"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { cn } from "cn"
import { Check, Loader, Search } from "lucide-react"
import toast from "react-hot-toast"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { getApiErrorMessage } from "@/lib/api/errors"
import {
  fetchPermissions,
  fetchRolePermissions,
  permissionsQueryKey,
  rolePermissionsQueryKey,
  rolesQueryKey,
  updateRolePermissions,
} from "@/lib/api/roles"
import type { Role } from "@/lib/types"
import { humanizeSlug } from "@/lib/format"

interface Props {
  role: Role | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Editor for a role's permission bundle, grouped by module. */
export function RolePermissionsDialog({ role, open, onOpenChange }: Props) {
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState<{
    key: string
    slugs: string[]
  } | null>(null)
  const [search, setSearch] = useState("")

  const permissions = useQuery({
    queryKey: permissionsQueryKey,
    queryFn: fetchPermissions,
    enabled: open,
  })

  const current = useQuery({
    queryKey: role ? rolePermissionsQueryKey(role.name) : ["roles", "none"],
    queryFn: () => fetchRolePermissions(role!.name),
    enabled: open && Boolean(role),
  })

  const savedSlugs = useMemo(
    () => current.data?.map((permission) => permission.slug) ?? [],
    [current.data]
  )
  // The loaded bundle seeds the editor; once the manager ticks a box we
  // keep their draft until the dialog closes or another role loads.
  const selectionKey = `${role?.name ?? ""}:${current.dataUpdatedAt}`
  const selected = draft?.key === selectionKey ? draft.slugs : savedSlugs

  function setSelected(next: string[] | ((current: string[]) => string[])) {
    setDraft((previous) => {
      const base = previous?.key === selectionKey ? previous.slugs : savedSlugs
      return {
        key: selectionKey,
        slugs: typeof next === "function" ? next(base) : next,
      }
    })
  }

  const grouped = useMemo(() => {
    const term = search.trim().toLowerCase()
    const map = new Map<
      string,
      { slug: string; description: string | null }[]
    >()
    for (const permission of permissions.data ?? []) {
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
  }, [permissions.data, search])

  const mutation = useMutation({
    mutationFn: (slugs: string[]) => updateRolePermissions(role!.name, slugs),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: rolesQueryKey })
      if (role) {
        await queryClient.invalidateQueries({
          queryKey: rolePermissionsQueryKey(role.name),
        })
      }
      toast.success(`${role?.label ?? "Role"} permissions saved.`)
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, "We couldn't save these permissions.")
      )
    },
  })

  function toggle(slug: string, checked: boolean) {
    setSelected((list) =>
      checked
        ? list.includes(slug)
          ? list
          : [...list, slug]
        : list.filter((item) => item !== slug)
    )
  }

  const disabled =
    mutation.isPending || permissions.isPending || current.isPending

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (mutation.isPending) return
        if (!next) {
          setDraft(null)
          setSearch("")
        }
        onOpenChange(next)
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {role?.label ?? "Role"} permissions
          </DialogTitle>
          <DialogDescription>
            Choose what this role can do. Users with several roles get the union
            of every selected permission.
          </DialogDescription>
        </DialogHeader>

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

        {permissions.isPending || current.isPending ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Loading permissions…
          </p>
        ) : permissions.isError || current.isError ? (
          <p className="flex items-center justify-center gap-2 py-8 text-sm text-destructive">
            We couldn&apos;t load permissions.
            <button
              type="button"
              onClick={() => {
                permissions.refetch()
                current.refetch()
              }}
              className="font-semibold underline underline-offset-4"
            >
              Retry
            </button>
          </p>
        ) : (
          <div className="grid gap-4">
            {grouped.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No permissions match &quot;{search.trim()}&quot;.
              </p>
            ) : (
              grouped.map(([module, items]) => {
                const allSelected = items.every((item) =>
                  selected.includes(item.slug)
                )
                return (
                  <section
                    key={module}
                    className="rounded-lg border border-border"
                  >
                    <header className="flex items-center justify-between gap-3 border-b border-border px-3.5 py-2.5">
                      <h3 className="text-sm font-bold text-foreground">
                        {humanizeSlug(module)}
                      </h3>
                      <button
                        type="button"
                        className="text-xs font-semibold text-brand-azure underline-offset-4 hover:underline"
                        onClick={() =>
                          setSelected((list) => {
                            const others = list.filter(
                              (slug) =>
                                !items.some((item) => item.slug === slug)
                            )
                            return allSelected
                              ? others
                              : [...others, ...items.map((item) => item.slug)]
                          })
                        }
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
                              checked
                                ? "bg-brand-azure/5"
                                : "hover:bg-muted/60",
                              disabled && "pointer-events-none opacity-60"
                            )}
                          >
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={checked}
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
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-full px-5"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => mutation.mutate(selected)}
            disabled={disabled}
            className="h-11 rounded-full bg-brand-azure px-5 text-white hover:bg-brand-azure/90 focus-visible:ring-brand-azure/30"
          >
            {mutation.isPending ? (
              <span className="inline-flex items-center gap-2">
                <Loader aria-hidden="true" className="animate-spin" />
                Saving
              </span>
            ) : (
              "Save permissions"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
