"use client"

import { useState, type KeyboardEvent, type PropsWithChildren } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader, Plus, X } from "lucide-react"
import { Controller, useForm, useWatch } from "react-hook-form"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { PhotoDropzone } from "@/components/units/photo-dropzone"
import { getApiErrorMessage } from "@/lib/api/errors"
import { createUnit, unitsQueryKey, uploadUnitPhoto } from "@/lib/api/units"
import {
  amenitySchema,
  ROOM_TYPES,
  toUnitPayload,
  unitsSchema,
  type UnitType,
} from "@/lib/schemas/units"
import type { Unit } from "@/lib/types"

const labelClassName =
  "font-ibm-plex text-xs font-semibold tracking-wide text-iron uppercase"
const inputClassName =
  "h-11 rounded-lg border-border bg-canvas px-3.5 text-base focus-visible:border-brand-azure focus-visible:ring-brand-azure/20 md:text-base dark:bg-input/30"

const emptyValues: UnitType = {
  room_number: "",
  // Cast: the select starts empty and zod rejects it until one is chosen.
  room_type: "" as UnitType["room_type"],
  description: "",
  max_occupancy: Number.NaN,
  base_rate: Number.NaN,
  amenities: [],
  photo: null,
}

/** Marks a failure that happened after the room itself was saved. */
class PhotoUploadError extends Error {
  constructor(public readonly cause: unknown) {
    super("Photo upload failed")
  }
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} className="text-sm text-destructive">
      {message}
    </p>
  )
}

