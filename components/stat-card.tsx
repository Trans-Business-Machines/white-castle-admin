import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { cn } from "cn"
import { getRoleClasses } from "@/lib/roles"

interface Props {
  title: string
  text: string
  label: string
  role?: string
  className?: string
}

export function StatCard({ label, text, title, role, className }: Props) {
  const tone = role ? getRoleClasses(role) : null

  return (
    <Card className="border-iron shadow-md">
      <CardContent>
        <CardTitle
          className={cn(
            "font-heading uppercase font-bold",
            tone ? tone.text : "text-neutral"
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
