"use client"

import { ServicesAuditFields } from "@/components/audits/services-audit-filters"
import { ExportCsvDialog } from "@/components/export-csv-dialog"
import {
  exportServicesAuditLog,
  type ServicesAuditFilters,
} from "@/lib/api/audit"

/**
 * Cross-service audit log CSV export (`GET /motel/reports/audit/export`):
 * the same filters as the list. Each open starts on the table's applied
 * filters, so "export what I'm looking at" is one click.
 */
export function ExportServicesAuditDialog({
  filters,
}: {
  filters: ServicesAuditFilters
}) {
  return (
    <ExportCsvDialog
      noun="audit log"
      description="Pick a service, then narrow it down by date, username or action. Leave those empty to download the service's whole audit log."
      initialFilters={() => filters}
      renderFields={(values, update) => (
        <ServicesAuditFields
          idPrefix="services-audit-export"
          value={values}
          onChange={update}
          className="grid gap-4 sm:grid-cols-3"
          datesClassName="sm:col-span-3"
        />
      )}
      exportFile={exportServicesAuditLog}
      submitLabel="Download"
    />
  )
}
