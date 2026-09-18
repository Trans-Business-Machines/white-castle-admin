import { Loader2 } from "lucide-react"

function WorkspaceLoader() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-svh flex-col items-center justify-center gap-2 bg-porcelain px-4 dark:bg-background"
    >
      <Loader2
        aria-hidden="true"
        className="size-10 animate-spin text-brand-azure"
      />
      <p className="text-sm font-medium text-muted-foreground">
        Loading your workspace
      </p>
    </div>
  )
}

export { WorkspaceLoader }
