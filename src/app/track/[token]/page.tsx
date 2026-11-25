import { PublicTrackerView } from './PublicTrackerView'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: {
    token: string
  }
}

export default async function PublicTrackerPage({ params }: PageProps) {
  return <PublicTrackerView token={params.token} />
}
