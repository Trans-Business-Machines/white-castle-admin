import Link from "next/link"
import { ArrowLeft, SearchX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface NotFoundCopy {
  /** Where the "go back" button points. */
  href: string
  /** Label on that button. */
  action: string
  description: string
}

/** Copy for a visitor who is signed in: send them back into the app. */
export const DASHBOARD_NOT_FOUND: NotFoundCopy = {
  href: "/dashboard",
  action: "Back to dashboard",
  description:
    "That page doesn't exist, or it may have been moved. Head back to the dashboard and pick up from there.",
}

/** Copy for a signed-out visitor: send them to the sign-in screen. */
export const AUTH_NOT_FOUND: NotFoundCopy = {
  href: "/login",
  action: "Back to sign in",
  description:
    "That page doesn't exist. Sign in to get to your workspace, or check the address and try again.",
}

type NotFoundViewProps = NotFoundCopy & {
  className?: string
}

/**
 * The shared 404 body. It carries no page chrome of its own, so each
 * `not-found.tsx` can drop it into whatever layout it already sits in.
 */
function NotFoundView({
  href,
  action,
  description,
  className,
}: NotFoundViewProps) {
  return (
    <section
      className={cn("grid justify-items-center gap-6 text-center", className)}
    >
      <span
        aria-hidden="true"
        className="flex size-14 items-center justify-center rounded-full bg-brand-azure/10 text-brand-azure"
      >
        <SearchX className="size-7" />
      </span>

      <div>
        <p className="font-mono text-sm font-semibold tracking-[0.25em] text-brand-azure">
          404
        </p>
        <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight text-foreground">
          Page not found
        </h1>
        <p className="mt-2 text-base text-pretty text-muted-foreground">
          {description}
        </p>
      </div>

      <Button asChild size="lg">
        <Link href={href}>
          <ArrowLeft />
          {action}
        </Link>
      </Button>
    </section>
  )
}

export { NotFoundView }
