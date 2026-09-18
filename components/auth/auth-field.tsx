import * as React from "react"
import { cn } from "cn"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type AuthFieldProps = React.ComponentProps<"div"> & {
  label: string
  htmlFor: string
  error?: string
}

function AuthLabel({
  className,
  ...props
}: React.ComponentProps<typeof Label>) {
  return (
    <Label
      className={cn(
        "font-ibm-plex text-base font-semibold text-iron",
        className
      )}
      {...props}
    />
  )
}

function AuthInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  return (
    <Input
      className={cn(
        "h-12 border-iron px-3.5 text-base focus-visible:border-brand-azure focus-visible:ring-brand-azure/20 md:text-base",
        className
      )}
      {...props}
    />
  )
}

function AuthField({
  label,
  htmlFor,
  error,
  className,
  children,
  ...props
}: AuthFieldProps) {
  return (
    <div className={cn("grid gap-2", className)} {...props}>
      <AuthLabel htmlFor={htmlFor}>{label}</AuthLabel>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export { AuthField, AuthInput, AuthLabel }
