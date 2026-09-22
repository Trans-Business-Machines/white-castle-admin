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
import {
  deleteUnitPhoto,
  unitsQueryKey,
  updateUnit,
  uploadUnitPhotos,
} from "@/lib/api/units"
import { toUnitPayload, unitsSchema, type UnitType } from "@/lib/schemas/units"
import type { Unit } from "@/lib/types"

interface EditUnitDialogProps {
  unit: Unit
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Marks a failure while deleting the photos the user unticked. */
class PhotoRemovalError extends Error {
  constructor(public readonly cause: unknown) {
    super("Photo removal failed")
  }
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
    photos: [],
  }
}

/**
 * Edits an existing room in three steps: `PATCH /bookings/rooms/{id}`, then
 * the photos the user unticked are deleted, then any newly picked ones are
 * uploaded. Deleting first matters — the backend caps a room at
 * `MAX_ROOM_PHOTOS`, so swapping all ten would be rejected the other way
 * round. Each step remembers that it finished, so resubmitting after a
 * failure only repeats what's left.
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
  // True once the PATCH succeeded, so a failed photo step can be retried
  // without sending the details a second time.
  const [detailsSaved, setDetailsSaved] = useState(false)
  // Existing photo URLs the user has ticked off but that are still on the
  // server, and the ones a save has actually deleted. Splitting them keeps
  // a partly-failed save honest: what went through disappears from the grid,
  // what didn't stays marked for the retry.
  const [removedPhotos, setRemovedPhotos] = useState<string[]>([])
  const [deletedPhotos, setDeletedPhotos] = useState<string[]>([])

  const existingPhotos = (unit.photos ?? []).filter(
    (url) => !deletedPhotos.includes(url)
  )

  function toggleRemovePhoto(url: string) {
    setRemovedPhotos((current) =>
      current.includes(url)
        ? current.filter((marked) => marked !== url)
        : [...current, url]
    )
  }

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

      if (removedPhotos.length > 0) {
        // The endpoint takes one URL at a time, so fire them together and
        // record which landed; a retry then only repeats the failures.
        const results = await Promise.allSettled(
          removedPhotos.map((url) => deleteUnitPhoto(unit.room_id, url))
        )
        const gone = removedPhotos.filter(
          (_, index) => results[index].status === "fulfilled"
        )
        if (gone.length > 0) {
          setDeletedPhotos((current) => [...current, ...gone])
          setRemovedPhotos((current) =>
            current.filter((url) => !gone.includes(url))
          )
        }
        const failure = results.find(
          (result): result is PromiseRejectedResult =>
            result.status === "rejected"
        )
        if (failure) throw new PhotoRemovalError(failure.reason)
      }

      if (values.photos.length > 0) {
        try {
          await uploadUnitPhotos(unit.room_id, values.photos)
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
      if (error instanceof PhotoRemovalError) {
        setError("root", {
          message: `The details were saved, but some photos couldn't be removed: ${getApiErrorMessage(
            error.cause,
            "something went wrong."
          )} Try again to retry the ones still marked, or cancel to leave them in place.`,
        })
        return
      }
      if (error instanceof PhotoUploadError) {
        setError("root", {
          message: `The details were saved, but the photos didn't upload: ${getApiErrorMessage(
            error.cause,
            "something went wrong."
          )} Try again to retry the upload, or cancel to add them later.`,
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
   * Emptying `photos` unmounts the dropzone previews (revoking their object
   * URLs) before the dialog itself unmounts. Skips the pending guard
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
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto md:max-w-2xl">
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
              existingPhotos={existingPhotos}
              removedPhotos={removedPhotos}
              onToggleRemovePhoto={toggleRemovePhoto}
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
                    {detailsSaved ? "Updating photos" : "Saving"}
                  </span>
                ) : detailsSaved ? (
                  "Retry photo changes"
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
