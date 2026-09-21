"use client"

import { useEffect, useMemo, useRef, useState, type DragEvent } from "react"
import { cn } from "@/lib/utils"
import { ImagePlus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatBytes } from "@/lib/format"
import { getRoomPhotoError, ROOM_PHOTO_TYPES } from "@/lib/schemas/units"

interface PhotoDropzoneProps {
  id: string
  value: File | null
  onChange: (file: File | null) => void
  onReject: (message: string) => void
  disabled?: boolean
  invalid?: boolean
  describedBy?: string
}

/**
 * Single-image picker: click or drag a file in, see a preview, clear it.
 * Type and size rules live in `lib/schemas/units.ts` so the form's zod
 * schema and this picker can't drift apart.
 */
export function PhotoDropzone({
  id,
  value,
  onChange,
  onReject,
  disabled,
  invalid,
  describedBy,
}: PhotoDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const preview = useMemo(
    () => (value ? URL.createObjectURL(value) : null),
    [value]
  )

  // Object URLs leak until revoked. This cleanup runs whenever the preview
  // is replaced, when the parent form resets `value` to null (e.g. after a
  // successful save), and when the dialog unmounts the dropzone.
  useEffect(() => {
    if (!preview) return
    return () => URL.revokeObjectURL(preview)
  }, [preview])

  // When the value is cleared from outside (form reset), clear the native
  // input too; otherwise re-picking the same file wouldn't fire `change`.
  useEffect(() => {
    if (!value && inputRef.current) inputRef.current.value = ""
  }, [value])

  function accept(files: FileList | null) {
    const file = files?.[0]
    if (!file) return
    const message = getRoomPhotoError(file)
    if (message) {
      onReject(message)
      return
    }
    onChange(file)
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    if (disabled) return
    accept(event.dataTransfer.files)
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    if (!disabled) setDragging(true)
  }

  function clear() {
    onChange(null)
  }

  return (
    <div className="grid gap-2">
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={ROOM_PHOTO_TYPES.join(",")}
        className="sr-only"
        disabled={disabled}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        onChange={(event) => accept(event.target.files)}
      />

      {value && preview ? (
        <div className="flex items-center gap-4 rounded-lg border border-border bg-canvas p-3 dark:bg-input/30">
          {/* Blob URLs gain nothing from next/image optimisation. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt=""
            className="size-20 shrink-0 rounded-md object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{value.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatBytes(value.size)}
            </p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={disabled}
              className="mt-1 text-sm font-semibold text-brand-azure underline-offset-4 hover:underline disabled:opacity-50"
            >
              Choose a different image
            </button>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={clear}
            disabled={disabled}
            aria-label="Remove image"
            className="shrink-0"
          >
            <X aria-hidden="true" />
          </Button>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-disabled={disabled}
          onClick={() => !disabled && inputRef.current?.click()}
          onKeyDown={(event) => {
            if (disabled) return
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
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-canvas px-4 py-8 text-center transition-colors outline-none focus-visible:border-brand-azure focus-visible:ring-3 focus-visible:ring-brand-azure/20 dark:bg-input/30",
            dragging && "border-brand-azure bg-brand-azure/5",
            invalid && "border-destructive",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-brand-azure/10 text-brand-azure">
            <ImagePlus aria-hidden="true" className="size-5" />
          </span>
          <p className="text-sm">
            <span className="font-semibold text-brand-azure">
              Click to upload
            </span>{" "}
            or drag and drop
          </p>
          <p className="text-xs text-muted-foreground">
            JPEG, PNG or WebP, up to 5 MB
          </p>
        </div>
      )}
    </div>
  )
}
