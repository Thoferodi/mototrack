import Link from 'next/link'
import { createServerSupabaseClient } from '@/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, ExternalLink, User, Bike, FileText, History, Printer, Wrench } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getWorkOrderStatusLabel, isValidUUID } from '@/lib/workorder-status'
import { sortMechanicsFirst, WorkshopMechanicOption } from '@/lib/team'
import { BudgetManager, CatalogTemplateItem } from './budget-manager'
import { StatusSelector } from './status-selector'
import { MechanicSelector } from './mechanic-selector'
import { Timeline } from './timeline'
import { CopyTrackerButton } from '../copy-button'

interface PageProps {
  params: {
    id: string
  }
}

const STATUS_BADGE_CLASSES: Record<string, string> = {
  received: 'bg-slate-500/15 text-slate-200 border-slate-400/30',
  diagnosing: 'bg-sky-500/15 text-sky-300 border-sky-400/30',
  waiting_approval: 'bg-amber-500/15 text-amber-300 border-amber-400/30',
  in_progress: 'bg-orange-500/15 text-orange-300 border-orange-400/30',
  testing: 'bg-violet-500/15 text-violet-300 border-violet-400/30',
  ready: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
  delivered: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
  cancelled: 'bg-rose-500/15 text-rose-300 border-rose-400/30',
}

export default async function OrderDetailPage({ params }: PageProps) {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Validar UUID antes de consultar (evita fuga de errores PostgreSQL al cliente)
  if (!isValidUUID(params.id)) {
    return notFound()
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('workshop_id, role, active')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.workshop_id) {
    redirect('/login')
  }

  if (profile.active === false) {
    redirect('/login?error=account_disabled')
  }

  if (profile.role === 'mechanic') {
    redirect('/mechanic')
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
    return notFound()
  }

  const [{ data: workshop }, { data: savedCatalog }, { data: recentItems }, { data: workshopMembers }] =
    await Promise.all([
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
      supabase
        .from('profiles')
        .select('id, full_name, role, active')
        .eq('workshop_id', order.workshop_id),
    ])

  const mechanicOptions: WorkshopMechanicOption[] = sortMechanicsFirst(
    (workshopMembers || [])
      .filter((m) => m.active !== false || m.id === order.mechanic_id)
      .map((m) => ({
        id: m.id,
        full_name: m.full_name,
        role: m.role,
        active: m.active !== false,
      }))
  )

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
  const currentStatus = order.status || 'received'
  const statusBadgeClass =
    STATUS_BADGE_CLASSES[currentStatus] || 'bg-white/[0.06] text-slate-200 border-white/15'

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/dashboard/orders"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-semibold text-slate-300 transition-all hover:border-orange-500/35 hover:bg-white/[0.08] hover:text-white"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-orange-400" />
          Volver al tablero
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="gap-1.5 rounded-xl border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08] hover:border-orange-500/40 hover:text-white"
          >
            <Link href={`/dashboard/orders/${order.id}/receipt`}>
              <Printer className="w-3.5 h-3.5 text-orange-400" />
              <span>Comprobante / PDF</span>
            </Link>
          </Button>
          {order.tracking_token && (
            <>
              <CopyTrackerButton token={order.tracking_token} />
              <Button
                asChild
                variant="outline"
                size="sm"
                className="gap-1.5 rounded-xl border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08] hover:border-orange-500/40 hover:text-white"
              >
                <Link href={`/track/${order.tracking_token}`} target="_blank">
                  <span>Ver Live Tracker</span>
                  <ExternalLink className="w-3.5 h-3.5 text-orange-400" />
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#101218] p-5">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Orden{' '}
              <span className="font-mono text-orange-400">
                #{order.order_number ?? order.id.slice(0, 8)}
              </span>
            </h1>
            <Badge
              variant="outline"
              className="font-mono text-sm font-bold tracking-wider rounded-lg border-orange-500/35 bg-orange-500/15 text-orange-300 px-2.5 py-0.5"
            >
              {motorcycle?.license_plate || 'SIN-PLACA'}
            </Badge>
            <Badge variant="outline" className={`rounded-full text-xs font-semibold ${statusBadgeClass}`}>
              {getWorkOrderStatusLabel(currentStatus)}
            </Badge>
          </div>
          {order.created_at && (
            <p className="text-slate-400 text-sm">
              Registrada el {new Date(order.created_at).toLocaleDateString('es-ES')}
            </p>
          )}
        </div>
        <StatusSelector
          orderId={order.id}
          currentStatus={currentStatus}
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
        <div className="lg:col-span-1 space-y-6 min-w-0">
          <Card className="rounded-2xl border border-white/10 bg-[#101218] text-slate-100 shadow-none">
            <CardHeader className="border-b border-white/[0.07] pb-3.5">
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <Wrench className="w-4 h-4 text-orange-400" />
                Técnico Responsable
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <MechanicSelector
                orderId={order.id}
                currentMechanicId={order.mechanic_id}
                mechanics={mechanicOptions}
              />
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-white/10 bg-[#101218] text-slate-100 shadow-none">
            <CardHeader className="border-b border-white/[0.07] pb-3.5">
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-orange-400" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Nombre
                </p>
                <p className="text-base font-semibold text-white mt-0.5">
                  {customer?.full_name || 'Sin cliente'}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Teléfono / WhatsApp
                </p>
                <p className="font-mono text-sm text-slate-200 mt-0.5">
                  {customer?.phone_whatsapp || 'No registrado'}
                </p>
              </div>
              {customer?.email && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Email
                  </p>
                  <p className="text-sm text-slate-200 mt-0.5">{customer.email}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-white/10 bg-[#101218] text-slate-100 shadow-none">
            <CardHeader className="border-b border-white/[0.07] pb-3.5">
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <Bike className="w-4 h-4 text-orange-400" />
                Motocicleta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="flex justify-between items-start gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Placa
                  </p>
                  <Badge
                    variant="outline"
                    className="mt-1 text-base font-mono font-bold tracking-wider px-3 py-1 rounded-xl border-orange-500/35 bg-orange-500/15 text-orange-300"
                  >
                    {motorcycle?.license_plate || 'SIN-PLACA'}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Kilometraje
                  </p>
                  <p className="mt-1 font-mono font-semibold text-white">
                    {order.mileage_in?.toLocaleString() ?? 0} km
                  </p>
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Marca / Modelo
                </p>
                <p className="text-base font-semibold text-white mt-0.5">
                  {motorcycle?.brand} {motorcycle?.model}{' '}
                  {motorcycle?.year ? `(${motorcycle.year})` : ''}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-white/10 bg-[#101218] text-slate-100 shadow-none">
            <CardHeader className="border-b border-white/[0.07] pb-3.5">
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-orange-400" />
                Notas de Ingreso
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-sm text-slate-300 italic whitespace-pre-wrap leading-relaxed">
                {order.customer_notes || 'Sin descripción'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Panel Derecho: Presupuesto y Timeline */}
        <div className="lg:col-span-2 space-y-6 min-w-0">
          <BudgetManager
            orderId={order.id}
            items={order.order_items || []}
            catalogItems={catalogItems}
          />

          <Card className="rounded-2xl border border-white/10 bg-[#101218] text-slate-100 shadow-none">
            <CardHeader className="border-b border-white/[0.07] pb-3.5">
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <History className="w-5 h-5 text-orange-400" />
                Historial de Actividad
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <Timeline events={timeline} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
