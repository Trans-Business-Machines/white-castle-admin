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
    <Card className="border-iron shadow-md">
      <CardContent>
        <CardTitle
          className={cn(
            "font-heading font-bold uppercase",
            tone ? tone.text : (titleClassName ?? "text-neutral")
          )}
        >
          {title}
        </CardTitle>

        <div>
          <h3
            className={cn(
              "font-heading text-3xl font-bold text-navy-azul",
              className
            )}
          >
            {text}
          </h3>
          <p className="font-sans text-sm text-ring">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}
