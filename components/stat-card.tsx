import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { cn } from "cn"
import { getRoleClasses } from "@/lib/roles"

interface Props {
  title: string
  text: string
  label: string
  /** Tints the title with the role's colour (see `lib/roles.ts`). */
  role?: string
  /** Title colour for cards that aren't about a role; ignored when `role` is set. */
  titleClassName?: string
  className?: string
}

export function StatCard({
  label,
  text,
  title,
  role,
  titleClassName,
  className,
}: Props) {
  const tone = role ? getRoleClasses(role) : null

  return (
    <Card className="h-full border-iron shadow-md">
      <CardContent className="flex-1">
        {/* `font-poppins!` beats CardTitle's own `font-heading`; `cn` doesn't dedupe. */}
        <CardTitle
          className={cn(
            "font-poppins! font-bold uppercase",
            tone ? tone.text : (titleClassName ?? "text-neutral")
          )}
        >
          {title}
        </CardTitle>

        <div className="mt-auto">
          <h3
            className={cn(
              "font-poppins text-3xl font-bold text-navy-azul",
              className
            )}
          >
            {text}
          </h3>
          <p className="font-poppins text-sm text-ring">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}
