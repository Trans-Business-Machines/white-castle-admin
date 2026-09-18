import { z } from "zod"

/** Image types `POST /media/upload/room-photo/{room_id}` accepts. */
export const ROOM_PHOTO_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const

export const ROOM_PHOTO_MAX_BYTES = 5 * 1024 * 1024

/** Returns a message when `file` can't be uploaded as a room photo. */
export function getRoomPhotoError(file: File) {
  if (!(ROOM_PHOTO_TYPES as readonly string[]).includes(file.type)) {
    return "Use a JPEG, PNG or WebP image."
  }
  if (file.size > ROOM_PHOTO_MAX_BYTES) {
    return "Keep the image under 5 MB."
  }
  return null
}

export const amenitySchema = z
  .string()
  .trim()
  .min(2, "Enter an amenity of at least 2 characters.")
  .max(50, "Keep the amenity under 50 characters.")

/** Room types staff can pick; the value is what `POST /bookings/rooms` receives. */
export const ROOM_TYPES = [
  { value: "single", label: "Single" },
  { value: "1_bedroom", label: "1 bedroom" },
  { value: "2_bedroom", label: "2 bedroom" },
] as const

export type RoomType = (typeof ROOM_TYPES)[number]["value"]

const roomTypeValues = ROOM_TYPES.map((type) => type.value) as [
  RoomType,
  ...RoomType[],
]

export const unitsSchema = z.object({
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
  base_rate: z
    .number({ error: "Enter the nightly rate." })
    .positive("The rate must be greater than 0."),
  amenities: z.array(amenitySchema),
  // `File` only exists in the browser, so we validate it structurally.
  photo: z
    .custom<File | null>((value) => value === null || value instanceof File)
    .superRefine((file, ctx) => {
      if (!file) return
      const message = getRoomPhotoError(file)
      if (message) ctx.addIssue({ code: "custom", message })
    }),
})

export type UnitType = z.infer<typeof unitsSchema>

/** Shapes form values into the body `POST /bookings/rooms` expects. */
export function toUnitPayload(values: UnitType) {
  return {
    room_number: values.room_number.trim(),
    room_type: values.room_type,
    description: values.description.trim(),
    max_occupancy: values.max_occupancy,
    base_rate: values.base_rate,
    amenities: values.amenities.map((amenity) => amenity.trim()),
  }
}

export type UnitPayload = ReturnType<typeof toUnitPayload>
