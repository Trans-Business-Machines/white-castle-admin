import { type Metadata } from "next"
import { RequirePermission } from "@/components/auth/require-permission"
import { SettingsList } from "@/components/settings/settings-list"

export const metadata: Metadata = {
  title: "Settings",
}

export default function SettingsPage() {
  return (
    <RequirePermission permission="settings:view" area="settings">
      <section>
        <SettingsList />
      </section>
    </RequirePermission>
  )
}
