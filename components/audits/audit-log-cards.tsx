import Link from "next/link"
import { cn } from "cn"
import { ScrollText } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AUDIT_LOG_TYPES,
  getAuditLogHref,
  type AuditLogType,
} from "@/lib/audit"

/** Same surface as the report cards. */
const cardClassName =
  "flex flex-col rounded-xl bg-card p-5 shadow-sm ring-1 ring-foreground/10"

const ctaClassName =
  "h-10 rounded-md bg-brand-azure px-4 text-white hover:bg-brand-azure/90 focus-visible:ring-brand-azure/30"

/** One card per audit log (`AUDIT_LOG_TYPES`), each opening its own page. */
export function AuditLogCards() {
  return (
    <ul className="grid gap-5 md:grid-cols-2">
      {AUDIT_LOG_TYPES.map((log) => (
        <li key={log.slug} className="flex">
          <AuditLogCard log={log} />
        </li>
      ))}
    </ul>
  )
}

function AuditLogCard({ log }: { log: AuditLogType }) {
  const Icon = log.icon
  const headingId = `audit-${log.slug}`

  return (
    <article
      aria-labelledby={headingId}
      className={cn(cardClassName, "w-full")}
    >
      <span
        aria-hidden="true"
        className="flex size-11 items-center justify-center rounded-lg bg-brand-azure/10 text-brand-navy dark:bg-muted dark:text-foreground"
      >
        <Icon className="size-5" />
      </span>

      <h2
        id={headingId}
        className="mt-4 font-heading text-lg font-bold text-brand-navy dark:text-foreground"
      >
        {log.title}
      </h2>
      <p className="mt-1.5 flex-1 text-sm text-pretty text-muted-foreground">
        {log.description}
      </p>

      <div className="mt-5">
        {log.available ? (
          <Button asChild className={ctaClassName}>
            <Link href={getAuditLogHref(log.slug)}>
              <ScrollText aria-hidden="true" />
              View audit log
            </Link>
          </Button>
        ) : (
          <Button type="button" disabled className={ctaClassName}>
            <ScrollText aria-hidden="true" />
            Coming soon
          </Button>
        )}
      </div>
    </article>
  )
}
