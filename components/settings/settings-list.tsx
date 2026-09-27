"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { cn } from "cn"
import { SquarePen } from "lucide-react"
import { ReportError } from "@/components/dashboard/report-state"
import { EditSettingDialog } from "@/components/settings/edit-setting-dialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchSettings, settingsQueryKey } from "@/lib/api/settings"
import { formatDate, formatTimestamp } from "@/lib/format"
import {
  formatSettingValue,
  getSettingLabel,
  groupSettings,
  type SettingCategory,
} from "@/lib/settings"
import type { MotelSetting } from "@/lib/types"

/** One surface per section: its header on top, rows beneath. */
const sectionClassName =
  "overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-foreground/10"

/** Section titles are brand navy; dark mode falls back to the foreground. */
const primaryText = "text-slate-900 dark:text-foreground"

/** Setting labels and values; dark mode falls back to the foreground. */
const rowText = "text-slate-900 dark:text-foreground"

/**
 * Every motel setting from `GET /motel/settings`, split into sections
 * (`groupSettings`) with one row per setting.
 */
export function SettingsList() {
  const settings = useQuery({
    queryKey: settingsQueryKey,
    queryFn: fetchSettings,
  })

  if (settings.isPending) return <SettingsSkeleton />

  if (settings.isError) {
    return (
      <div className={cn(sectionClassName, "px-5 py-6")}>
        <ReportError
          message="We couldn't load the settings."
          onRetry={() => settings.refetch()}
        />
      </div>
    )
  }

  if (settings.data.length === 0) {
    return (
      <p
        className={cn(
          sectionClassName,
          "px-5 py-6 text-sm text-muted-foreground"
        )}
      >
        No settings have been configured yet.
      </p>
    )
  }

  return (
    <div className="grid gap-6">
      {groupSettings(settings.data).map(({ category, settings: rows }) => (
        <SettingsSection key={category.id} category={category} rows={rows} />
      ))}
    </div>
  )
}

function SettingsSection({
  category,
  rows,
}: {
  category: SettingCategory
  rows: MotelSetting[]
}) {
  const Icon = category.icon
  const headingId = `settings-${category.id}`

  return (
    <section aria-labelledby={headingId} className={sectionClassName}>
      <header className="flex items-center gap-3.5 border-b border-border bg-muted/40 px-5 py-4">
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-black/10 text-brand-navy dark:bg-muted dark:text-foreground"
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <h2
            id={headingId}
            className={cn("font-heading text-base font-bold", primaryText)}
          >
            {category.title}
          </h2>
          <p className="text-sm text-pretty text-muted-foreground">
            {category.summary}
          </p>
        </div>
      </header>

      <ul className="divide-y divide-border">
        {rows.map((setting) => (
          <SettingRow key={setting.key} setting={setting} />
        ))}
      </ul>
    </section>
  )
}

function SettingRow({ setting }: { setting: MotelSetting }) {
  const [editing, setEditing] = useState(false)
  const label = getSettingLabel(setting.key)
  const value = formatSettingValue(setting)

  return (
    <li className="grid gap-x-8 gap-y-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="min-w-0">
        <h3
          className={cn("font-heading text-[0.9375rem] font-semibold", rowText)}
        >
          {label}
        </h3>
        <p className="mt-0.5 max-w-prose text-sm text-pretty text-muted-foreground">
          {setting.description}
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 sm:justify-end">
        <div className="min-w-0 sm:max-w-72 sm:text-right">
          {value ? (
            <p
              className={cn(
                "text-base font-semibold wrap-break-word tabular-nums",
                rowText
              )}
            >
              {value}
            </p>
          ) : (
            // Dashed outline and wording carry "unset", not colour alone.
            <p className="inline-flex rounded-md border border-dashed border-foreground/25 px-2 py-0.5 text-sm font-medium text-muted-foreground">
              Not set
            </p>
          )}
          <p className="mt-0.5 text-xs text-muted-foreground">
            Updated{" "}
            <time
              dateTime={setting.updated_at}
              title={formatTimestamp(setting.updated_at)}
            >
              {formatDate(setting.updated_at)}
            </time>
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setEditing(true)}
          aria-label={`Edit ${label}`}
          className="shrink-0 rounded-md"
        >
          <SquarePen aria-hidden="true" />
          Edit
        </Button>
      </div>

      <EditSettingDialog
        setting={setting}
        open={editing}
        onOpenChange={setEditing}
      />
    </li>
  )
}

/** Mirrors the sectioned layout so nothing jumps when the data lands. */
function SettingsSkeleton() {
  return (
    <div className="grid gap-6" aria-label="Loading settings">
      {[3, 2, 2].map((rowCount, section) => (
        <div key={section} className={sectionClassName}>
          <div className="flex items-center gap-3.5 border-b border-border bg-muted/50 px-5 py-4">
            <Skeleton className="size-10 shrink-0 rounded-lg" />
            <div className="grid gap-2">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-3.5 w-56 rounded" />
            </div>
          </div>
          <div className="divide-y divide-border">
            {Array.from({ length: rowCount }, (_, row) => (
              <div
                key={row}
                className="flex items-center justify-between gap-8 px-5 py-4"
              >
                <div className="grid flex-1 gap-2">
                  <Skeleton className="h-4 w-44 rounded" />
                  <Skeleton className="h-3.5 w-full max-w-sm rounded" />
                </div>
                <Skeleton className="h-8 w-28 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
