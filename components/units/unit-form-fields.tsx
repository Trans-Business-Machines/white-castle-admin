"use client"

import { useEffect, useState, type KeyboardEvent } from "react"
import { Plus, Undo2, X } from "lucide-react"
import { Controller, useWatch, type UseFormReturn } from "react-hook-form"
import { useQuery } from "@tanstack/react-query"
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
import {
  PhotoDropzone,
  photoGridClassName,
} from "@/components/units/photo-dropzone"
import { PhotoTile } from "@/components/units/photo-tile"
import {
  amenitySchema,
  MAX_ROOM_PHOTOS,
  ROOM_TYPES,
  type UnitType,
} from "@/lib/schemas/units"
import {
  fetchRoomTypes,
  roomTypesQueryKey,
  type RoomTypeDefault,
} from "@/lib/api/units"

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

/** The eight nightly rates, all copied from the room type's defaults. */
const RATE_FIELDS = [
  "base_rate",
  "bb_rate",
  "hb_rate",
  "fb_rate",
  "base_rate_usd",
  "bb_rate_usd",
  "hb_rate_usd",
  "fb_rate_usd",
] as const satisfies readonly (keyof UnitType & keyof RoomTypeDefault)[]

/** A read-only rate: the value always comes from the room type. */
function RateInput({
  id,
  label,
  fieldName,
  form,
}: {
  id: string
  label: string
  fieldName: (typeof RATE_FIELDS)[number]
  form: UseFormReturn<UnitType>
}) {
  const {
    register,
    formState: { errors },
  } = form
  return (
    <div className="grid gap-2">
      <Label htmlFor={id} className={labelClassName}>
        {label}
      </Label>
      <Input
        id={id}
        type="number"
        readOnly
        placeholder="—"
        className={`${inputClassName} cursor-default read-only:bg-muted read-only:focus-visible:border-border read-only:focus-visible:ring-0`}
        aria-invalid={Boolean(errors[fieldName])}
        aria-describedby="unit-rates-status"
        {...register(fieldName, { valueAsNumber: true })}
      />
    </div>
  )
}

interface UnitFormFieldsProps {
  form: UseFormReturn<UnitType>
  /** Disables the room detail inputs (everything except the photos). */
  detailsLocked: boolean
  /** Disables the photo controls while a request is in flight. */
  pending: boolean
  /** Photos already on the room; edit dialog only. */
  existingPhotos?: string[]
  /** Existing photo URLs the user has marked for deletion on save. */
  removedPhotos?: string[]
  /** Marks an existing photo for deletion, or takes the mark back off. */
  onToggleRemovePhoto?: (url: string) => void
}

/**
 * Every input for a room — details, rate grid, amenity chips and the photo
 * picker — shared by the add and edit dialogs. The owning dialog holds the
 * form and the mutation; this only renders fields against it.
 */
