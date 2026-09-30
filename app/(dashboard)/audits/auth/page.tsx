import type { Metadata } from "next"
import { AuthAuditLogView } from "@/components/audits/auth-audit-log-view"
import { RequireRole } from "@/components/auth/require-role"
import { parseAuthAuditFilters, type AuditSearchParams } from "@/lib/audit"
import { AUDIT_ROLES } from "@/lib/roles"

export const metadata: Metadata = { title: "Authentication audit log" }

interface AuthAuditLogPageProps {
  searchParams: Promise<AuditSearchParams>
}

export default async function AuthAuditLogPage({
  searchParams,
}: AuthAuditLogPageProps) {
  const filters = parseAuthAuditFilters(await searchParams)

  return (
    <RequireRole roles={AUDIT_ROLES} area="the audit log">
      <AuthAuditLogView filters={filters} />
    </RequireRole>
  )
}
