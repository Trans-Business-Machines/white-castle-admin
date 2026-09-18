import { Card, CardTitle, CardContent } from "@/components/ui/card"
import { cn } from "cn"

interface Props {
  title: string
  text: string
  label: string
  className?: string
}

export function StatCard({ label, text, title, className }: Props) {
  return (
    <Card className="border-iron shadow-md">
      <CardContent>
        <CardTitle className="font-heading text-neutral uppercase">
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
