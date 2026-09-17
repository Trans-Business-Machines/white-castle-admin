import * as React from "react"
import { cn } from "cn"

type AuthPanelProps = React.ComponentProps<"section"> & {
  title: string
  description: string
}

function AuthPanel({
  title,
  description,
  className,
  children,
  ...props
}: AuthPanelProps) {
  return (
    <section className={cn("grid gap-5", className)} {...props}>
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground capitalize">
          {title}
        </h1>
        <p className="mt-1 text-base text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  )
}

export { AuthPanel }
