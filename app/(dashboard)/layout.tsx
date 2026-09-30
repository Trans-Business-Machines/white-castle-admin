import { type PropsWithChildren } from "react"
import { RequireAuth } from "@/components/auth/require-auth"
import { RequireRouteAccess } from "@/components/auth/require-route-access"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default function DashboardLayout({ children }: PropsWithChildren) {
  return (
    <RequireAuth>
      {/* Always starts expanded, so the nav badges (pending requests and
          payments) are in view after every launch and sign-in. Collapsing
          only lasts until the next reload; nothing is persisted. */}
      <SidebarProvider defaultOpen>
        <AppSidebar />
        <SidebarInset className="min-w-0 bg-porcelain">
          <DashboardHeader />
          <div className="flex-1 px-4 py-6 md:px-8">
            <RequireRouteAccess>{children}</RequireRouteAccess>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </RequireAuth>
  )
}
