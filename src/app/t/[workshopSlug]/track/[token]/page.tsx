import { PublicTrackerView } from '@/app/track/[token]/PublicTrackerView'

export const dynamic = 'force-dynamic'

interface LiveTrackerPageProps {
  params: {
    workshopSlug: string
    token: string
  }
}

export default async function LiveTrackerPage({ params }: LiveTrackerPageProps) {
  return (
    <PublicTrackerView
      token={params.token}
      workshopSlug={params.workshopSlug}
    />
  )
}
