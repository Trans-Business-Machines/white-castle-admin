"use client"

import { useState } from "react"
import { Check, Copy, RefreshCw } from "lucide-react"
import type { UseFormRegisterReturn } from "react-hook-form"
import toast from "react-hot-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export const labelClassName =
  "font-ibm-plex text-xs text-iron font-semibold tracking-wide uppercase"
export const inputClassName =
  "h-11 rounded-lg border-border bg-canvas px-3.5 text-base focus-visible:border-brand-azure focus-visible:ring-brand-azure/20 md:text-base dark:bg-input/30"

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} className="text-sm text-destructive">
      {message}
    </p>
  )
}

interface TemporaryPasswordFieldProps {
  id: string
  label: string
  /** Current value, used for copying. */
  value: string
  registration: UseFormRegisterReturn
  error?: string
  onRegenerate: () => void
}

/**
 * Read-only generated password with copy + regenerate buttons. The value
 * comes from `generatePassword()` in `lib/password.ts`, so it always
 * satisfies `passwordSchema`.
 */
export function TemporaryPasswordField({
  id,
  label,
  value,
  registration,
  error,
  onRegenerate,
}: TemporaryPasswordFieldProps) {
  // Tracking the copied value (not a boolean) resets the tick on regenerate.
  const [copiedValue, setCopiedValue] = useState<string | null>(null)
  const copied = Boolean(value) && copiedValue === value
  const errorId = `${id}-error`

  async function copyPassword() {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedValue(value)
      toast.success("Temporary password copied.")
    } catch {
      toast.error("Couldn't copy. Select the password and copy it manually.")
    }
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor={id} className={labelClassName}>
        {label}
      </Label>
      <div className="flex gap-2">
        <Input
          id={id}
          readOnly
          autoComplete="off"
          spellCheck={false}
          className={`${inputClassName} font-mono tracking-wide`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          onFocus={(event) => event.currentTarget.select()}
          {...registration}
        />
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          className="size-11 shrink-0 rounded-lg"
          onClick={copyPassword}
          aria-label="Copy temporary password"
        >
          {copied ? (
            <Check aria-hidden="true" className="text-emerald-600" />
          ) : (
            <Copy aria-hidden="true" />
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          className="size-11 shrink-0 rounded-lg"
          onClick={onRegenerate}
          aria-label="Generate a new temporary password"
        >
          <RefreshCw aria-hidden="true" />
        </Button>
      </div>
      <FieldError id={errorId} message={error} />
    </div>
  )
}
