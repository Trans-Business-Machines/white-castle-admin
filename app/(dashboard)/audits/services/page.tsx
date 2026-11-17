import type { Metadata } from "next"
import { ServicesAuditLogView } from "@/components/audits/services-audit-log-view"
import { RequirePermission } from "@/components/auth/require-permission"
import { parseServicesAuditFilters, type AuditSearchParams } from "@/lib/audit"

export const metadata: Metadata = { title: "Cross-service audit log" }

interface ServicesAuditLogPageProps {
  searchParams: Promise<AuditSearchParams>
}

export default async function ServicesAuditLogPage({
  searchParams,
}: ServicesAuditLogPageProps) {
  const filters = parseServicesAuditFilters(await searchParams)

  return (
    <RequirePermission permission="reports:audit" area="the audit log">
      <ServicesAuditLogView filters={filters} />
    </RequirePermission>
  )
}
