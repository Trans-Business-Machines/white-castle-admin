import { RequirePermission } from "@/components/auth/require-permission"
import { CateringView } from "@/components/catering/catering-view"

export default function CateringPage() {
  return (
    <RequirePermission permission="catering:view" area="catering">
      <CateringView />
    </RequirePermission>
  )
}
