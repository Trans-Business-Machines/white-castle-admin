import { downloadCsv } from "@/lib/api/files"
import type { ReportDateRange } from "@/lib/api/reports"
import { axiosInstance } from "@/lib/axios"
import type { AuditService } from "@/lib/audit"
import type { AuditLogPage, ServicesAuditLog } from "@/lib/types"

/** Filters of `GET /auth/audit-log`; "" means "not filtered". */
export interface AuthAuditFilters {
  username: string
  action: string
}

export type AuthAuditLogParams = AuthAuditFilters & {
  limit: number
  offset: number
}

export const auditQueryKey = ["audit"] as const

/** Prefixed by `auditQueryKey`, so invalidating that refreshes every page. */
export function authAuditLogQueryKey(params: AuthAuditLogParams) {
  return ["audit", "auth", params] as const
}

/** Drops the filters that are "" so they aren't sent at all. */
function toAuditParams(params: object) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== "")
  )
}

/**
 * GET /auth/audit-log?username&action&limit&offset → one page of auth
 * events, newest first.
 */
export async function fetchAuthAuditLog(params: AuthAuditLogParams) {
  const response = await axiosInstance.get<AuditLogPage>("/auth/audit-log", {
    params: toAuditParams(params),
  })
  return response.data
}

/** Query params of `GET /auth/audit-log/export`; "" means "not filtered". */
export interface AuthAuditExportFilters extends ReportDateRange {
  username: string
  action: string
}

/** GET /auth/audit-log/export → the auth audit log as CSV, set filters only. */
export function exportAuthAuditLog(filters: AuthAuditExportFilters) {
  return downloadCsv(
    "/auth/audit-log/export",
    { ...filters, username: filters.username.trim() },
    "auth-audit-log"
  )
}

/** Filters of `GET /motel/reports/audit`; "" means "not filtered". */
export interface ServicesAuditFilters extends ReportDateRange {
  username: string
  action: string
  service: AuditService
}

export type ServicesAuditLogParams = ServicesAuditFilters & {
  limit: number
  offset: number
}

export function servicesAuditLogQueryKey(params: ServicesAuditLogParams) {
  return ["audit", "services", params] as const
}

/** GET /motel/reports/audit → one page of a service's events, set filters only. */
export async function fetchServicesAuditLog(params: ServicesAuditLogParams) {
  const response = await axiosInstance.get<ServicesAuditLog>(
    "/motel/reports/audit",
    { params: toAuditParams(params) }
  )
  return response.data
}

/**
 * GET /motel/reports/audit/export → a service's audit log as CSV, with the
 * same filters as the list (set ones only).
 */
export function exportServicesAuditLog(filters: ServicesAuditFilters) {
  return downloadCsv(
    "/motel/reports/audit/export",
    { ...filters, username: filters.username.trim() },
    `${filters.service}-audit-log`
  )
}
