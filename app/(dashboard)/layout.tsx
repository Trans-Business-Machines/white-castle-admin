import { type PropsWithChildren } from "react"
import { cookies } from "next/headers"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default async function DashboardLayout({ children }: PropsWithChildren) {
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false"

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      <SidebarInset className="bg-canvas">
        <DashboardHeader />
        <div className="flex-1 px-4 py-6 md:px-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
