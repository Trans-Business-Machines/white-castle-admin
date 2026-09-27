import { type Metadata } from "next"
import { RequireRole } from "@/components/auth/require-role"
import { SettingsList } from "@/components/settings/settings-list"
import { SETTINGS_ROLES } from "@/lib/roles"

export const metadata: Metadata = {
  title: "Settings",
}

export default function SettingsPage() {
  return (
    <RequireRole roles={SETTINGS_ROLES} area="settings">
      <section>
        <SettingsList />
      </section>
    </RequireRole>
  )
}
