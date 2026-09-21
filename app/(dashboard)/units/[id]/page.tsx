import { UnitDetails } from "@/components/units/unit-details"

interface UnitPageProps {
  params: Promise<{ id: string }>
}

export default async function UnitPage({ params }: UnitPageProps) {
  const { id } = await params
  return <UnitDetails roomId={decodeURIComponent(id)} />
}
