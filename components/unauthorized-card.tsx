import Link from "next/link"
import { ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface Props {
  /** What the visitor tried to open, e.g. "user management". */
  area: string
}

/** Full-width notice shown in place of a page the signed-in role may not open. */
export function UnauthorizedCard({ area }: Props) {
  return (
    <div className="flex justify-center py-12">
      <Card className="w-full max-w-md items-center text-center">
        <CardHeader className="w-full items-center">
          <div className="mb-2 flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert aria-hidden="true" className="size-7" />
          </div>
          <CardTitle className="font-heading text-xl font-bold">
            Unauthorized access
          </CardTitle>
          <CardDescription className="text-balance">
            Your account does not have permission to view {area}. If you think
            you should have access, ask an administrator to update your role.
          </CardDescription>
        </CardHeader>
        <CardContent />
        <CardFooter className="justify-center">
          <Button
            asChild
            className="bg-brand-azure text-white hover:bg-brand-azure/90"
          >
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
