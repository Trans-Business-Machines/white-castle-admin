"use client"

import { useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { FileChartColumn } from "lucide-react"
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
import { getReportHref, type ReportSlug } from "@/lib/reports"

interface ReportParamsDialogProps<T extends object> {
  /** The element that opens the dialog, e.g. the card's Generate report CTA. */
  children: ReactNode
  /** The report the form opens: `/reports/<slug>?…`. */
  slug: ReportSlug
  title: string
  description: string
  /** Where each open starts; a report page passes its current filters. */
  initialValues: T
  /** The form's inputs, given the current values and a patch-style setter. */
  renderFields: (values: T, update: (patch: Partial<T>) => void) => ReactNode
}

/**
 * Shell shared by every report's parameters dialog: collects the values
 * via `renderFields`, then opens the report page with them in the URL
 * (empty ones left out), where the report itself is fetched.
 */
export function ReportParamsDialog<T extends object>({
  children,
  ...props
}: ReportParamsDialogProps<T>) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      {/* Mounted only while open so every open starts from `initialValues`. */}
      {open ? (
        <ReportParamsForm {...props} onDone={() => setOpen(false)} />
      ) : null}
    </Dialog>
  )
}

function ReportParamsForm<T extends object>({
  slug,
  title,
  description,
  initialValues,
  renderFields,
  onDone,
}: Omit<ReportParamsDialogProps<T>, "children"> & { onDone: () => void }) {
  const router = useRouter()
  const [values, setValues] = useState(initialValues)

  function update(patch: Partial<T>) {
    setValues((current) => ({ ...current, ...patch }))
  }

  return (
    <DialogContent className="max-h-[90dvh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
        <DialogDescription className="text-base text-muted-foreground">
          {description}
        </DialogDescription>
      </DialogHeader>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          router.push(getReportHref(slug, values))
          onDone()
        }}
        noValidate
        className="grid gap-4"
      >
        {renderFields(values, update)}

        <DialogFooter className="mt-2">
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
            <FileChartColumn aria-hidden="true" />
            Generate report
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}
