import { z } from "zod"
import { IMAGE_PICK_MAX_BYTES } from "@/lib/image-compression"

export const ROOM_PHOTO_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const

/** Largest photo sent to the backend, after compression. */
export const ROOM_PHOTO_MAX_BYTES = 2 * 1024 * 1024

export const MAX_ROOM_PHOTOS = 10

/** Returns a message when `file` can't be uploaded as a room photo. */
export function getRoomPhotoError(file: File) {
  if (!(ROOM_PHOTO_TYPES as readonly string[]).includes(file.type)) {
    return "Use a JPG, PNG or WebP image."
  }
  // Checked against the pick limit: the photo is compressed before upload.
  if (file.size > IMAGE_PICK_MAX_BYTES) {
    return "Keep the image under 10 MB."
  }
  return null
}

export function getPhotoKey(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`
}

export const amenitySchema = z
  .string()
  .trim()
  .min(2, "Enter an amenity of at least 2 characters.")
  .max(50, "Keep the amenity under 50 characters.")

export const ROOM_TYPES = [
  { value: "standard_single", label: "Standard Single" },
  { value: "standard_double", label: "Standard Double" },
  { value: "deluxe_single",   label: "Deluxe Single" },
  { value: "deluxe_double",   label: "Deluxe Double" },
  { value: "executive",       label: "Executive" },
] as const

export type RoomType = (typeof ROOM_TYPES)[number]["value"]

const roomTypeValues = ROOM_TYPES.map((type) => type.value) as [
  RoomType,
  ...RoomType[],
]

const rateField = (label: string) =>
  z.number({ error: `Enter the ${label}.` }).min(0, `${label} can't be negative.`)

const unitFields = z.object({
  room_number: z
    .string()
    .trim()
    .min(1, "Enter the room number.")
    .max(20, "Keep the room number under 20 characters."),
  room_type: z.enum(roomTypeValues, { error: "Choose a room type." }),
  description: z.string().trim(),
  max_occupancy: z
    .number({ error: "Enter how many guests the room sleeps." })
    .int("Occupancy must be a whole number.")
    .positive("Occupancy must be at least 1."),
  // KES rates
  base_rate:    rateField("room only rate (KES)"),
  bb_rate:      rateField("bed & breakfast rate (KES)"),
  hb_rate:      rateField("half board rate (KES)"),
  fb_rate:      rateField("full board rate (KES)"),
  // USD rates
  base_rate_usd: rateField("room only rate (USD)"),
  bb_rate_usd:   rateField("bed & breakfast rate (USD)"),
  hb_rate_usd:   rateField("half board rate (USD)"),
  fb_rate_usd:   rateField("full board rate (USD)"),
  amenities: z.array(amenitySchema),
  photos: z
    .array(z.custom<File>((value) => value instanceof File))
    .max(MAX_ROOM_PHOTOS, `Attach at most ${MAX_ROOM_PHOTOS} photos.`)
    .superRefine((files, ctx) => {
      for (const file of files) {
        const message = getRoomPhotoError(file)
        if (message) {
          ctx.addIssue({ code: "custom", message: `${file.name}: ${message}` })
        }
      }
    }),
})

export const unitsSchema = unitFields

export type UnitType = z.infer<typeof unitsSchema>

export function toUnitPayload(values: UnitType) {
  return {
    room_number:    values.room_number.trim(),
    room_type:      values.room_type,
    description:    values.description.trim(),
    max_occupancy:  values.max_occupancy,
    base_rate:      values.base_rate,
    bb_rate:        values.bb_rate,
    hb_rate:        values.hb_rate,
    fb_rate:        values.fb_rate,
    base_rate_usd:  values.base_rate_usd,
    bb_rate_usd:    values.bb_rate_usd,
    hb_rate_usd:    values.hb_rate_usd,
    fb_rate_usd:    values.fb_rate_usd,
    amenities:      values.amenities.map((amenity) => amenity.trim()),
  }
}

export type UnitPayload = ReturnType<typeof toUnitPayload>

/**
 * The statuses staff can set by hand. `occupied` follows check-in / out,
 * so it isn't offered.
 */
export const SETTABLE_UNIT_STATUSES = [
  "available",
  "housekeeping",
  "maintenance",
] as const

export type SettableUnitStatus = (typeof SETTABLE_UNIT_STATUSES)[number]

export function isSettableUnitStatus(
  status: string
): status is SettableUnitStatus {
  return (SETTABLE_UNIT_STATUSES as readonly string[]).includes(
    status.toLowerCase()
  )
}

export const unitStatusSchema = z.object({
  status: z.enum(SETTABLE_UNIT_STATUSES, { error: "Choose a status." }),
})

export type UnitStatusValues = z.infer<typeof unitStatusSchema>

/** Body for `PATCH /bookings/rooms/{id}` when only the status changes. */
export function toUnitStatusPayload(values: UnitStatusValues, userId: string) {
  return {
    status: values.status,
    changed_by: userId,
    notes: "",
  }
}

export type UnitStatusPayload = ReturnType<typeof toUnitStatusPayload>
