"use client"

import { useState, type ReactNode } from "react"
import { FilterX, ListFilter } from "lucide-react"
import {
  inputClassName,
  labelClassName,
} from "@/components/bookings/booking-form-fields"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface AuditFilterBarProps<T extends object> {
  /** The filters the table is showing (from the URL); seeds the draft. */
  applied: T
  /** Where Clear filters goes back to. */
  defaults: T
  onApply: (filters: T) => void
  /** The inputs, given the draft and a patch-style setter. */
  renderFields: (draft: T, update: (patch: Partial<T>) => void) => ReactNode
}

const isSame = (a: object, b: object) => JSON.stringify(a) === JSON.stringify(b)

/** Every text value trimmed, so a stray space in a field isn't searched. */
function trimValues<T extends object>(filters: T) {
  return Object.fromEntries(
    Object.entries(filters).map(([key, value]) => [
      key,
      typeof value === "string" ? value.trim() : value,
    ])
  ) as T
}

/**
 * Filter card shared by the audit logs. Edits stay in a local draft until
 * Apply filters (or Enter) sends them; Clear filters goes back to
 * `defaults` straight away. Parents remount it with a `key` when the
 * applied filters change, so the draft re-seeds from them.
 */
export function AuditFilterBar<T extends object>({
  applied,
  defaults,
  onApply,
  renderFields,
}: AuditFilterBarProps<T>) {
  const [draft, setDraft] = useState(applied)

  function update(patch: Partial<T>) {
    setDraft((current) => ({ ...current, ...patch }))
  }

  function handleClear() {
    setDraft(defaults)
    onApply(defaults)
  }

  return (
    <form
      aria-label="Audit log filters"
      onSubmit={(event) => {
        event.preventDefault()
        onApply(trimValues(draft))
      }}
      noValidate
      className="rounded-xl bg-card p-4 shadow-sm ring-1 ring-foreground/10"
    >
      {renderFields(draft, update)}

      <div className="mt-4 flex flex-wrap justify-end gap-3">
        <Button
          type="button"
          onClick={handleClear}
          disabled={isSame(draft, defaults) && isSame(applied, defaults)}
          className="h-11 rounded-md bg-rose-600 px-5 text-white hover:bg-rose-700 focus-visible:ring-rose-600/30"
        >
          <FilterX aria-hidden="true" />
          Clear filters
        </Button>
        <Button
          type="submit"
          className="h-11 rounded-md bg-brand-azure px-5 text-white hover:bg-brand-azure/90 focus-visible:ring-brand-azure/30"
        >
          <ListFilter aria-hidden="true" />
          Apply filters
        </Button>
      </div>
    </form>
  )
}

/** Free-text username filter, used by both audit logs. */
export function AuditUsernameField({
  id,
  value,
  onChange,
}: {
  id: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="grid min-w-0 gap-2">
      <Label htmlFor={id} className={labelClassName}>
        Username
      </Label>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Any user"
        autoComplete="off"
        spellCheck={false}
        className={inputClassName}
      />
    </div>
  )
}
