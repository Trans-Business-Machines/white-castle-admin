import { cn } from "cn"
import { Ban } from "lucide-react"

/** Small rose pill shown next to a blacklisted guest's name. */
function GuestBlacklistBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap text-rose-800 dark:bg-rose-500/15 dark:text-rose-300",
        className
      )}
    >
      <Ban aria-hidden="true" className="size-3" />
      Blacklisted
    </span>
  )
}

export { GuestBlacklistBadge }