export function UnitFormFields({
  form,
  detailsLocked,
  pending,
  existingPhotos = [],
  removedPhotos = [],
  onToggleRemovePhoto,
}: UnitFormFieldsProps) {
  const {
    control,
    register,
    setValue,
    getValues,
    setError,
    clearErrors,
    formState: { errors },
  } = form
  const [amenityInput, setAmenityInput] = useState("")
  const [amenityError, setAmenityError] = useState<string | null>(null)

  const amenities = useWatch({ control, name: "amenities" })
  const photos = useWatch({ control, name: "photos" })

  // Each room type's default occupancy and rates; the rates can't be typed.
  const roomTypes = useQuery({
    queryKey: roomTypesQueryKey,
    queryFn: fetchRoomTypes,
  })
  const roomType = useWatch({ control, name: "room_type" })
  const roomTypeDefaults = roomTypes.data?.find(
    (defaults) => defaults.type === roomType
  )
  const rateError = RATE_FIELDS.some((name) => errors[name])

  /** Copies the type's defaults in; `onlyMissing` keeps values already set. */
  function applyRoomTypeDefaults(
    defaults: RoomTypeDefault,
    { onlyMissing }: { onlyMissing: boolean }
  ) {
    const fields = ["max_occupancy", ...RATE_FIELDS] as const
    for (const name of fields) {
      if (onlyMissing && !Number.isNaN(getValues(name))) continue
      setValue(name, defaults[name], { shouldDirty: true })
    }
    clearErrors([...fields])
  }

  // Fills whatever is still empty once the defaults arrive: every rate on a
  // new room (which starts on a room type), and any rate an existing room
  // was saved without. Rates already on the room are left alone.
  useEffect(() => {
    if (roomTypeDefaults) {
      applyRoomTypeDefaults(roomTypeDefaults, { onlyMissing: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs per type / response, not per render
  }, [roomTypeDefaults])

  // Picking a type replaces the occupancy and all eight rates.
  function handleRoomTypeChange(
    value: string,
    fieldOnChange: (v: string) => void
  ) {
    fieldOnChange(value)
    const defaults = roomTypes.data?.find((rt) => rt.type === value)
    if (defaults) applyRoomTypeDefaults(defaults, { onlyMissing: false })
  }

  let ratesStatus: string | null = null
  if (roomTypes.isPending) ratesStatus = "Loading the room type rates…"
  else if (roomTypes.isError)
    ratesStatus = "We couldn't load the room type rates."
  else if (roomType && !roomTypeDefaults)
    ratesStatus = "This room type has no rates set yet."
  else if (rateError) ratesStatus = "Choose a room type to fill in its rates."

  const keptExisting = existingPhotos.filter(
    (url) => !removedPhotos.includes(url)
  ).length
  const used = keptExisting + photos.length
  const remaining = Math.max(0, MAX_ROOM_PHOTOS - used)

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
    if (event.key === "Enter") {
      event.preventDefault()
      addAmenity()
    }
  }

  return (
    <>
      <fieldset disabled={detailsLocked} className="grid min-w-0 gap-4">
        {/* Room number & type */}
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
              <span className="ml-1 font-normal tracking-normal text-iron normal-case">
                — sets the rates
              </span>
            </Label>
            <Controller
              control={control}
              name="room_type"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) =>
                    handleRoomTypeChange(value, field.onChange)
                  }
                >
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

        {/* Max occupancy */}
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

        {/* KES rates */}
        <div className="grid gap-2">
          <p className={labelClassName}>Resident rates (KES / night)</p>
          <div className="grid gap-4 sm:grid-cols-4">
            <RateInput
              id="unit-base-rate"
              label="Bed Only"
              fieldName="base_rate"
              form={form}
            />
            <RateInput
              id="unit-bb-rate"
              label="Bed & Breakfast"
              fieldName="bb_rate"
              form={form}
            />
            <RateInput
              id="unit-hb-rate"
              label="Half Board"
              fieldName="hb_rate"
              form={form}
            />
            <RateInput
              id="unit-fb-rate"
              label="Full Board"
              fieldName="fb_rate"
              form={form}
            />
          </div>
        </div>

        {/* USD rates */}
        <div className="grid gap-2">
          <p className={labelClassName}>Non-resident rates (USD / night)</p>
          <div className="grid gap-4 sm:grid-cols-4">
            <RateInput
              id="unit-base-rate-usd"
              label="Bed Only"
              fieldName="base_rate_usd"
              form={form}
            />
            <RateInput
              id="unit-bb-rate-usd"
              label="Bed & Breakfast"
              fieldName="bb_rate_usd"
              form={form}
            />
            <RateInput
              id="unit-hb-rate-usd"
              label="Half Board"
              fieldName="hb_rate_usd"
              form={form}
            />
            <RateInput
              id="unit-fb-rate-usd"
              label="Full Board"
              fieldName="fb_rate_usd"
              form={form}
            />
          </div>
        </div>

        {ratesStatus ? (
          <div
            id="unit-rates-status"
            role={rateError || roomTypes.isError ? "alert" : "status"}
            className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-sm ${
              rateError || roomTypes.isError
                ? "text-destructive"
                : "text-muted-foreground"
            }`}
          >
            {ratesStatus}
            {roomTypes.isError ? (
              <Button
                type="button"
                variant="link"
                onClick={() => roomTypes.refetch()}
                className="h-auto p-0 text-brand-azure"
              >
                Try again
              </Button>
            ) : null}
          </div>
        ) : (
          <p id="unit-rates-status" className="text-sm text-muted-foreground">
            Rates follow the room type and can&apos;t be edited here.
          </p>
        )}

        {/* Description */}
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

        {/* Amenities */}
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
      <fieldset disabled={pending} className="grid min-w-0 gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <Label htmlFor="unit-photos" className={labelClassName}>
            Photos{" "}
            <span className="font-normal tracking-normal normal-case">
              (optional)
            </span>
          </Label>
          <span className="font-mono text-xs text-iron">
            {used} of {MAX_ROOM_PHOTOS}
          </span>
        </div>

        {existingPhotos.length > 0 ? (
          <div className="grid gap-2">
            <p className="text-xs text-iron">
              Current photos. Removing one deletes it when you save.
            </p>
            <ul className={photoGridClassName} aria-label="Current photos">
              {existingPhotos.map((url, index) => {
                const marked = removedPhotos.includes(url)
                return (
                  <PhotoTile
                    key={url}
                    src={url}
                    alt={`Room photo ${index + 1}`}
                    dimmed={marked}
                    caption="Removing"
                    actionIcon={marked ? Undo2 : X}
                    actionLabel={
                      marked
                        ? `Keep photo ${index + 1}`
                        : `Remove photo ${index + 1}`
                    }
                    disabled={pending || (marked && remaining === 0)}
                    onAction={() => onToggleRemovePhoto?.(url)}
                  />
                )
              })}
            </ul>
          </div>
        ) : null}

        <Controller
          control={control}
          name="photos"
          render={({ field }) => (
            <PhotoDropzone
              id="unit-photos"
              value={field.value}
              remaining={remaining}
              disabled={pending}
              invalid={Boolean(errors.photos)}
              describedBy={errors.photos ? "unit-photos-error" : undefined}
              onChange={(files) => {
                clearErrors("photos")
                field.onChange(files)
              }}
              onReject={(message) => setError("photos", { message })}
            />
          )}
        />
        <FieldError id="unit-photos-error" message={errors.photos?.message} />
      </fieldset>
    </>
  )
}
