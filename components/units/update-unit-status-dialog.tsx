"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader } from "lucide-react"
import { Controller, useForm, useWatch } from "react-hook-form"
import toast from "react-hot-toast"
import {
  FieldError,
  inputClassName,
  labelClassName,
} from "@/components/bookings/booking-form-fields"
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
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { UnitStatusBadge } from "@/components/units/unit-status-badge"
import { getApiErrorMessage } from "@/lib/api/errors"
import { unitsQueryKey, updateUnitStatus } from "@/lib/api/units"
import { humanizeSlug } from "@/lib/format"
import {
  isSettableUnitStatus,
  SETTABLE_UNIT_STATUSES,
  toUnitStatusPayload,
  unitStatusSchema,
  type UnitStatusValues,
} from "@/lib/schemas/units"
import type { Unit } from "@/lib/types"
import { useAuth } from "@/providers/auth-provider"

interface UpdateUnitStatusDialogProps {
  unit: Pick<Unit, "room_id" | "room_number" | "status">
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Moves a room between available, housekeeping and maintenance (`PATCH
 * /bookings/rooms/{id}` with the signed-in user as `changed_by` and empty
 * `notes`). Shared by the table row menu and the unit details page.
 */
function UpdateUnitStatusDialog(props: UpdateUnitStatusDialogProps) {
  // Mounted only while open so each open starts on the room's current status.
  if (!props.open) return null
  return <UpdateStatusForm {...props} />
}

function UpdateStatusForm({
  unit,
  onOpenChange,
}: Omit<UpdateUnitStatusDialogProps, "open">) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const current = unit.status.toLowerCase()

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<UnitStatusValues>({
    resolver: zodResolver(unitStatusSchema),
    defaultValues: {
      status: isSettableUnitStatus(current)
        ? current
        : ("" as UnitStatusValues["status"]),
    },
  })
  const status = useWatch({ control, name: "status" })

  const mutation = useMutation({
    mutationFn: (values: UnitStatusValues) => {
      if (!user) throw new Error("Sign in again to update this room.")
      return updateUnitStatus(
        unit.room_id,
        toUnitStatusPayload(values, user.user_id)
      )
    },
    onSuccess: async (_, values) => {
      await queryClient.invalidateQueries({ queryKey: unitsQueryKey })
      toast.success(
        `Room ${unit.room_number} is now ${humanizeSlug(values.status).toLowerCase()}.`
      )
      onOpenChange(false)
    },
    onError: (err) => {
      setError("root", {
        message: getApiErrorMessage(
          err,
          "We couldn't update this room's status. Try again."
        ),
      })
    },
  })

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (mutation.isPending) return
        if (!next) onOpenChange(false)
      }}
    >
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Update room {unit.room_number} status
          </DialogTitle>
          <DialogDescription className="inline-flex flex-wrap items-center gap-2 text-base text-muted-foreground">
            Currently <UnitStatusBadge status={unit.status} />
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          noValidate
        >
          <fieldset disabled={mutation.isPending} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="unit-status" className={labelClassName}>
                New status
              </Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id="unit-status"
                      ref={field.ref}
                      onBlur={field.onBlur}
                      className={`${inputClassName} w-full data-[size=default]:h-11`}
                      aria-invalid={Boolean(errors.status)}
                      aria-describedby={
                        errors.status ? "unit-status-error" : undefined
                      }
                    >
                      <SelectValue placeholder="Choose a status" />
                    </SelectTrigger>
                    <SelectContent>
                      {SETTABLE_UNIT_STATUSES.map((value) => (
                        <SelectItem key={value} value={value}>
                          {humanizeSlug(value)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError
                id="unit-status-error"
                message={errors.status?.message}
              />
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
                // Nothing to save until a different status is picked.
                disabled={!status || status === current}
                className="h-11 rounded-full bg-brand-azure px-5 text-white hover:bg-brand-azure/90 focus-visible:ring-brand-azure/30"
              >
                {mutation.isPending ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader aria-hidden="true" className="animate-spin" />
                    Saving
                  </span>
                ) : (
                  "Update status"
                )}
              </Button>
            </DialogFooter>
          </fieldset>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { UpdateUnitStatusDialog }
