import { DASHBOARD_NOT_FOUND, NotFoundView } from "@/components/not-found-view"

/** `notFound()` thrown inside the authenticated area, in the app chrome. */
export default function DashboardNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <NotFoundView className="max-w-md" {...DASHBOARD_NOT_FOUND} />
    </div>
  )
}
