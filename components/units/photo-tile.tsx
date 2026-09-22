"use client"

import { cn } from "@/lib/utils"

interface PhotoTileProps {
  src: string
  alt: string
  /** Accessible name for the corner button, e.g. "Remove photo 2". */
  actionLabel: string
  actionIcon: React.ComponentType<{
    className?: string
    "aria-hidden"?: boolean
  }>
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
        className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-foreground/75 text-background shadow-sm backdrop-blur-xs transition-colors hover:bg-destructive focus-visible:ring-3 focus-visible:ring-brand-azure/40 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40"
      >
        <ActionIcon aria-hidden className="size-3.5" />
      </button>
    </li>
  )
}
