import Link from 'next/link'
import { createServerSupabaseClient } from '@/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BudgetManager, CatalogTemplateItem } from './budget-manager'
import { StatusSelector } from './status-selector'
import { Timeline } from './timeline'
import { CopyTrackerButton } from '../copy-button'

interface PageProps {
  params: {
    id: string
  }
}

export default async function OrderDetailPage({ params }: PageProps) {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('workshop_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  const { data: order, error } = await supabase
    .from('workorders')
    .select(`
      *,
      customers (*),
      motorcycles (*),
      order_items (*),
      order_timeline_events (*)
    `)
    .eq('id', params.id)
    .eq('workshop_id', profile.workshop_id)
    .single()

  if (error || !order) {
    console.error('Error fetching order:', error)
    return notFound()
  }

  const { data: workshop } = await supabase
    .from('workshops')
    .select('name, slug, settings')
    .eq('id', order.workshop_id)
    .single()

  const catalogItems: CatalogTemplateItem[] = Array.isArray((workshop?.settings as any)?.catalog)
    ? (workshop?.settings as any).catalog
    : []

  const timeline =
    order.order_timeline_events?.sort(
      (a: any, b: any) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ) || []

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2 text-slate-600">
          <Link href="/dashboard/orders">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al tablero
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <CopyTrackerButton token={order.tracking_token} />
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link href={`/track/${order.tracking_token}`} target="_blank">
              <span>Ver Live Tracker</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Orden #{order.id.slice(0, 8)}
          </h1>
          <p className="text-muted-foreground text-sm">
            Registrada el {new Date(order.created_at).toLocaleDateString('es-ES')}
          </p>
        </div>
        <StatusSelector
          orderId={order.id}
          currentStatus={order.status}
          trackingToken={order.tracking_token}
          customerName={order.customers?.full_name || 'Cliente'}
          customerPhone={order.customers?.phone || ''}
          plate={order.motorcycles?.plate || 'SIN-PLACA'}
          workshopName={workshop?.name || 'Taller'}
          workshopSlug={workshop?.slug || ''}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Panel Izquierdo: Info Cliente y Moto */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nombre</p>
                <p className="text-lg font-semibold">{order.customers?.full_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Teléfono</p>
                <p>{order.customers?.phone || 'No registrado'}</p>
              </div>
              {order.customers?.email && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p>{order.customers.email}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Motocicleta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Placa</p>
                  <Badge variant="outline" className="text-lg font-mono px-3 py-1">
                    {order.motorcycles?.plate}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Kilometraje</p>
                  <p className="font-semibold">{order.mileage?.toLocaleString() ?? 0} km</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Marca / Modelo</p>
                <p className="text-lg font-semibold">
                  {order.motorcycles?.make} {order.motorcycles?.model}
                </p>
              </div>
              {order.motorcycles?.color && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Color</p>
                  <p>{order.motorcycles.color}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Descripción Inicial</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground italic whitespace-pre-wrap">
                {order.description || 'Sin descripción'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Panel Derecho: Presupuesto y Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <BudgetManager
            orderId={order.id}
            items={order.order_items || []}
            catalogItems={catalogItems}
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Historial de Actividad</CardTitle>
            </CardHeader>
            <CardContent>
              <Timeline events={timeline} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
