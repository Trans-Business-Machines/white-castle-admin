"use client"

import { useState } from "react"
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

interface ExportCsvDialogProps {
  /** Plural noun for the copy, e.g. "bookings". */
  noun: string
  description: string
  /** Status slugs offered in the select, after "All statuses". */
  statuses: readonly string[]
  /**
   * Where each open starts. Called on open rather than passed as a value,
   * so a date default like "this month" is worked out fresh every time.
   */
  initialFilters: () => ExportFilters
  exportFile: (filters: ExportFilters) => Promise<{
    blob: Blob
    filename: string
  }>
}

/**
 * "Export as CSV" button + dialog shared by the bookings and payments
 * pages. The dialog asks for an optional status and date range, then saves
 * whatever `exportFile` downloads with the filters that are set.
 */
export function ExportCsvDialog(props: ExportCsvDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-11 rounded-md bg-brand-azure px-5 text-white hover:bg-brand-azure/90 focus-visible:ring-brand-azure/30">
          <Download aria-hidden="true" />
          Export as CSV
        </Button>
      </DialogTrigger>
      {/* Mounted only while open so every open starts from `initialFilters`. */}
      {open ? <ExportForm {...props} onDone={() => setOpen(false)} /> : null}
    </Dialog>
  )
}

function ExportForm({
  noun,
  description,
  statuses,
  initialFilters,
  exportFile,
  onDone,
}: ExportCsvDialogProps & { onDone: () => void }) {
  const [filters, setFilters] = useState(initialFilters)
  const dateFrom = toDate(filters.date_from)
  const dateTo = toDate(filters.date_to)

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
      className="sm:max-w-md"
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
          <div className="grid gap-2">
            <Label htmlFor="export-status" className={labelClassName}>
              Status{" "}
              <span className="font-normal text-muted-foreground normal-case">
                (optional)
              </span>
            </Label>
            <Select
              value={filters.status || ALL_STATUSES}
              onValueChange={(status) =>
                setFilters({
                  ...filters,
                  status: status === ALL_STATUSES ? "" : status,
                })
              }
              disabled={mutation.isPending}
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
                  setFilters({
                    ...filters,
                    date_from: toIso(date),
                    // Keep the range valid if "from" jumps past "to".
                    date_to:
                      date && dateTo && isAfter(date, dateTo)
                        ? ""
                        : filters.date_to,
                  })
                }
                placeholder="Any date"
                clearLabel="Clear start date"
                disabled={mutation.isPending}
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
                onChange={(date) =>
                  setFilters({ ...filters, date_to: toIso(date) })
                }
                minDate={dateFrom ?? undefined}
                placeholder="Any date"
                clearLabel="Clear end date"
                disabled={mutation.isPending}
                className={inputClassName}
              />
            </div>
          </div>

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
                  Export CSV
                </>
              )}
            </Button>
          </DialogFooter>
        </fieldset>
      </form>
    </DialogContent>
  )
}
