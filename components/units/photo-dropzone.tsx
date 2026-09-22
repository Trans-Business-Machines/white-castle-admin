"use client"

import { useMemo, useRef, useState, type DragEvent } from "react"
import { cn } from "@/lib/utils"
import { ImagePlus, X } from "lucide-react"
import { PhotoTile } from "@/components/units/photo-tile"
import {
  getPhotoKey,
  getRoomPhotoError,
  MAX_ROOM_PHOTOS,
  ROOM_PHOTO_TYPES,
} from "@/lib/schemas/units"

/** Shared grid for the existing-photo and picked-photo lists. */
export const photoGridClassName =
  "grid grid-cols-[repeat(auto-fill,minmax(88px,1fr))] gap-3"

interface PhotoDropzoneProps {
  id: string
  value: File[]
  onChange: (files: File[]) => void
  onReject: (message: string) => void
  /** How many more photos may be picked, with any existing ones deducted. */
  remaining: number
  disabled?: boolean
  invalid?: boolean
  describedBy?: string
  /** Accepted MIME types; defaults to the room-photo list. */
  accept?: readonly string[]
  /** Returns a message when a file can't be uploaded, or null when it can. */
  validate?: (file: File) => string | null
  /** Line under the call to action describing the file rules. */
  hint?: string
  /** Shown in place of the call to action once `remaining` hits 0. */
  fullMessage?: string
  /** Explains how many files a pick had to drop to stay within `remaining`. */
  overflowMessage?: (count: number) => string
}

/**
 * One picked file's preview. It owns its object URL, so adding or removing a
 * photo never disturbs the tiles already on screen.
 */
function PickedPhoto({
  file,
  index,
  onRemove,
  disabled,
}: {
  file: File
  index: number
  onRemove: () => void
  disabled?: boolean
}) {
  const url = useMemo(() => URL.createObjectURL(file), [file])
  const released = useRef(false)

  /**
   * Object URLs leak until revoked, but revoking on unmount is a trap here:
   * in development React's StrictMode runs an extra mount → unmount → mount
   * cycle *without* re-running the memo, so the cleanup would free a URL the
   * `<img>` is still pointing at and every preview would break. Releasing it
   * once the browser has decoded the image is safe — the decoded bitmap
   * outlives the URL — and frees the memory sooner than unmount would.
   */
  function release() {
    if (released.current) return
    released.current = true
    URL.revokeObjectURL(url)
  }

  return (
    <PhotoTile
      src={url}
      alt={`New photo ${index + 1}`}
      actionLabel={`Remove ${file.name}`}
      actionIcon={X}
      onAction={onRemove}
      onLoad={release}
      onError={release}
      disabled={disabled}
    />
  )
}

/**
 * Multi-image picker: click or drag files in, see every one previewed, drop
 * any of them with the X in its corner. Type and size rules live in
 * `lib/schemas/units.ts` so the form's zod schema and this picker can't
 * drift apart; the ten-photo cap is passed in as `remaining` because the
 * edit dialog has to count the room's existing photos too.
 */
export function PhotoDropzone({
  id,
  value,
  onChange,
  onReject,
  remaining,
  disabled,
  invalid,
  describedBy,
  accept: acceptedTypes = ROOM_PHOTO_TYPES,
  validate = getRoomPhotoError,
  hint = `JPG, PNG or WebP, up to 2 MB each — ${remaining} more ${
    remaining === 1 ? "photo" : "photos"
  } can be added`,
  fullMessage = `This room already has ${MAX_ROOM_PHOTOS} photos. Remove one to add another.`,
  overflowMessage = (count) =>
    `A room can have at most ${MAX_ROOM_PHOTOS} photos, so ${count} ${
      count === 1 ? "image was" : "images were"
    } left out.`,
}: PhotoDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const full = remaining <= 0
  const locked = Boolean(disabled) || full

  function accept(files: FileList | null) {
    // Copy the list out before touching the input below: a file input's
    // `files` is live, so clearing the input would empty this list too.
    const picked = files ? Array.from(files) : []
    // Clear the native input, otherwise re-picking a file that was just
    // removed wouldn't fire `change`.
    if (inputRef.current) inputRef.current.value = ""
    if (picked.length === 0) return

    const seen = new Set(value.map(getPhotoKey))
    const accepted: File[] = []
    const problems: string[] = []
    let overflow = 0

    for (const file of picked) {
      const message = validate(file)
      if (message) {
        problems.push(`${file.name}: ${message}`)
        continue
      }
      const key = getPhotoKey(file)
      // Silently skip a file that's already in the list — re-picking it is a
      // no-op, not a mistake worth an error message.
      if (seen.has(key)) continue
      if (accepted.length >= remaining) {
        overflow += 1
        continue
      }
      seen.add(key)
      accepted.push(file)
    }

    if (overflow > 0) problems.push(overflowMessage(overflow))
    if (accepted.length > 0) onChange([...value, ...accepted])
    if (problems.length > 0) onReject(problems.join(" "))
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    if (locked) return
    accept(event.dataTransfer.files)
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    if (!locked) setDragging(true)
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div className="grid gap-3">
      <input
        ref={inputRef}
        id={id}
        type="file"
        multiple
        accept={acceptedTypes.join(",")}
        className="sr-only"
        disabled={locked}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        onChange={(event) => accept(event.target.files)}
      />

      <div
        role="button"
        tabIndex={locked ? -1 : 0}
        aria-disabled={locked}
        onClick={() => !locked && inputRef.current?.click()}
        onKeyDown={(event) => {
          if (locked) return
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-canvas px-4 py-8 text-center transition-colors outline-none focus-visible:border-brand-azure focus-visible:ring-3 focus-visible:ring-brand-azure/20 dark:bg-input/30",
          locked ? "cursor-not-allowed" : "cursor-pointer",
          dragging && "border-brand-azure bg-brand-azure/5",
          invalid && "border-destructive",
          disabled && "opacity-50"
        )}
      >
        <span className="flex size-10 items-center justify-center rounded-full bg-brand-azure/10 text-brand-azure">
          <ImagePlus aria-hidden="true" className="size-5" />
        </span>
        {full ? (
          <p className="text-sm text-muted-foreground">{fullMessage}</p>
        ) : (
          <>
            <p className="text-sm">
              <span className="font-semibold text-brand-azure">
                Click to upload
              </span>{" "}
              or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">{hint}</p>
          </>
        )}
      </div>

      {value.length > 0 ? (
        <ul className={photoGridClassName} aria-label="Photos to upload">
          {value.map((file, index) => (
            <PickedPhoto
              key={getPhotoKey(file)}
              file={file}
              index={index}
              disabled={disabled}
              onRemove={() => removeAt(index)}
            />
          ))}
        </ul>
      ) : null}
    </div>
  )
}