export function NewRoomDialog({ children }: PropsWithChildren) {
  const [open, setOpen] = useState(false)
  const [amenityInput, setAmenityInput] = useState("")
  const [amenityError, setAmenityError] = useState<string | null>(null)
  // Set once the room is saved so a failed photo upload can be retried
  // without creating the room a second time.
  const [savedUnit, setSavedUnit] = useState<Unit | null>(null)
  const queryClient = useQueryClient()

  const {
    control,
    register,
    handleSubmit,
    setError,
    clearErrors,
    setValue,
    reset,
    formState: { errors },
  } = useForm<UnitType>({
    resolver: zodResolver(unitsSchema),
    defaultValues: emptyValues,
  })

  const amenities = useWatch({ control, name: "amenities" })

  const mutation = useMutation({
    mutationFn: async (values: UnitType) => {
      let unit = savedUnit
      if (!unit) {
        unit = await createUnit(toUnitPayload(values))
        setSavedUnit(unit)
        queryClient.invalidateQueries({ queryKey: unitsQueryKey })
      }
      if (values.photo) {
        try {
          await uploadUnitPhoto(unit.room_id, values.photo)
        } catch (error) {
          throw new PhotoUploadError(error)
        }
      }
      return unit
    },
    onSuccess: (unit) => {
      queryClient.invalidateQueries({ queryKey: unitsQueryKey })
      toast.success(`Room ${unit.room_number} added.`)
      handleOpenChange(false)
    },
    onError: (error) => {
      if (error instanceof PhotoUploadError) {
        setError("root", {
          message: `The room was saved, but the photo didn't upload: ${getApiErrorMessage(
            error.cause,
            "something went wrong."
          )} Try again to retry the photo, or cancel to add it later.`,
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

  function handleOpenChange(next: boolean) {
    if (mutation.isPending) return
    setOpen(next)
    if (!next) {
      reset(emptyValues)
      setAmenityInput("")
      setAmenityError(null)
      setSavedUnit(null)
      mutation.reset()
    }
  }

  function addAmenity() {
    const parsed = amenitySchema.safeParse(amenityInput)
    if (!parsed.success) {
      setAmenityError(parsed.error.issues[0]?.message ?? "Enter an amenity.")
      return
    }
    const duplicate = amenities.some(
      (amenity) => amenity.toLowerCase() === parsed.data.toLowerCase()
    )
    if (duplicate) {
      setAmenityError("That amenity is already on the list.")
      return
    }
    setValue("amenities", [...amenities, parsed.data], { shouldDirty: true })
    setAmenityInput("")
    setAmenityError(null)
  }

  function removeAmenity(index: number) {
    setValue(
      "amenities",
      amenities.filter((_, i) => i !== index),
      { shouldDirty: true }
    )
  }

  function handleAmenityKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    // Enter adds the amenity instead of submitting the whole form.
    if (event.key === "Enter") {
      event.preventDefault()
      addAmenity()
    }
  }

  const detailsLocked = mutation.isPending || Boolean(savedUnit)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
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
            <fieldset disabled={detailsLocked} className="grid min-w-0 gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="unit-room-number" className={labelClassName}>
                    Room number
                  </Label>
                  <Input
                    id="unit-room-number"
                    autoFocus
                    autoComplete="off"
                    placeholder="101"
                    className={inputClassName}
                    aria-invalid={Boolean(errors.room_number)}
                    aria-describedby={
                      errors.room_number ? "unit-room-number-error" : undefined
                    }
                    {...register("room_number")}
                  />
                  <FieldError
                    id="unit-room-number-error"
                    message={errors.room_number?.message}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="unit-room-type" className={labelClassName}>
                    Room type
                  </Label>
                  <Controller
                    control={control}
                    name="room_type"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger
                          id="unit-room-type"
                          ref={field.ref}
                          onBlur={field.onBlur}
                          className={`${inputClassName} w-full data-[size=default]:h-11`}
                          aria-invalid={Boolean(errors.room_type)}
                          aria-describedby={
                            errors.room_type
                              ? "unit-room-type-error"
                              : undefined
                          }
                        >
                          <SelectValue placeholder="Choose a room type" />
                        </SelectTrigger>
                        <SelectContent>
                          {ROOM_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FieldError
                    id="unit-room-type-error"
                    message={errors.room_type?.message}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label
                    htmlFor="unit-max-occupancy"
                    className={labelClassName}
                  >
                    Max occupancy
                  </Label>
                  <Input
                    id="unit-max-occupancy"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    step={1}
                    placeholder="2"
                    className={inputClassName}
                    aria-invalid={Boolean(errors.max_occupancy)}
                    aria-describedby={
                      errors.max_occupancy
                        ? "unit-max-occupancy-error"
                        : undefined
                    }
                    {...register("max_occupancy", { valueAsNumber: true })}
                  />
                  <FieldError
                    id="unit-max-occupancy-error"
                    message={errors.max_occupancy?.message}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="unit-base-rate" className={labelClassName}>
                    Base rate (KES / night)
                  </Label>
                  <Input
                    id="unit-base-rate"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    placeholder="4500"
                    className={inputClassName}
                    aria-invalid={Boolean(errors.base_rate)}
                    aria-describedby={
                      errors.base_rate ? "unit-base-rate-error" : undefined
                    }
                    {...register("base_rate", { valueAsNumber: true })}
                  />
                  <FieldError
                    id="unit-base-rate-error"
                    message={errors.base_rate?.message}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="unit-description" className={labelClassName}>
                  Description
                </Label>
                <Textarea
                  id="unit-description"
                  rows={3}
                  placeholder="Spacious room with a queen bed, garden view and en-suite bathroom."
                  className={`${inputClassName} h-auto min-h-24 py-2.5`}
                  aria-invalid={Boolean(errors.description)}
                  aria-describedby={
                    errors.description ? "unit-description-error" : undefined
                  }
                  {...register("description")}
                />
                <FieldError
                  id="unit-description-error"
                  message={errors.description?.message}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="unit-amenity" className={labelClassName}>
                  Amenities
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="unit-amenity"
                    autoComplete="off"
                    placeholder="Wi-Fi"
                    className={inputClassName}
                    value={amenityInput}
                    onChange={(event) => {
                      setAmenityInput(event.target.value)
                      if (amenityError) setAmenityError(null)
                    }}
                    onKeyDown={handleAmenityKeyDown}
                    aria-invalid={Boolean(amenityError)}
                    aria-describedby={
                      amenityError ? "unit-amenity-error" : undefined
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 shrink-0 rounded-lg px-4"
                    onClick={addAmenity}
                  >
                    <Plus aria-hidden="true" />
                    Add amenity
                  </Button>
                </div>
                <FieldError
                  id="unit-amenity-error"
                  message={amenityError ?? errors.amenities?.message}
                />
                {amenities.length > 0 ? (
                  <ul className="flex flex-wrap gap-2" aria-label="Amenities">
                    {amenities.map((amenity, index) => (
                      <li
                        key={`${amenity}-${index}`}
                        className="inline-flex items-center gap-1 rounded-full border border-brand-azure/20 bg-brand-azure/10 py-1 pr-1 pl-3 text-sm text-brand-navy dark:text-foreground"
                      >
                        {amenity}
                        <button
                          type="button"
                          onClick={() => removeAmenity(index)}
                          aria-label={`Remove ${amenity}`}
                          className="rounded-full p-0.5 text-brand-navy/70 transition-colors hover:bg-brand-azure/20 hover:text-brand-navy dark:text-foreground/70 dark:hover:text-foreground"
                        >
                          <X aria-hidden="true" className="size-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-iron">
                    Type an amenity and press Enter or Add amenity. Leave empty
                    if the room has none.
                  </p>
                )}
              </div>
            </fieldset>

            <fieldset
              disabled={mutation.isPending}
              className="grid min-w-0 gap-2"
            >
              <Label htmlFor="unit-photo" className={labelClassName}>
                Photo{" "}
                <span className="font-normal tracking-normal normal-case">
                  (optional)
                </span>
              </Label>
              <Controller
                control={control}
                name="photo"
                render={({ field }) => (
                  <PhotoDropzone
                    id="unit-photo"
                    value={field.value}
                    disabled={mutation.isPending}
                    invalid={Boolean(errors.photo)}
                    describedBy={errors.photo ? "unit-photo-error" : undefined}
                    onChange={(file) => {
                      clearErrors("photo")
                      field.onChange(file)
                    }}
                    onReject={(message) => setError("photo", { message })}
                  />
                )}
              />
              <FieldError
                id="unit-photo-error"
                message={errors.photo?.message}
              />
            </fieldset>

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
                className="h-11 rounded-full bg-brand-azure px-5 text-white hover:bg-brand-azure/90 focus-visible:ring-brand-azure/30"
              >
                {mutation.isPending ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader aria-hidden="true" className="animate-spin" />
                    {savedUnit ? "Uploading photo" : "Saving"}
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
