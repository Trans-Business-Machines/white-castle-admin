import { KeyRound, Network, type LucideIcon } from "lucide-react"
import type { AuthAuditFilters, ServicesAuditFilters } from "@/lib/api/audit"
import { formatDate, humanizeSlug } from "@/lib/format"
import { parseReportDateRange } from "@/lib/reports"
import type { AuditLogEntry } from "@/lib/types"

/** URL segment of each audit log: `/audits/<slug>`. */
export type AuditLogSlug = "auth" | "services"

export interface AuditLogType {
  slug: AuditLogSlug
  title: string
  description: string
  icon: LucideIcon
  /** False until the log's endpoint is wired up; its CTA is then disabled. */
  available: boolean
}

/** The audit logs offered on `/audits`, in display order. */
export const AUDIT_LOG_TYPES: readonly AuditLogType[] = [
  {
    slug: "auth",
    title: "Authentication audit log",
    description:
      "Auth service audit log: login events and user management only.",
    icon: KeyRound,
    available: true,
  },
  {
    slug: "services",
    title: "Cross-service audit log",
    description:
      "A cross-service audit log for all the other services: bookings, payments, guests and the motel.",
    icon: Network,
    available: true,
  },
]

/** `/audits/<slug>?…`, leaving out the params that are empty. */
export function getAuditLogHref(slug: AuditLogSlug, params: object = {}) {
  const search = new URLSearchParams(
    Object.entries(params).filter(
      (entry): entry is [string, string] =>
        typeof entry[1] === "string" && entry[1] !== ""
    )
  ).toString()
  return search ? `/audits/${slug}?${search}` : `/audits/${slug}`
}

/** The `action` values `GET /auth/audit-log` accepts. */
export const AUTH_AUDIT_ACTIONS = [
  "LOGIN_SUCCESS",
  "LOGIN_FAILED",
  "ACCOUNT_LOCKED",
  "USER_CREATED",
  "USER_UPDATED",
  "USER_DISABLED",
  "USER_ENABLED",
  "USER_UNLOCKED",
  "USER_DELETED",
  "PASSWORD_RESET",
] as const

const AUDIT_ACTION_LABELS: Record<string, string> = {
  LOGIN_SUCCESS: "Signed in",
  LOGIN_FAILED: "Sign-in failed",
  ACCOUNT_LOCKED: "Account locked",
  USER_CREATED: "User created",
  USER_UPDATED: "User updated",
  USER_DISABLED: "User disabled",
  USER_ENABLED: "User enabled",
  USER_UNLOCKED: "User unlocked",
  USER_DELETED: "User deleted",
  PASSWORD_RESET: "Password reset",
  BOOKING_APPROVED: "Booking approved",
  BOOKING_REJECTED: "Booking rejected",
  BOOKING_CANCELLED: "Booking cancelled",
  BOOKING_CHECKIN: "Checked in",
  BOOKING_CHECKOUT: "Checked out",
  BOOKING_EXTENDED: "Stay extended",
  BOOKING_EXTRA_PERSONS: "Extra persons added",
  BOOKING_UPDATE: "Booking updated",
  BOOKING_DELETED: "Booking deleted",
  ROOM_UPDATED: "Room updated",
  PAYMENT_VERIFIED: "Payment verified",
  PAYMENT_REJECTED: "Payment rejected",
  GUEST_CREATED: "Guest created",
  GUEST_UPDATED: "Guest updated",
  GUEST_DELETED: "Guest deleted",
  GUEST_BLACKLISTED: "Guest blacklisted",
  GUEST_UNBLACKLISTED: "Removed from blacklist",
  GUEST_ID_ACCESSED: "ID document viewed",
  MAINTENANCE_REPORTED: "Maintenance reported",
  MAINTENANCE_RESOLVED: "Maintenance resolved",
  HOUSEKEEPING_COMPLETED: "Housekeeping completed",
  SETTING_UPDATED: "Setting updated",
}

/** "LOGIN_FAILED" → "Sign-in failed"; unknown actions get a readable form. */
export function getAuditActionLabel(action: string) {
  return AUDIT_ACTION_LABELS[action] ?? humanizeSlug(action.toLowerCase())
}

/** The auth actions as select options, for the table's filter. */
export const AUTH_AUDIT_ACTION_OPTIONS = AUTH_AUDIT_ACTIONS.map((action) => ({
  value: action,
  label: getAuditActionLabel(action),
}))

const SUCCESS_BADGE =
  "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300"
const WARNING_BADGE =
  "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
const DANGER_BADGE =
  "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300"
const CHANGE_BADGE = "bg-brand-azure/10 text-brand-azure dark:text-sky-300"
const NEUTRAL_BADGE = "bg-muted text-muted-foreground"

/**
 * Pill tone per action: green for access granted or restored and work
 * signed off, amber for a failed attempt or something needing a look, rose
 * for access or records taken away, blue for everyday changes.
 */
