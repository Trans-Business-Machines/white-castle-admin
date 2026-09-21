"use client"

import { useState } from "react"
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
import { PhotoUploadError } from "@/components/units/add-unit-dialog"
import { UnitFormFields } from "@/components/units/unit-form-fields"
import { getApiErrorMessage } from "@/lib/api/errors"
import { unitsQueryKey, updateUnit, uploadUnitPhoto } from "@/lib/api/units"
import { toUnitPayload, unitsSchema, type UnitType } from "@/lib/schemas/units"
import type { Unit } from "@/lib/types"

interface EditUnitDialogProps {
  unit: Unit
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Pre-fills the form from the room; the photo picker always starts empty. */
function toFormValues(unit: Unit): UnitType {
  return {
    room_number: unit.room_number,
    room_type: unit.room_type as UnitType["room_type"],
    description: unit.description ?? "",
    max_occupancy: unit.max_occupancy,
    base_rate: unit.base_rate,
    amenities: unit.amenities ?? [],
    photo: null,
  }
}

/**
 * Edits an existing room in the same two steps as `NewRoomDialog`:
 * `PATCH /bookings/rooms/{id}` first, then the photo upload if one was
 * picked. If the upload fails the details stay saved and resubmitting only
 * retries the photo.
 *
 * The form is only mounted while open so every open re-seeds from the
 * latest `unit` and no stale values or object URLs linger between edits.
 */
function EditUnitDialog(props: EditUnitDialogProps) {
  if (!props.open) return null
  return <EditUnitForm {...props} />
}

function EditUnitForm({ unit, onOpenChange }: EditUnitDialogProps) {
  const queryClient = useQueryClient()
  // True once the PATCH succeeded, so a failed photo upload can be retried
  // without sending the details a second time.
  const [detailsSaved, setDetailsSaved] = useState(false)

  const form = useForm<UnitType>({
    resolver: zodResolver(unitsSchema),
    defaultValues: toFormValues(unit),
  })
  const {
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = form

  const mutation = useMutation({
    mutationFn: async (values: UnitType) => {
      let saved = unit
      if (!detailsSaved) {
        saved = await updateUnit(unit.room_id, toUnitPayload(values))
        setDetailsSaved(true)
        queryClient.invalidateQueries({ queryKey: unitsQueryKey })
      }
      if (values.photo) {
        try {
          await uploadUnitPhoto(unit.room_id, values.photo)
        } catch (error) {
          throw new PhotoUploadError(error)
        }
      }
      return saved
    },
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({ queryKey: unitsQueryKey })
      toast.success(`Room ${saved.room_number} updated.`)
      closeDialog()
    },
    onError: (error) => {
      if (error instanceof PhotoUploadError) {
        setError("root", {
          message: `The details were saved, but the photo didn't upload: ${getApiErrorMessage(
            error.cause,
            "something went wrong."
          )} Try again to retry the photo, or cancel to add it later.`,
        })
        return
      }
      setError("root", {
        message: getApiErrorMessage(
          error,
          "We couldn't update the room. Try again."
        ),
      })
    },
  })

  /**
   * Resetting `photo` to null unmounts the dropzone preview (revoking its
   * object URL) before the dialog itself unmounts. Skips the pending guard
   * for the same reason as `NewRoomDialog`: `onSuccess` runs before
   * `isPending` flips off.
   */
  function closeDialog() {
    reset(toFormValues(unit))
    onOpenChange(false)
  }

  function handleOpenChange(next: boolean) {
    // Ignore Escape / backdrop clicks while a request is in flight.
    if (mutation.isPending) return
    if (!next) closeDialog()
  }

  const detailsLocked = mutation.isPending || detailsSaved

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl font-bold">
            Update room {unit.room_number}
          </DialogTitle>
          <DialogDescription>
            Changes apply to new bookings; existing stays keep their rate.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          noValidate
        >
          <div className="grid min-w-0 gap-4">
            <UnitFormFields
              form={form}
              detailsLocked={detailsLocked}
              pending={mutation.isPending}
              photoHint={
                unit.photos?.length
                  ? "Only a newly picked photo shows here. Leave it empty to keep the current photos."
                  : undefined
              }
            />

            {errors.root ? (
              <p
                role="alert"
                className="rounded-md bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
              >
                {errors.root.message}
              </p>
            ) : null}

            <DialogFooter className="mt-2">
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-full px-5"
                  disabled={mutation.isPending}
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="h-11 flex-1 rounded-full bg-brand-azure px-5 text-white hover:bg-brand-azure/90 focus-visible:ring-brand-azure/30"
              >
                {mutation.isPending ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader aria-hidden="true" className="animate-spin" />
                    {detailsSaved ? "Uploading photo" : "Saving"}
                  </span>
                ) : detailsSaved ? (
                  "Retry photo upload"
                ) : (
                  "Save changes"
                )}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { EditUnitDialog }
