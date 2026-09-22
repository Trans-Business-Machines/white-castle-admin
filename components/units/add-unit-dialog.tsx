"use client"

import { useState, type PropsWithChildren } from "react"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { UnitFormFields } from "@/components/units/unit-form-fields"
import { getApiErrorMessage } from "@/lib/api/errors"
import { createUnit, unitsQueryKey, uploadUnitPhotos } from "@/lib/api/units"
import { toUnitPayload, unitsSchema, type UnitType } from "@/lib/schemas/units"
import type { Unit } from "@/lib/types"

const emptyValues: UnitType = {
  room_number: "",
  room_type: "" as UnitType["room_type"],
  description: "",
  max_occupancy: Number.NaN,
  base_rate: Number.NaN,
  amenities: [],
  photos: [],
}

/** Marks a failure that happened after the room itself was saved. */
export class PhotoUploadError extends Error {
  constructor(public readonly cause: unknown) {
    super("Photo upload failed")
  }
}

export function NewRoomDialog({ children }: PropsWithChildren) {
  const [open, setOpen] = useState(false)
  // Set once the room is saved so a failed photo upload can be retried
  // without creating the room a second time.
  const [savedUnit, setSavedUnit] = useState<Unit | null>(null)
  const queryClient = useQueryClient()

  const form = useForm<UnitType>({
    resolver: zodResolver(unitsSchema),
    defaultValues: emptyValues,
  })
  const {
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = form

  const mutation = useMutation({
    mutationFn: async (values: UnitType) => {
      let unit = savedUnit
      if (!unit) {
        unit = await createUnit(toUnitPayload(values))
        setSavedUnit(unit)
        queryClient.invalidateQueries({ queryKey: unitsQueryKey })
      }
      if (values.photos.length > 0) {
        try {
          await uploadUnitPhotos(unit.room_id, values.photos)
        } catch (error) {
          throw new PhotoUploadError(error)
        }
      }
      return unit
    },
    onSuccess: async (unit) => {
      await queryClient.invalidateQueries({ queryKey: unitsQueryKey })
      toast.success(`Room ${unit.room_number} added.`)
      closeDialog()
    },
    onError: (error) => {
      if (error instanceof PhotoUploadError) {
        setError("root", {
          message: `The room was saved, but the photos didn't upload: ${getApiErrorMessage(
            error.cause,
            "something went wrong."
          )} Try again to retry the upload, or cancel to add them later.`,
        })
        return
      }
      setError("root", {
        message: getApiErrorMessage(
          error,
          "We couldn't save the room. Try again."
        ),
      })
    },
  })

  /**
   * Wipes every piece of dialog state, then closes. Emptying `photos`
   * unmounts every preview inside `PhotoDropzone`, each of which revokes its
   * object URL. This deliberately skips the pending guard below: TanStack
   * runs `onSuccess` before it flips `isPending` off, so a guarded close
   * would silently no-op after a successful save.
   */
  function closeDialog() {
    reset(emptyValues)
    setSavedUnit(null)
    mutation.reset()
    setOpen(false)
  }

  function handleOpenChange(next: boolean) {
    // Ignore Escape / backdrop clicks while a request is in flight.
    if (mutation.isPending) return
    if (next) {
      setOpen(true)
    } else {
      closeDialog()
    }
  }

  const detailsLocked = mutation.isPending || Boolean(savedUnit)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto md:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl font-bold">
            Add unit
          </DialogTitle>
          <DialogDescription>
            Units listed here become bookable on the public site.
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
                    {savedUnit ? "Uploading photos" : "Saving"}
                  </span>
                ) : savedUnit ? (
                  "Retry photo upload"
                ) : (
                  "Add unit"
                )}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
