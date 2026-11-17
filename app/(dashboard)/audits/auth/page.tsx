import type { Metadata } from "next"
import { AuthAuditLogView } from "@/components/audits/auth-audit-log-view"
import { RequirePermission } from "@/components/auth/require-permission"
import { parseAuthAuditFilters, type AuditSearchParams } from "@/lib/audit"

export const metadata: Metadata = { title: "Authentication audit log" }

interface AuthAuditLogPageProps {
  searchParams: Promise<AuditSearchParams>
}

export default async function AuthAuditLogPage({
  searchParams,
}: AuthAuditLogPageProps) {
  const filters = parseAuthAuditFilters(await searchParams)

  return (
    <RequirePermission permission="audit:view" area="the audit log">
      <AuthAuditLogView filters={filters} />
    </RequirePermission>
  )
}
