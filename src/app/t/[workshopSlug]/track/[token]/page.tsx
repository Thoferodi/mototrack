// Live Tracker del cliente
export default function LiveTrackerPage({ params }: { params: { workshopSlug: string, token: string } }) {
  return <div>Tracking Moto: {params.token} en {params.workshopSlug}</div>;
}
