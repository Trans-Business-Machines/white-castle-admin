"use client"

import { useState, type KeyboardEvent } from "react"
import { Plus, X } from "lucide-react"
import { Controller, useWatch, type UseFormReturn } from "react-hook-form"
import { Button } from "@/components/ui/button"
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
import { amenitySchema, ROOM_TYPES, type UnitType } from "@/lib/schemas/units"

const labelClassName =
  "font-ibm-plex text-xs font-semibold tracking-wide text-iron uppercase"
const inputClassName =
  "h-11 rounded-lg border-border bg-canvas px-3.5 text-base focus-visible:border-brand-azure focus-visible:ring-brand-azure/20 md:text-base dark:bg-input/30"

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} className="text-sm text-destructive">
      {message}
    </p>
  )
}

interface UnitFormFieldsProps {
  form: UseFormReturn<UnitType>
  /** Disables the room detail inputs (everything except the photo). */
  detailsLocked: boolean
  /** Disables the photo picker while a request is in flight. */
  pending: boolean
  /** Caption under the photo picker; differs between add and edit. */
  photoHint?: string
}

/**
 * Every input for a room — details, amenity chips and the photo picker —
 * shared by the add and edit dialogs. The owning dialog holds the form and
 * the mutation; this only renders fields against it.
 */
export function UnitFormFields({
  form,
  detailsLocked,
  pending,
  photoHint,
}: UnitFormFieldsProps) {
  const {
    control,
    register,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = form
  const [amenityInput, setAmenityInput] = useState("")
  const [amenityError, setAmenityError] = useState<string | null>(null)

  const amenities = useWatch({ control, name: "amenities" })

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

  return (
    <>
      <fieldset disabled={detailsLocked} className="grid min-w-0 gap-4">
        {/* Room number & type inputs */}
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
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id="unit-room-type"
                    ref={field.ref}
                    onBlur={field.onBlur}
                    className={`${inputClassName} w-full data-[size=default]:h-11`}
                    aria-invalid={Boolean(errors.room_type)}
                    aria-describedby={
                      errors.room_type ? "unit-room-type-error" : undefined
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

        {/* Occupancy and base rate inputs */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="unit-max-occupancy" className={labelClassName}>
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
                errors.max_occupancy ? "unit-max-occupancy-error" : undefined
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

        {/* Description input */}
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

        {/* Amenities input */}
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
              aria-describedby={amenityError ? "unit-amenity-error" : undefined}
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
              Type an amenity and press Enter or Add amenity. Leave empty if the
              room has none.
            </p>
          )}
        </div>
      </fieldset>

      {/* Photo upload drop zone */}
      <fieldset disabled={pending} className="grid min-w-0 gap-2">
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
              disabled={pending}
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
        <FieldError id="unit-photo-error" message={errors.photo?.message} />
        {photoHint ? <p className="text-xs text-iron">{photoHint}</p> : null}
      </fieldset>
    </>
  )
}
