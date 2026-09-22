import { AUTH_NOT_FOUND, NotFoundView } from "@/components/not-found-view"

/** `notFound()` thrown inside a public auth screen, in the branded panel. */
export default function AuthNotFound() {
  return <NotFoundView {...AUTH_NOT_FOUND} />
}
