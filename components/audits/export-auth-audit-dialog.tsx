"use client"

import {
  inputClassName,
  labelClassName,
} from "@/components/bookings/booking-form-fields"
import { ExportCsvDialog } from "@/components/export-csv-dialog"
import {
  ReportDateRangeFields,
  ReportSelectField,
} from "@/components/reports/report-param-fields"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { exportAuthAuditLog, type AuthAuditFilters } from "@/lib/api/audit"
import { AUTH_AUDIT_ACTION_OPTIONS } from "@/lib/audit"

/**
 * Auth audit log CSV export (`GET /auth/audit-log/export`): optional date
 * range, username and action. Each open starts on the table's applied
 * username and action.
 */
export function ExportAuthAuditDialog({
  filters,
}: {
  filters: AuthAuditFilters
}) {
  return (
    <ExportCsvDialog
      noun="audit log"
      description="Every filter is optional. Leave them empty to download the whole authentication audit log."
      initialFilters={() => ({
        from_date: "",
        to_date: "",
        ...filters,
      })}
      renderFields={(filters, update) => (
        <>
          <ReportDateRangeFields
            idPrefix="auth-audit-export"
            value={filters}
            onChange={update}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid min-w-0 gap-2">
              <Label
                htmlFor="auth-audit-export-username"
                className={labelClassName}
              >
                Username
              </Label>
              <Input
                id="auth-audit-export-username"
                value={filters.username}
                onChange={(event) => update({ username: event.target.value })}
                placeholder="Any user"
                autoComplete="off"
                spellCheck={false}
                className={inputClassName}
              />
            </div>
            <ReportSelectField
              id="auth-audit-export-action"
              label="Action"
              allLabel="All actions"
              value={filters.action}
              options={AUTH_AUDIT_ACTION_OPTIONS}
              onChange={(next) => update({ action: next })}
            />
          </div>
        </>
      )}
      exportFile={exportAuthAuditLog}
      submitLabel="Download"
    />
  )
}
