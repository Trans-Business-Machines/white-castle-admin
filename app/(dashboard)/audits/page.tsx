import type { Metadata } from "next"
import { AuditLogCards } from "@/components/audits/audit-log-cards"
import { RequirePermission } from "@/components/auth/require-permission"

export const metadata: Metadata = { title: "Audit log" }

export default function AuditPage() {
  return (
    <RequirePermission
      anyPermission={["audit:view", "reports:audit"]}
      area="the audit log"
    >
      <AuditLogCards />
    </RequirePermission>
  )
}
