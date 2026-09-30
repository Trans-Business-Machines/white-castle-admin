import type { Metadata } from "next"
import { ServicesAuditLogView } from "@/components/audits/services-audit-log-view"
import { RequireRole } from "@/components/auth/require-role"
import { parseServicesAuditFilters, type AuditSearchParams } from "@/lib/audit"
import { AUDIT_ROLES } from "@/lib/roles"

export const metadata: Metadata = { title: "Cross-service audit log" }

interface ServicesAuditLogPageProps {
  searchParams: Promise<AuditSearchParams>
}

export default async function ServicesAuditLogPage({
  searchParams,
}: ServicesAuditLogPageProps) {
  const filters = parseServicesAuditFilters(await searchParams)

  return (
    <RequireRole roles={AUDIT_ROLES} area="the audit log">
      <ServicesAuditLogView filters={filters} />
    </RequireRole>
  )
}
