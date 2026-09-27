"use client"

import { FileText } from "lucide-react"
import { cn } from "@/lib/utils"

type TileIcon = React.ComponentType<{
  className?: string
  "aria-hidden"?: boolean
}>

const tileActionClassName =
  "absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-foreground/75 text-background shadow-sm backdrop-blur-xs transition-colors hover:bg-destructive focus-visible:ring-3 focus-visible:ring-brand-azure/40 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40"

interface PhotoTileProps {
  src: string
  alt: string
  /** Accessible name for the corner button, e.g. "Remove photo 2". */
  actionLabel: string
  actionIcon: TileIcon
  onAction: () => void
  disabled?: boolean
  /** Fades the image and shows `caption` — used for photos marked for removal. */
  dimmed?: boolean
  caption?: string
  /** Fired once the browser has decoded the image, or gave up on it. */
  onLoad?: () => void
  onError?: () => void
}

/**
 * One square photo preview with its action button pinned to the top-right
 * corner. Shared by the picked-file previews inside `PhotoDropzone` and the
 * existing-photo list in the edit dialog so both grids read as one. Renders
 * an `<li>`, so it always belongs to a list.
 */
export function PhotoTile({
  src,
  alt,
  actionLabel,
  actionIcon: ActionIcon,
  onAction,
  disabled,
  dimmed,
  caption,
  onLoad,
  onError,
}: PhotoTileProps) {
  return (
    <li className="relative">
      {/* Blob and upstream URLs gain nothing from next/image optimisation. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        onLoad={onLoad}
        onError={onError}
        className={cn(
          "aspect-square w-full rounded-lg bg-canvas object-cover ring-1 ring-foreground/10 transition-opacity dark:bg-input/30",
          dimmed && "opacity-30"
        )}
      />
      {dimmed && caption ? (
        <span className="pointer-events-none absolute inset-x-1 bottom-1 truncate rounded bg-foreground/80 px-1.5 py-0.5 text-center text-[11px] font-semibold text-background">
          {caption}
        </span>
      ) : null}
      <button
        type="button"
        onClick={onAction}
        disabled={disabled}
        aria-label={actionLabel}
        className={tileActionClassName}
      >
        <ActionIcon aria-hidden className="size-3.5" />
      </button>
    </li>
  )
}

/**
 * `PhotoTile`'s counterpart for a file the browser can't preview as an
 * image (a PDF): a document icon and the file name in the same square,
 * with the same corner action.
 */
export function DocumentTile({
  name,
  actionLabel,
  actionIcon: ActionIcon,
  onAction,
  disabled,
}: {
  name: string
  actionLabel: string
  actionIcon: TileIcon
  onAction: () => void
  disabled?: boolean
}) {
  return (
    <li className="relative">
      <div className="flex aspect-square w-full flex-col items-center justify-center gap-1.5 rounded-lg bg-canvas px-2 text-center ring-1 ring-foreground/10 dark:bg-input/30">
        <FileText aria-hidden="true" className="size-7 text-brand-azure" />
        <span className="line-clamp-2 text-[11px] leading-tight break-all text-muted-foreground">
          {name}
        </span>
      </div>
      <button
        type="button"
        onClick={onAction}
        disabled={disabled}
        aria-label={actionLabel}
        className={tileActionClassName}
      >
        <ActionIcon aria-hidden className="size-3.5" />
      </button>
    </li>
  )
}
