"use client"

import {
  AuditFilterBar,
  AuditUsernameField,
} from "@/components/audits/audit-filter-bar"
import { ReportSelectField } from "@/components/reports/report-param-fields"
import type { AuthAuditFilters } from "@/lib/api/audit"
import {
  AUTH_AUDIT_ACTION_OPTIONS,
  DEFAULT_AUTH_AUDIT_FILTERS,
} from "@/lib/audit"

interface AuthAuditFilterBarProps {
  applied: AuthAuditFilters
  onApply: (filters: AuthAuditFilters) => void
}

/** The auth log's filters: username and action (Clear → everyone, every action). */
export function AuthAuditFilterBar({
  applied,
  onApply,
}: AuthAuditFilterBarProps) {
  return (
    <AuditFilterBar
      applied={applied}
      defaults={DEFAULT_AUTH_AUDIT_FILTERS}
      onApply={onApply}
      renderFields={(draft, update) => (
        <div className="grid gap-4 md:grid-cols-2">
          <AuditUsernameField
            id="auth-audit-username"
            value={draft.username}
            onChange={(username) => update({ username })}
          />
          <ReportSelectField
            id="auth-audit-action"
            label="Action"
            allLabel="All actions"
            value={draft.action}
            options={AUTH_AUDIT_ACTION_OPTIONS}
            onChange={(action) => update({ action })}
          />
        </div>
      )}
    />
  )
}
