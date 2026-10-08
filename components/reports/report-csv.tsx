"use client"

import type { ComponentProps } from "react"
import { useMutation } from "@tanstack/react-query"
import { cn } from "cn"
import { Download, Loader } from "lucide-react"
import toast from "react-hot-toast"
import { Button } from "@/components/ui/button"
import { getApiErrorMessage } from "@/lib/api/errors"
import { saveBlob } from "@/lib/download"
import { humanizeSlug } from "@/lib/format"

interface DownloadCsvButtonProps extends ComponentProps<typeof Button> {
  /** Shows a spinner and "Downloading" while the file is being prepared. */
  pending?: boolean
}

/** "Download CSV" CTA: the report cards' export trigger and the report pages' download. */
export function DownloadCsvButton({
  pending = false,
  className,
  disabled,
  ...props
}: DownloadCsvButtonProps) {
  return (
    <Button
      type="button"
      className={cn(
        "rounded-md bg-brand-azure px-4 text-white hover:bg-brand-azure/90 focus-visible:ring-brand-azure/30",
        className
      )}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      {...props}
    >
      {pending ? (
        <Loader aria-hidden="true" className="animate-spin" />
      ) : (
        <Download aria-hidden="true" />
      )}
      {pending ? "Downloading" : "Download CSV"}
    </Button>
  )
}

interface ReportCsvDownloadProps<T extends object> {
  /** The report's applied filters, sent as-is. */
  filters: T
  /** Lower-case name for the copy, e.g. "bookings report". */
  noun: string
  exportFile: (filters: T) => Promise<{ blob: Blob; filename: string }>
}

/**
 * A report page's Download CSV: no dialog, it exports with the filters
 * already in the URL. Failures surface as a toast since there's no form.
 */
export function ReportCsvDownload<T extends object>({
  filters,
  noun,
  exportFile,
}: ReportCsvDownloadProps<T>) {
  const mutation = useMutation({
    mutationFn: () => exportFile(filters),
    onSuccess: ({ blob, filename }) => {
      saveBlob(blob, filename)
      toast.success(`${humanizeSlug(noun)} downloaded.`)
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          `We couldn't download the ${noun}. Try again.`
        )
      )
    },
  })

  return (
    <DownloadCsvButton
      className="h-11 px-5"
      pending={mutation.isPending}
      onClick={() => mutation.mutate()}
    />
  )
}
