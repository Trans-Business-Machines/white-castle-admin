import type { Metadata } from "next"
import { AuditLogCards } from "@/components/audits/audit-log-cards"
import { RequireRole } from "@/components/auth/require-role"
import { AUDIT_ROLES } from "@/lib/roles"

export const metadata: Metadata = { title: "Audit log" }

export default function AuditPage() {
  return (
    <RequireRole roles={AUDIT_ROLES} area="the audit log">
      <AuditLogCards />
    </RequireRole>
  )
}
