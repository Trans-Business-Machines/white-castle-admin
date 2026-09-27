import { z } from "zod"

/** How a setting's value is typed in: picks the input and its validation. */
export type SettingInputKind =
  "time" | "percentage" | "count" | "email" | "emails" | "digits" | "text"

/** Keys whose value is a comma-separated list of addresses. */
const EMAIL_LIST_KEYS = new Set(["catering_email"])

/** Keys that hold a number made of digits only, e.g. a paybill. */
const DIGIT_KEYS = new Set(["mpesa_paybill"])

export function getSettingInputKind(key: string): SettingInputKind {
  if (key.endsWith("_time")) return "time"
  if (key.endsWith("_percentage")) return "percentage"
  if (
    key.endsWith("_hours") ||
    key.endsWith("_minutes") ||
    key.endsWith("_attempts")
  ) {
    return "count"
  }
  if (EMAIL_LIST_KEYS.has(key)) return "emails"
  if (key.endsWith("_email")) return "email"
  if (DIGIT_KEYS.has(key)) return "digits"
  return "text"
}

/** The unit shown beside a numeric input, from the key's suffix. */
export function getSettingUnit(key: string) {
  if (key.endsWith("_percentage")) return "%"
  if (key.endsWith("_hours")) return "hours"
  if (key.endsWith("_minutes")) return "minutes"
  if (key.endsWith("_attempts")) return "attempts"
  return null
}

const TIME_24H = /^([01]\d|2[0-3]):[0-5]\d$/
const WHOLE_NUMBER = /^\d+$/

function splitEmails(value: string) {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
}

const isEmail = (value: string) => z.email().safeParse(value).success

/** Validation for one setting's value, chosen by its input kind. */
function valueSchema(kind: SettingInputKind) {
  const base = z.string().trim()
  switch (kind) {
    case "time":
      return base.regex(TIME_24H, "Enter a time in 24-hour format, e.g. 08:00.")
    case "percentage":
      return base
        .regex(WHOLE_NUMBER, "Enter a whole number.")
        .refine((value) => Number(value) <= 100, "Keep it between 0 and 100.")
    case "count":
      return base
        .regex(WHOLE_NUMBER, "Enter a whole number.")
        .refine((value) => Number(value) > 0, "It must be more than 0.")
    case "email":
      return base.refine(isEmail, "Enter a valid email address.")
    case "emails":
      return base
        .refine(
          (value) => splitEmails(value).length > 0,
          "Enter an email address."
        )
        .refine(
          (value) => splitEmails(value).every(isEmail),
          "Check the addresses: separate each valid email with a comma."
        )
    case "digits":
      return base
        .min(1, "Enter the number.")
        .regex(WHOLE_NUMBER, "Use digits only.")
    case "text":
      return base
        .min(1, "Enter a value.")
        .max(500, "Keep it under 500 characters.")
  }
}

/** The edit form for one setting: a single `value` field. */
export function makeSettingSchema(key: string) {
  return z.object({ value: valueSchema(getSettingInputKind(key)) })
}

export type SettingValues = z.infer<ReturnType<typeof makeSettingSchema>>

/**
 * Shapes the form into the body `PATCH /motel/settings/{key}` expects.
 * Email lists are sent without spaces ("a@x.com,b@y.com"), matching how the
 * backend documents them.
 */
export function toSettingPayload(key: string, values: SettingValues) {
  const value = values.value.trim()
  return {
    value:
      getSettingInputKind(key) === "emails"
        ? splitEmails(value).join(",")
        : value,
  }
}

export type SettingPayload = ReturnType<typeof toSettingPayload>
