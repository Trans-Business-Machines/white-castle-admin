import { BookingDetails } from "@/components/bookings/booking-details"

interface BookingPageProps {
  params: Promise<{ id: string }>
}

export default async function BookingPage({ params }: BookingPageProps) {
  const { id } = await params
  return <BookingDetails bookingId={decodeURIComponent(id)} />
}
