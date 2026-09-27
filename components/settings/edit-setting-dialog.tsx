"use client"

import { useMemo } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader } from "lucide-react"
import { useForm } from "react-hook-form"
import toast from "react-hot-toast"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getApiErrorMessage } from "@/lib/api/errors"
import { settingsQueryKey, updateSetting } from "@/lib/api/settings"
import {
  getSettingInputKind,
  getSettingUnit,
  makeSettingSchema,
  toSettingPayload,
  type SettingInputKind,
  type SettingValues,
} from "@/lib/schemas/settings"
import { getSettingLabel } from "@/lib/settings"
import type { MotelSetting } from "@/lib/types"

const labelClassName =
  "font-heading text-xs font-semibold tracking-wide text-iron uppercase"
const inputClassName =
  "h-11 rounded-lg border-border bg-canvas px-3.5 text-base focus-visible:border-brand-azure focus-visible:ring-brand-azure/20 md:text-base dark:bg-input/30"

/** Native input attributes for each kind of setting. */
const INPUT_PROPS: Record<
  SettingInputKind,
  React.ComponentProps<typeof Input> & { hint?: string }
> = {
  time: { type: "time", step: 60, hint: "24-hour time." },
  percentage: { type: "number", inputMode: "numeric", min: 0, max: 100 },
  count: { type: "number", inputMode: "numeric", min: 1 },
  email: { type: "email", placeholder: "name@example.com" },
  emails: {
    type: "text",
    placeholder: "john@example.com, mary@example.com",
    hint: "Separate multiple addresses with commas.",
  },
  digits: { type: "text", inputMode: "numeric", placeholder: "123456" },
  text: { type: "text" },
}

interface EditSettingDialogProps {
  setting: MotelSetting
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Edits one setting's value via `PATCH /motel/settings/{key}`. The input
 * and its validation follow the setting's kind (`getSettingInputKind`).
 */
function EditSettingDialog(props: EditSettingDialogProps) {
  // Mounted only while open so each open starts from the current value.
  if (!props.open) return null
  return <EditSettingForm {...props} />
}

function EditSettingForm({
  setting,
  onOpenChange,
}: Omit<EditSettingDialogProps, "open">) {
  const queryClient = useQueryClient()
  const label = getSettingLabel(setting.key)
  const kind = getSettingInputKind(setting.key)
  const unit = getSettingUnit(setting.key)
  const { hint, ...inputProps } = INPUT_PROPS[kind]

  const schema = useMemo(() => makeSettingSchema(setting.key), [setting.key])
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
  } = useForm<SettingValues>({
    resolver: zodResolver(schema),
    defaultValues: { value: setting.value },
  })

  const mutation = useMutation({
    mutationFn: (values: SettingValues) =>
      updateSetting(setting.key, toSettingPayload(setting.key, values)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: settingsQueryKey })
      toast.success(`${label} was updated.`)
      onOpenChange(false)
    },
    onError: (err) => {
      setError("root", {
        message: getApiErrorMessage(
          err,
          "We couldn't update this setting. Try again."
        ),
      })
    },
  })

  const describedBy =
    [errors.value && "setting-value-error", hint && "setting-value-hint"]
      .filter(Boolean)
      .join(" ") || undefined

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        // Ignore Escape / backdrop clicks while a request is in flight.
        if (mutation.isPending) return
        if (!next) onOpenChange(false)
      }}
    >
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Edit {label}</DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            {setting.description}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          noValidate
        >
          <fieldset disabled={mutation.isPending} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="setting-value" className={labelClassName}>
                {label}
              </Label>
              <div className="flex items-center gap-3">
                <Input
                  id="setting-value"
                  autoFocus
                  autoComplete="off"
                  spellCheck={false}
                  className={inputClassName}
                  aria-invalid={Boolean(errors.value)}
                  aria-describedby={describedBy}
                  {...inputProps}
                  {...register("value")}
                />
                {unit ? (
                  <span className="shrink-0 text-sm text-muted-foreground">
                    {unit}
                  </span>
                ) : null}
              </div>
              {hint ? (
                <p
                  id="setting-value-hint"
                  className="text-xs text-muted-foreground"
                >
                  {hint}
                </p>
              ) : null}
              {errors.value ? (
                <p
                  id="setting-value-error"
                  className="text-sm text-destructive"
                >
                  {errors.value.message}
                </p>
              ) : null}
            </div>

            {errors.root ? (
              <p
                role="alert"
                className="rounded-md bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
              >
                {errors.root.message}
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
                // Nothing to save until the value changes.
                disabled={!isDirty}
                className="h-11 rounded-full bg-brand-azure px-5 text-white hover:bg-brand-azure/90 focus-visible:ring-brand-azure/30"
              >
                {mutation.isPending ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader aria-hidden="true" className="animate-spin" />
                    Saving
                  </span>
                ) : (
                  "Save changes"
                )}
              </Button>
            </DialogFooter>
          </fieldset>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { EditSettingDialog }
