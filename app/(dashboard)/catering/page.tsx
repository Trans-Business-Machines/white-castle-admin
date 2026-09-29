import { RequireRole } from "@/components/auth/require-role"
import { CateringView } from "@/components/catering/catering-view"
import { CATERING_ROLES } from "@/lib/roles"

export default function CateringPage() {
  return (
    <RequireRole roles={CATERING_ROLES} area="catering">
      <CateringView />
    </RequireRole>
  )
}
