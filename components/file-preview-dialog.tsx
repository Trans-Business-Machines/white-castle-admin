"use client"

import { useState, type ReactNode } from "react"
import { useQuery, type QueryKey } from "@tanstack/react-query"
import { ExternalLink, Loader } from "lucide-react"
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
import { getApiErrorMessage } from "@/lib/api/errors"
import type { SignedFile } from "@/lib/types"

/** Refetch a signed URL this long before it expires. */
const EXPIRY_MARGIN_SECONDS = 60

interface FilePreviewDialogProps {
  /** Label of the trigger, rendered as an azure text link. */
  triggerLabel: string
  /** Accessible name for the trigger when `triggerLabel` alone is vague. */
  triggerAriaLabel?: string
  title: string
  description: ReactNode
  queryKey: QueryKey
  /** Trades the file id for a signed URL through `axiosInstance`. */
  queryFn: () => Promise<SignedFile>
  /** Alt text when the file is an image, title when it's a PDF. */
  alt: string
  errorMessage: string
}

/**
 * A text-link trigger that opens an uploaded file (image or PDF) in a
 * dialog. The file endpoints sit behind the bearer token and answer with a
 * short-lived signed storage URL (`SignedFile`), so `queryFn` runs only
 * while the dialog is open, and its result is cached until a minute before
 * `expires_in`. The URL is shown directly and offered in a new tab. Used
 * for payment proof and guest ID documents.
 */
function FilePreviewDialog({
  triggerLabel,
  triggerAriaLabel,
  title,
  description,
  ...body
}: FilePreviewDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={triggerAriaLabel}
          className="font-semibold text-brand-azure underline underline-offset-4"
        >
          {triggerLabel}
        </button>
      </DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            {description}
          </DialogDescription>
        </DialogHeader>
        {open ? <PreviewBody {...body} /> : null}
      </DialogContent>
    </Dialog>
  )
}

function PreviewBody({
  queryKey,
  queryFn,
  alt,
  errorMessage,
}: Pick<
  FilePreviewDialogProps,
  "queryKey" | "queryFn" | "alt" | "errorMessage"
>) {
  const file = useQuery({
    queryKey,
    queryFn,
    staleTime: (query) => {
      const expiresIn = query.state.data?.expires_in ?? 0
      return Math.max(0, expiresIn - EXPIRY_MARGIN_SECONDS) * 1000
    },
  })
  // A cached URL past its window may already be dead; wait for the refetch
  // rather than flash a broken image.
  const data = file.isStale ? undefined : file.data

  return (
    <>
      <div className="flex min-h-64 items-center justify-center overflow-hidden rounded-lg border bg-muted/40">
        {file.isError ? (
          <div role="alert" className="grid justify-items-center gap-3 p-6">
            <p className="text-center text-sm text-destructive">
              {getApiErrorMessage(file.error, errorMessage)}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => file.refetch()}
            >
              Retry
            </Button>
          </div>
        ) : !data ? (
          <Loader
            aria-label="Loading the file"
            className="size-6 animate-spin text-muted-foreground"
          />
        ) : isPdfName(data.filename) ? (
          <iframe src={data.url} title={alt} className="h-[70vh] w-full" />
        ) : (
          // A signed storage URL, not a configured next/image host.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.url}
            alt={alt}
            className="max-h-[70vh] w-full object-contain"
          />
        )}
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-full px-5"
          >
            Close
          </Button>
        </DialogClose>
        {data ? (
          // A cross-origin link ignores `download`, so open it instead.
          <Button asChild className={primaryButtonClassName}>
            <a href={data.url} target="_blank" rel="noreferrer">
              <ExternalLink aria-hidden="true" />
              Open in new tab
            </a>
          </Button>
        ) : (
          <Button type="button" disabled className={primaryButtonClassName}>
            <ExternalLink aria-hidden="true" />
            Open in new tab
          </Button>
        )}
      </DialogFooter>
    </>
  )
}

const primaryButtonClassName =
  "h-11 rounded-full bg-brand-azure px-5 text-white hover:bg-brand-azure/90 focus-visible:ring-brand-azure/30"

function isPdfName(filename: string) {
  return filename.toLowerCase().endsWith(".pdf")
}

export { FilePreviewDialog }
