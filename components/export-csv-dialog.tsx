"use client"

import { useState, type ReactNode } from "react"
import { useMutation } from "@tanstack/react-query"
import { isAfter } from "date-fns"
import { Download, Loader } from "lucide-react"
import toast from "react-hot-toast"
import { toDate, toIso } from "@/components/bookings/bookings-filters"
import { StayDatePicker } from "@/components/bookings/stay-date-picker"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getApiErrorMessage } from "@/lib/api/errors"
import type { ExportFilters } from "@/lib/api/files"
import { saveBlob } from "@/lib/download"
import { humanizeSlug } from "@/lib/format"

/** Select can't hold "" as an item value, so "every status" uses a sentinel. */
const ALL_STATUSES = "all"

const labelClassName =
  "font-heading text-xs font-semibold tracking-wide text-iron uppercase"
const inputClassName =
  "h-11 rounded-lg border-border bg-canvas px-3.5 text-base focus-visible:border-brand-azure focus-visible:ring-brand-azure/20 md:text-base dark:bg-input/30"

interface ExportCsvDialogProps<T extends object> {
  /** The element that opens the dialog; defaults to an "Export as CSV" button. */
  children?: ReactNode
  /** Plural noun for the copy, e.g. "bookings". */
  noun: string
  description: string
  /**
   * Where each open starts. Called on open rather than passed as a value,
   * so a date default like "this month" is worked out fresh every time.
   */
  initialFilters: () => T
  /** The form's inputs, given the current values and a patch-style setter. */
  renderFields: (
    filters: T,
    update: (patch: Partial<T>) => void,
    disabled: boolean
  ) => ReactNode
  exportFile: (filters: T) => Promise<{
    blob: Blob
    filename: string
  }>
  /** Footer button text; defaults to "Export CSV". */
  submitLabel?: string
}

/**
 * "Export as CSV" button + dialog shared by every CSV export. The dialog
 * collects the filters via `renderFields` (bookings and payments use
 * `ExportStatusDateFields`), then saves whatever `exportFile` downloads.
 */
export function ExportCsvDialog<T extends object>({
  children,
  ...props
}: ExportCsvDialogProps<T>) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button className="h-11 rounded-md bg-brand-azure px-5 text-white hover:bg-brand-azure/90 focus-visible:ring-brand-azure/30">
            <Download aria-hidden="true" />
            Export as CSV
          </Button>
        )}
      </DialogTrigger>
      {/* Mounted only while open so every open starts from `initialFilters`. */}
      {open ? <ExportForm {...props} onDone={() => setOpen(false)} /> : null}
    </Dialog>
  )
}

function ExportForm<T extends object>({
  noun,
  description,
  initialFilters,
  renderFields,
  exportFile,
  submitLabel = "Export CSV",
  onDone,
}: Omit<ExportCsvDialogProps<T>, "children"> & { onDone: () => void }) {
  const [filters, setFilters] = useState(initialFilters)

  function update(patch: Partial<T>) {
    setFilters((current) => ({ ...current, ...patch }))
  }

  const mutation = useMutation({
    mutationFn: () => exportFile(filters),
    onSuccess: ({ blob, filename }) => {
      saveBlob(blob, filename)
      toast.success(`${humanizeSlug(noun)} exported.`)
      onDone()
    },
  })

  return (
    <DialogContent
      showCloseButton={false}
      // Keep the dialog up while the file is still being prepared.
      onEscapeKeyDown={(event) => mutation.isPending && event.preventDefault()}
      onInteractOutside={(event) =>
        mutation.isPending && event.preventDefault()
      }
    >
      <DialogHeader>
        <DialogTitle className="text-xl font-bold">
          Export {noun} as CSV
        </DialogTitle>
        <DialogDescription className="text-base text-muted-foreground">
          {description}
        </DialogDescription>
      </DialogHeader>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          mutation.mutate()
        }}
        noValidate
      >
        <fieldset disabled={mutation.isPending} className="grid gap-4">
          {renderFields(filters, update, mutation.isPending)}

          {mutation.isError ? (
            <p
              role="alert"
              className="rounded-md bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
            >
              {getApiErrorMessage(
                mutation.error,
                `We couldn't export the ${noun}. Try again.`
              )}
            </p>
          ) : null}

          <DialogFooter>
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-full px-5"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              className="h-11 rounded-full bg-brand-azure px-5 text-white hover:bg-brand-azure/90 focus-visible:ring-brand-azure/30"
            >
              {mutation.isPending ? (
                <span className="inline-flex items-center gap-2">
                  <Loader aria-hidden="true" className="animate-spin" />
                  Exporting
                </span>
              ) : (
                <>
                  <Download aria-hidden="true" />
                  {submitLabel}
                </>
              )}
            </Button>
          </DialogFooter>
        </fieldset>
      </form>
    </DialogContent>
  )
}

interface ExportStatusDateFieldsProps {
  /** Status slugs offered in the select, after "All statuses". */
  statuses: readonly string[]
  value: ExportFilters
  onChange: (patch: Partial<ExportFilters>) => void
  disabled: boolean
}

/** Optional status and date range: the bookings and payments exports. */
export function ExportStatusDateFields({
  statuses,
  value,
  onChange,
  disabled,
}: ExportStatusDateFieldsProps) {
  const dateFrom = toDate(value.date_from)
  const dateTo = toDate(value.date_to)

  return (
    <>
      <div className="grid gap-2">
        <Label htmlFor="export-status" className={labelClassName}>
          Status{" "}
          <span className="font-normal text-muted-foreground normal-case">
            (optional)
          </span>
        </Label>
        <Select
          value={value.status || ALL_STATUSES}
          onValueChange={(status) =>
            onChange({ status: status === ALL_STATUSES ? "" : status })
          }
          disabled={disabled}
        >
          <SelectTrigger
            id="export-status"
            className={`${inputClassName} w-full data-[size=default]:h-11`}
          >
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_STATUSES}>All statuses</SelectItem>
            {statuses.map((status) => (
              <SelectItem key={status} value={status}>
                {humanizeSlug(status)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid min-w-0 gap-2">
          <Label htmlFor="export-date-from" className={labelClassName}>
            From{" "}
            <span className="font-normal text-muted-foreground normal-case">
              (optional)
            </span>
          </Label>
          <StayDatePicker
            id="export-date-from"
            value={dateFrom}
            onChange={(date) =>
              onChange({
                date_from: toIso(date),
                // Keep the range valid if "from" jumps past "to".
                ...(date && dateTo && isAfter(date, dateTo)
                  ? { date_to: "" }
                  : {}),
              })
            }
            placeholder="Any date"
            clearLabel="Clear start date"
            disabled={disabled}
            className={inputClassName}
          />
        </div>

        <div className="grid min-w-0 gap-2">
          <Label htmlFor="export-date-to" className={labelClassName}>
            To{" "}
            <span className="font-normal text-muted-foreground normal-case">
              (optional)
            </span>
          </Label>
          <StayDatePicker
            id="export-date-to"
            value={dateTo}
            onChange={(date) => onChange({ date_to: toIso(date) })}
            minDate={dateFrom ?? undefined}
            placeholder="Any date"
            clearLabel="Clear end date"
            disabled={disabled}
            className={inputClassName}
          />
        </div>
      </div>
    </>
  )
}