const AUDIT_ACTION_BADGES: Record<string, string> = {
  LOGIN_SUCCESS: SUCCESS_BADGE,
  USER_ENABLED: SUCCESS_BADGE,
  USER_UNLOCKED: SUCCESS_BADGE,
  LOGIN_FAILED: WARNING_BADGE,
  ACCOUNT_LOCKED: DANGER_BADGE,
  USER_DISABLED: DANGER_BADGE,
  USER_DELETED: DANGER_BADGE,
  USER_CREATED: CHANGE_BADGE,
  USER_UPDATED: CHANGE_BADGE,
  PASSWORD_RESET: CHANGE_BADGE,
  BOOKING_APPROVED: SUCCESS_BADGE,
  BOOKING_CHECKIN: SUCCESS_BADGE,
  BOOKING_CHECKOUT: SUCCESS_BADGE,
  PAYMENT_VERIFIED: SUCCESS_BADGE,
  GUEST_UNBLACKLISTED: SUCCESS_BADGE,
  MAINTENANCE_RESOLVED: SUCCESS_BADGE,
  HOUSEKEEPING_COMPLETED: SUCCESS_BADGE,
  MAINTENANCE_REPORTED: WARNING_BADGE,
  GUEST_ID_ACCESSED: WARNING_BADGE,
  BOOKING_REJECTED: DANGER_BADGE,
  BOOKING_CANCELLED: DANGER_BADGE,
  BOOKING_DELETED: DANGER_BADGE,
  PAYMENT_REJECTED: DANGER_BADGE,
  GUEST_DELETED: DANGER_BADGE,
  GUEST_BLACKLISTED: DANGER_BADGE,
  BOOKING_EXTENDED: CHANGE_BADGE,
  BOOKING_EXTRA_PERSONS: CHANGE_BADGE,
  BOOKING_UPDATE: CHANGE_BADGE,
  ROOM_UPDATED: CHANGE_BADGE,
  GUEST_CREATED: CHANGE_BADGE,
  GUEST_UPDATED: CHANGE_BADGE,
  SETTING_UPDATED: CHANGE_BADGE,
}

/** Pill tone for an audit action; unknown actions go neutral. */
export function getAuditActionClasses(action: string) {
  return AUDIT_ACTION_BADGES[action] ?? NEUTRAL_BADGE
}

/** Raw `searchParams` of an audit page, as Next hands them over. */
export type AuditSearchParams = Record<string, string | string[] | undefined>

/** Where the auth log starts, and what Clear filters goes back to. */
export const DEFAULT_AUTH_AUDIT_FILTERS: AuthAuditFilters = {
  username: "",
  action: "",
}

/** Reads the auth log filters out of the URL; an unknown action is dropped. */
export function parseAuthAuditFilters(
  params: AuditSearchParams
): AuthAuditFilters {
  const { action, username } = params
  return {
    username: typeof username === "string" ? username.trim() : "",
    action:
      typeof action === "string" &&
      (AUTH_AUDIT_ACTIONS as readonly string[]).includes(action)
        ? action
        : "",
  }
}

/** "30 Sep 2026, 07:11:33 PM"; audit rows need the seconds. */
export function formatAuditTimestamp(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? "—"
    : formatDate(date, "dd MMM yyyy, hh:mm:ss a")
}

/**
 * The services `GET /motel/reports/audit` covers, with the actions each one
 * logs (the action filter follows the chosen service).
 */
export const AUDIT_SERVICES = [
  {
    value: "bookings",
    label: "Bookings",
    actions: [
      "BOOKING_APPROVED",
      "BOOKING_REJECTED",
      "BOOKING_CANCELLED",
      "BOOKING_CHECKIN",
      "BOOKING_CHECKOUT",
      "BOOKING_EXTENDED",
      "BOOKING_EXTRA_PERSONS",
      "BOOKING_UPDATE",
    ],
  },
  {
    value: "payments",
    label: "Payments",
    actions: ["PAYMENT_VERIFIED", "PAYMENT_REJECTED"],
  },
  {
    value: "guests",
    label: "Guests",
    actions: [
      "GUEST_CREATED",
      "GUEST_UPDATED",
      "GUEST_DELETED",
      "GUEST_BLACKLISTED",
      "GUEST_UNBLACKLISTED",
      "GUEST_ID_ACCESSED",
    ],
  },
  {
    value: "motel",
    label: "Motel",
    actions: [
      "MAINTENANCE_REPORTED",
      "MAINTENANCE_RESOLVED",
      "HOUSEKEEPING_COMPLETED",
      "SETTING_UPDATED",
    ],
  },
] as const satisfies readonly {
  value: string
  label: string
  actions: readonly string[]
}[]

export type AuditService = (typeof AUDIT_SERVICES)[number]["value"]

function findAuditService(value: string) {
  return AUDIT_SERVICES.find((service) => service.value === value)
}

/** The service's actions as select options, for the action filter. */
export function getAuditServiceActionOptions(service: AuditService) {
  return (findAuditService(service)?.actions ?? []).map((action) => ({
    value: action,
    label: getAuditActionLabel(action),
  }))
}

export function getAuditServiceLabel(service: string) {
  return findAuditService(service)?.label ?? humanizeSlug(service)
}

/** Where the cross-service log starts, and what Clear filters goes back to. */
export const DEFAULT_SERVICES_AUDIT_FILTERS: ServicesAuditFilters = {
  from_date: "",
  to_date: "",
  username: "",
  service: "bookings",
  action: "",
}

/**
 * Reads the cross-service filters out of the URL: an unknown service falls
 * back to bookings, and an action the service doesn't log is dropped.
 */
export function parseServicesAuditFilters(
  params: AuditSearchParams
): ServicesAuditFilters {
  const service =
    findAuditService(
      typeof params.service === "string" ? params.service : ""
    ) ?? AUDIT_SERVICES[0]
  const action = typeof params.action === "string" ? params.action : ""
  const username = typeof params.username === "string" ? params.username : ""
  return {
    ...parseReportDateRange(params),
    username: username.trim(),
    service: service.value,
    action: (service.actions as readonly string[]).includes(action)
      ? action
      : "",
  }
}

/**
 * `details` as an object: the services log sends it as a JSON string, the
 * auth log as null. Anything that isn't a JSON object gives null.
 */
export function parseAuditDetails(
  details: AuditLogEntry["details"]
): Record<string, unknown> | null {
  let value = details
  if (typeof value === "string") {
    try {
      value = JSON.parse(value)
    } catch {
      return null
    }
  }
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}
