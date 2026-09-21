import { format, isAfter, isValid, parseISO, startOfToday } from "date-fns"
import { z } from "zod"
import { nationalities } from "@/lib/data"
import type { Guest } from "@/lib/types"

/** ID documents a guest can register with; `value` is what the API receives. */
export const ID_TYPES = [
  { value: "national_id", label: "National ID", numberLabel: "ID number" },
  { value: "passport", label: "Passport", numberLabel: "Passport number" },
] as const

export type IdType = (typeof ID_TYPES)[number]["value"]

export const DEFAULT_ID_TYPE: IdType = "national_id"

const idTypeValues = ID_TYPES.map((type) => type.value) as [IdType, ...IdType[]]

/** "passport" → "Passport"; unknown values fall back to the raw slug. */
export function getIdTypeLabel(idType: string) {
  return ID_TYPES.find((type) => type.value === idType)?.label ?? idType
}

/** Label for the ID number field that matches the chosen document. */
export function getIdNumberLabel(idType: string) {
  return (
    ID_TYPES.find((type) => type.value === idType)?.numberLabel ?? "ID number"
  )
}

const PHONE_PATTERN = /^\+?[\d\s()-]{7,20}$/

export const guestSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Enter the guest's full name.")
    .max(255, "Keep the name under 255 characters."),
  email: z.email("Enter a valid email address."),
  phone: z
    .string()
    .trim()
    .min(1, "Enter the guest's phone number.")
    .regex(PHONE_PATTERN, "Enter a valid phone number."),
  id_type: z.enum(idTypeValues, { error: "Choose an ID type." }),
  national_id: z
    .string()
    .trim()
    .min(1, "Enter the ID number.")
    .max(50, "Keep the ID number under 50 characters."),
  nationality: z
    .string()
    .min(1, "Choose a nationality.")
    .refine(
      (value) => (nationalities as readonly string[]).includes(value),
      "Choose a nationality from the list."
    ),
  date_of_birth: z
    .date()
    .nullable()
    .refine((value) => Boolean(value), "Pick the guest's date of birth.")
    .refine(
      (value) => value === null || !isAfter(value, startOfToday()),
      "Date of birth can't be in the future."
    ),
})

export type GuestValues = z.infer<typeof guestSchema>

/** Shapes form values into the body `POST /guests/guests` expects. */
export function toGuestPayload(values: GuestValues) {
  return {
    full_name: values.full_name.trim(),
    email: values.email.trim().toLowerCase(),
    phone: values.phone.trim(),
    national_id: values.national_id.trim(),
    id_type: values.id_type,
    nationality: values.nationality,
    date_of_birth: values.date_of_birth
      ? format(values.date_of_birth, "yyyy-MM-dd")
      : null,
  }
}

export type GuestPayload = ReturnType<typeof toGuestPayload>

/**
 * Pre-fills the edit form from a guest record. The API stores the birth
 * date as "yyyy-MM-dd", so it is parsed back into a `Date` for the picker.
 */
export function toGuestFormValues(guest: Guest): GuestValues {
  const dob = guest.date_of_birth ? parseISO(guest.date_of_birth) : null
  return {
    full_name: guest.full_name,
    email: guest.email ?? "",
    phone: guest.phone ?? "",
    id_type: (ID_TYPES as readonly { value: string }[]).some(
      (type) => type.value === guest.id_type
    )
      ? (guest.id_type as IdType)
      : DEFAULT_ID_TYPE,
    national_id: guest.national_id ?? "",
    nationality: guest.nationality ?? "",
    date_of_birth: dob && isValid(dob) ? dob : null,
  }
}

export const blacklistSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(
      5,
      "Explain why this guest is being blacklisted (at least 5 characters)."
    )
    .max(500, "Keep the reason under 500 characters."),
})

export type BlacklistValues = z.infer<typeof blacklistSchema>

/** Shapes form values into the body `PATCH /guests/{id}/blacklist` expects. */
export function toBlacklistPayload(values: BlacklistValues) {
  return { reason: values.reason.trim() }
}

export type BlacklistPayload = ReturnType<typeof toBlacklistPayload>
