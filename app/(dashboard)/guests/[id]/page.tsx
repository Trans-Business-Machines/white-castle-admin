import { GuestDetails } from "@/components/guests/guest-details"

interface GuestPageProps {
  params: Promise<{ id: string }>
}

export default async function GuestPage({ params }: GuestPageProps) {
  const { id } = await params
  return <GuestDetails guestId={decodeURIComponent(id)} />
}
