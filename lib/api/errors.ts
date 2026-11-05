import { isAxiosError } from "axios"
import { humanizeSlug } from "@/lib/format"

/**
 * An error raised in the browser (not by the API) whose message is already
 * written for the user; `getApiErrorMessage` shows it as-is.
 */
export class UserFacingError extends Error {}

/** What staff see when a unique column clashes, by column name. */
const DUPLICATE_MESSAGES: Record<string, (value: string) => string> = {
  room_number: (value) => `Room ${value} already exists.`,
  email: (value) => `The email ${value} is already in use.`,
  phone: (value) => `The phone number ${value} is already in use.`,
  username: (value) => `The username ${value} is already taken.`,
  national_id: (value) => `A guest with ID ${value} already exists.`,
}

/** Database and server internals that should never reach the UI. */
const SYSTEM_MESSAGE =
  /traceback|exception|sqlalchemy|asyncpg|psycopg|\w+error:|violates .*constraint|null value in column|invalid input (syntax|value)|relation "|column "|\[sql:|detail:\s/i

/** The friendly version of a Postgres unique or foreign key violation. */
function getConstraintMessage(detail: string) {
  if (/update or delete on table .* violates foreign key/i.test(detail)) {
    return "This record is still linked to other records, so it can't be changed or removed."
  }
  if (!/duplicate key value|unique constraint/i.test(detail)) return null

  // e.g. `Key (room_number)=(001) already exists.`
  const match = detail.match(/Key \((\w+)\)=\(([^)]+)\)/)
  if (!match) return "This record already exists."

  const [, column, value] = match
  const message = DUPLICATE_MESSAGES[column]
  if (message) return message(value)
  return `${humanizeSlug(column)} ${value} already exists.`
}

/**
 * Pydantic prefixes messages from the backend's own validators, which are
 * written for people, and generates the rest ("Field required"), which
 * aren't; those return null so the caller's fallback shows instead.
 */
function getValidationMessage(item: unknown) {
  if (!item || typeof item !== "object" || !("msg" in item)) return null
  const { msg, type } = item as { msg: unknown; type?: unknown }
  if (type !== undefined && type !== "value_error") return null
  return String(msg).replace(/^Value error,\s*/, "")
}

/**
 * Turns a FastAPI-style error body, where `detail` is either a string or a
 * list of validation errors, into a message for staff. Known database
 * errors get a friendly equivalent, and anything else that exposes the
 * system (5xx responses, raw database text) becomes `fallback`.
 */
export function getApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof UserFacingError) return error.message
  if (!isAxiosError(error)) return fallback

  if (!error.response) {
    return "We couldn't reach the server. Check your connection and try again."
  }

  const detail = (error.response.data as { detail?: unknown } | undefined)
    ?.detail

  if (typeof detail === "string" && detail.trim()) {
    const constraintMessage = getConstraintMessage(detail)
    if (constraintMessage) return constraintMessage
    if (error.response.status >= 500 || SYSTEM_MESSAGE.test(detail)) {
      return fallback
    }
    return detail
  }

  if (Array.isArray(detail)) {
    const messages = detail.map(getValidationMessage)
    if (messages.length && messages.every(Boolean)) return messages.join(" ")
  }

  return fallback
}

export function getApiErrorStatus(error: unknown) {
  return isAxiosError(error) ? error.response?.status : undefined
}
