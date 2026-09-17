"use client"

import * as React from "react"
import { cn } from "cn"
import { EyeIcon, EyeOffIcon } from "lucide-react"

import { AuthInput } from "@/components/auth/auth-field"

function PasswordInput({
  className,
  ...props
}: Omit<React.ComponentProps<typeof AuthInput>, "type">) {
  const [visible, setVisible] = React.useState(false)

  return (
    <div className="relative">
      <AuthInput
        type={visible ? "text" : "password"}
        className={cn("pr-12", className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-controls={props.id}
        aria-pressed={visible}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute inset-y-1 right-1 flex items-center rounded-sm px-2 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {visible ? (
          <EyeOffIcon className="size-5" color="#475569" />
        ) : (
          <EyeIcon className="size-5" color="#475569" />
        )}
      </button>
    </div>
  )
}

export { PasswordInput }
