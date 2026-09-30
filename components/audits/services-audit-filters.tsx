"use client"

import {
  AuditFilterBar,
  AuditUsernameField,
} from "@/components/audits/audit-filter-bar"
import {
  inputClassName,
  labelClassName,
} from "@/components/bookings/booking-form-fields"
import {
  ReportDateRangeFields,
  ReportSelectField,
} from "@/components/reports/report-param-fields"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { ServicesAuditFilters } from "@/lib/api/audit"
import {
  AUDIT_SERVICES,
  DEFAULT_SERVICES_AUDIT_FILTERS,
  getAuditServiceActionOptions,
  type AuditService,
} from "@/lib/audit"

interface ServicesAuditFilterBarProps {
  applied: ServicesAuditFilters
  onApply: (filters: ServicesAuditFilters) => void
}

/**
 * The cross-service log's filters: dates, username, service and action.
 * Clear filters goes back to bookings, every action.
 */
export function ServicesAuditFilterBar({
  applied,
  onApply,
}: ServicesAuditFilterBarProps) {
  return (
    <AuditFilterBar
      applied={applied}
      defaults={DEFAULT_SERVICES_AUDIT_FILTERS}
      onApply={onApply}
      renderFields={(draft, update) => (
        <ServicesAuditFields
          idPrefix="services-audit"
          value={draft}
          onChange={update}
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-5"
          datesClassName="md:col-span-2"
        />
      )}
    />
  )
}

interface ServicesAuditFieldsProps {
  /** Prefix for the inputs' ids, e.g. "services-audit". */
  idPrefix: string
  value: ServicesAuditFilters
  onChange: (patch: Partial<ServicesAuditFilters>) => void
  /** The grid the fields sit in. */
  className: string
  /** Column span of the from / to pair within that grid. */
  datesClassName: string
}

/**
 * Dates, username, service and the service's actions: the filters of
 * `GET /motel/reports/audit`, shared by the filter bar and the CSV export.
 */
export function ServicesAuditFields({
  idPrefix,
  value,
  onChange,
  className,
  datesClassName,
}: ServicesAuditFieldsProps) {
  return (
    <div className={className}>
      <div className={datesClassName}>
        <ReportDateRangeFields
          idPrefix={idPrefix}
          value={value}
          onChange={onChange}
        />
      </div>

      <AuditUsernameField
        id={`${idPrefix}-username`}
        value={value.username}
        onChange={(username) => onChange({ username })}
      />

      <div className="grid min-w-0 gap-2">
        <Label htmlFor={`${idPrefix}-service`} className={labelClassName}>
          Service
        </Label>
        <Select
          value={value.service}
          // Each service logs its own actions, so the old one can't carry over.
          onValueChange={(service) =>
            onChange({ service: service as AuditService, action: "" })
          }
        >
          <SelectTrigger
            id={`${idPrefix}-service`}
            className={`${inputClassName} w-full data-[size=default]:h-11`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AUDIT_SERVICES.map((service) => (
              <SelectItem key={service.value} value={service.value}>
                {service.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ReportSelectField
        id={`${idPrefix}-action`}
        label="Action"
        allLabel="All actions"
        value={value.action}
        options={getAuditServiceActionOptions(value.service)}
        onChange={(action) => onChange({ action })}
      />
    </div>
  )
}
