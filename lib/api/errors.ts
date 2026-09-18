import { isAxiosError } from "axios"

/**
 * Pulls a human-readable message out of a FastAPI-style error body, where
 * `detail` is either a string or a list of validation errors.
 */
export function getApiErrorMessage(error: unknown, fallback: string) {
  if (!isAxiosError(error)) return fallback

  if (!error.response) {
    return "We couldn't reach the server. Check your connection and try again."
  }

  const detail = (error.response.data as { detail?: unknown } | undefined)
    ?.detail

  if (typeof detail === "string" && detail.trim()) return detail

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) =>
        item && typeof item === "object" && "msg" in item
          ? String((item as { msg: unknown }).msg)
          : null
      )
      .filter(Boolean)
    if (messages.length) return messages.join(" ")
  }

  return fallback
}

export function getApiErrorStatus(error: unknown) {
  return isAxiosError(error) ? error.response?.status : undefined
}
