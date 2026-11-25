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

  if (!profile || !profile.workshop_id) {
    redirect('/login')
  }

  const { data: order, error } = await supabase
    .from('work_orders')
    .select(`
      *,
      motorcycles (
        *,
        customers (*)
      ),
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

  const [{ data: workshop }, { data: savedCatalog }, { data: recentItems }] = await Promise.all([
    supabase
      .from('workshops')
      .select('name, slug')
      .eq('id', order.workshop_id)
      .single(),
    supabase
      .from('catalog_items')
      .select('id, name, type, default_price')
      .eq('workshop_id', order.workshop_id)
      .order('name', { ascending: true }),
    supabase
      .from('order_items')
      .select('id, description, type, unit_price')
      .eq('workshop_id', order.workshop_id)
      .order('description', { ascending: true }),
  ])

  const seen = new Set<string>()
  const catalogItems: CatalogTemplateItem[] = []
  for (const item of savedCatalog || []) {
    const key = `${item.type}:${item.name.trim().toLowerCase()}`
    if (seen.has(key)) continue
    seen.add(key)
    catalogItems.push({
      id: item.id,
      name: item.name,
      type: item.type,
      default_price: Number(item.default_price ?? 0),
    })
  }
  for (const item of recentItems || []) {
    const key = `${item.type}:${item.description.trim().toLowerCase()}`
    if (seen.has(key)) continue
    seen.add(key)
    catalogItems.push({
      id: item.id,
      name: item.description,
      type: item.type,
      default_price: Number(item.unit_price ?? 0),
    })
  }

  const timeline =
    order.order_timeline_events?.sort(
      (a, b) =>
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    ) || []

  const motorcycle = order.motorcycles
  const customer = motorcycle?.customers

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2 text-slate-600">
          <Link href="/dashboard/orders">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al tablero
          </Link>
        </Button>

        {order.tracking_token && (
          <div className="flex items-center gap-2">
            <CopyTrackerButton token={order.tracking_token} />
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link href={`/track/${order.tracking_token}`} target="_blank">
                <span>Ver Live Tracker</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Orden #{order.order_number ?? order.id.slice(0, 8)}
          </h1>
          {order.created_at && (
            <p className="text-muted-foreground text-sm">
              Registrada el {new Date(order.created_at).toLocaleDateString('es-ES')}
            </p>
          )}
        </div>
        <StatusSelector
          orderId={order.id}
          currentStatus={order.status || 'received'}
          trackingToken={order.tracking_token || ''}
          customerName={customer?.full_name || 'Cliente'}
          customerPhone={customer?.phone_whatsapp || ''}
          plate={motorcycle?.license_plate || 'SIN-PLACA'}
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
                <p className="text-lg font-semibold">{customer?.full_name || 'Sin cliente'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Teléfono / WhatsApp</p>
                <p>{customer?.phone_whatsapp || 'No registrado'}</p>
              </div>
              {customer?.email && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p>{customer.email}</p>
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
                    {motorcycle?.license_plate || 'SIN-PLACA'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Kilometraje</p>
                  <p className="font-semibold">{order.mileage_in?.toLocaleString() ?? 0} km</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Marca / Modelo</p>
                <p className="text-lg font-semibold">
                  {motorcycle?.brand} {motorcycle?.model} {motorcycle?.year ? `(${motorcycle.year})` : ''}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notas de Ingreso</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground italic whitespace-pre-wrap">
                {order.customer_notes || 'Sin descripción'}
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
