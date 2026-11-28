import Link from 'next/link'
import { createAdminSupabaseClient } from '@/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Clock,
  Search,
  PackageCheck,
  Wrench,
  CheckCircle2,
  Truck,
  Circle,
  XCircle,
  MapPin,
  Phone,
  ImageIcon,
  ArrowLeft,
  MessageSquare,
} from 'lucide-react'
import {
  WORKORDER_STATUS_ORDER,
  WorkOrderStatus,
  isValidUUID,
  parseMediaUrls,
} from '@/lib/workorder-status'
import { PublicBudgetCard, PublicBudgetItem } from './PublicBudgetCard'
import { MotoTrackBrand } from '@/components/brand/MotoTrackBrand'
import { validateSafeUrl } from '@/lib/sanitize'

const statusConfig: Record<
  WorkOrderStatus,
  { label: string; shortLabel: string; icon: any; color: string; description: string }
> = {
  received: {
    label: 'Recibida',
    shortLabel: 'Recibida',
    icon: Clock,
    color: 'bg-slate-100 text-slate-700 border-slate-200',
    description: 'Hemos recibido tu motocicleta y pronto comenzaremos el diagnóstico.',
  },
  diagnosing: {
    label: 'Diagnosticando',
    shortLabel: 'Diagnóstico',
    icon: Search,
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    description: 'Nuestros técnicos están revisando a detalle cada punto de tu moto.',
  },
  waiting_approval: {
    label: 'Esperando Aprobación',
    shortLabel: 'Aprobación',
    icon: PackageCheck,
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    description: 'El presupuesto está listo. Por favor, revisa los ítems y aprueba para continuar.',
  },
  in_progress: {
    label: 'En Reparación',
    shortLabel: 'Reparación',
    icon: Wrench,
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    description: '¡Manos a la obra! Estamos trabajando en las reparaciones aprobadas.',
  },
  testing: {
    label: 'Control de Calidad',
    shortLabel: 'Calidad',
    icon: CheckCircle2,
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    description: 'Estamos realizando pruebas finales para asegurar que todo esté perfecto.',
  },
  ready: {
    label: 'Lista para Entrega',
    shortLabel: 'Lista',
    icon: PackageCheck,
    color: 'bg-green-100 text-green-700 border-green-200',
    description: '¡Tu moto está lista! Ya puedes pasar por ella al taller.',
  },
  delivered: {
    label: 'Entregada',
    shortLabel: 'Entregada',
    icon: Truck,
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    description: 'La orden ha sido finalizada y la moto entregada satisfactoriamente.',
  },
  cancelled: {
    label: 'Cancelada',
    shortLabel: 'Cancelada',
    icon: XCircle,
    color: 'bg-red-100 text-red-700 border-red-200',
    description: 'Esta orden de trabajo ha sido cancelada. Contáctanos si tienes dudas.',
  },
}

interface PublicTrackerViewProps {
  token: string
  workshopSlug?: string
}

export async function PublicTrackerView({ token, workshopSlug }: PublicTrackerViewProps) {
  let order: any = null

  if (isValidUUID(token)) {
    const supabase = createAdminSupabaseClient()
    const { data, error } = await supabase
      .from('work_orders')
      .select(`
        id,
        order_number,
        status,
        tracking_token,
        mileage_in,
        customer_notes,
        created_at,
        updated_at,
        workshops (id, name, slug, logo_url, address, phone_whatsapp, primary_color),
        motorcycles (license_plate, brand, model, year),
        order_items (*),
        order_timeline_events (*)
      `)
      .eq('tracking_token', token)
      .maybeSingle()

    if (!error && data) {
      const orderWorkshopSlug = (data.workshops as { slug?: string } | null)?.slug
      if (!workshopSlug || orderWorkshopSlug === workshopSlug) {
        order = data
      }
    }
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <Card className="max-w-md w-full border-2">
          <CardContent className="pt-12 pb-10 space-y-4">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
              <Search className="w-10 h-10 text-slate-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Orden no encontrada</h1>
            <p className="text-muted-foreground text-sm">
              El enlace que utilizaste parece ser inválido o la orden ya no está disponible.
            </p>
            <Button asChild variant="outline" className="mt-2">
              <Link href={workshopSlug ? `/t/${workshopSlug}` : '/track'}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al buscador
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const orderStatus = (order.status || 'received') as WorkOrderStatus
  const currentStatus = statusConfig[orderStatus] || statusConfig.received
  const StatusIcon = currentStatus.icon
  const isCancelled = orderStatus === 'cancelled'
  const currentStepIndex = isCancelled
    ? -1
    : Math.max(0, WORKORDER_STATUS_ORDER.indexOf(orderStatus))

  const timeline =
    (order.order_timeline_events as any[] | null)?.sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    ) || []

  const items = ((order.order_items as PublicBudgetItem[] | null) || [])
  const isWaitingApproval = orderStatus === 'waiting_approval'

  const cleanPhone = order.workshops?.phone_whatsapp?.replace(/\D/g, '') || ''
  const backHref = workshopSlug ? `/t/${workshopSlug}` : '/track'

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Cabecera del Taller */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={backHref}
              aria-label="Volver al buscador"
              className="p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            {order.workshops?.logo_url && validateSafeUrl(order.workshops.logo_url) ? (
              <img
                src={order.workshops.logo_url}
                alt={order.workshops.name}
                className="w-10 h-10 rounded-lg object-contain bg-slate-50 border shrink-0"
              />
            ) : (
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20 shrink-0">
                <Wrench className="w-5 h-5 text-primary" />
              </div>
            )}
            <div className="min-w-0">
              <h2 className="font-bold text-slate-900 leading-tight truncate">
                {order.workshops?.name}
              </h2>
              <p className="text-[10px] font-bold text-primary uppercase tracking-tighter flex items-center gap-1 truncate">
                <MapPin className="w-2.5 h-2.5 shrink-0" />
                {order.workshops?.address || 'Sucursal Central'}
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <Badge
              variant="outline"
              className="text-xs font-mono font-bold bg-slate-900 text-white border-slate-900"
            >
              {order.motorcycles?.license_plate}
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
        {/* Estado Destacado + Pizza Tracker */}
        <Card className="border-2 overflow-hidden">
          <div className={`h-2 ${currentStatus.color.split(' ')[0]}`} />
          <CardContent className="p-6 text-center space-y-5">
            <div
              className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${currentStatus.color} border-2`}
            >
              <StatusIcon className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">{currentStatus.label}</h1>
              <p className="text-slate-600 text-sm mt-1">{currentStatus.description}</p>
            </div>

            {/* Pizza Tracker Steps */}
            {!isCancelled && (
              <div className="pt-2">
                <div className="grid grid-cols-7 gap-1 items-start">
                  {WORKORDER_STATUS_ORDER.map((stepStatus, idx) => {
                    const isCompleted = idx < currentStepIndex
                    const isCurrent = idx === currentStepIndex
                    const stepCfg = statusConfig[stepStatus]
                    return (
                      <div key={stepStatus} className="flex flex-col items-center gap-1">
                        <div
                          className={`h-2 w-full rounded-full transition-colors ${
                            isCurrent
                              ? 'bg-primary'
                              : isCompleted
                                ? 'bg-emerald-500'
                                : 'bg-slate-200'
                          }`}
                        />
                        <span
                          className={`text-[9px] leading-tight text-center hidden sm:block ${
                            isCurrent
                              ? 'font-black text-slate-900'
                              : isCompleted
                                ? 'font-semibold text-emerald-700'
                                : 'text-slate-400'
                          }`}
                        >
                          {stepCfg.shortLabel}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info de la Moto */}
        <div className="bg-white rounded-xl border-2 p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
              <Wrench className="w-6 h-6 text-slate-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Vehículo</p>
              <h3 className="font-bold text-slate-900">
                {order.motorcycles?.brand} {order.motorcycles?.model}
              </h3>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Kilometraje</p>
            <h3 className="font-bold text-slate-900">
              {order.mileage_in != null ? `${order.mileage_in.toLocaleString('es-CL')} km` : '—'}
            </h3>
          </div>
        </div>

        {/* Presupuesto y Aprobación */}
        <PublicBudgetCard
          trackingToken={token}
          initialItems={items}
          isWaitingApproval={isWaitingApproval}
          currentStatusLabel={currentStatus.label}
        />

        {/* Bitácora / Historial */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900 px-1">Historial de Servicio</h3>
          {timeline.length === 0 ? (
            <div className="bg-white p-6 rounded-xl border-2 text-center text-sm text-muted-foreground italic">
              Aún no se han registrado avances en la bitácora.
            </div>
          ) : (
            <div className="relative space-y-6 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {timeline.map((event) => {
                const snapshot = event.status_snapshot as WorkOrderStatus | null
                const config = (snapshot && statusConfig[snapshot]) || {
                  label: snapshot || 'Actualización',
                  shortLabel: 'Estado',
                  icon: Circle,
                  color: 'bg-slate-100 text-slate-500 border-slate-200',
                  description: '',
                }
                const Icon = config.icon
                const mediaUrls = parseMediaUrls(event.media_urls)

                return (
                  <div key={event.id} className="relative pl-12">
                    <div
                      className={`absolute left-0 top-0 w-10 h-10 rounded-full border-4 border-slate-50 bg-white flex items-center justify-center z-10 shadow-sm ${
                        config.color.split(' ')[1] || 'text-slate-500'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="bg-white p-4 rounded-xl border-2 shadow-sm space-y-2">
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-primary tracking-widest">
                          {config.label}
                        </span>
                        {event.created_at && (
                          <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap">
                            {new Date(event.created_at).toLocaleTimeString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                            {' · '}
                            {new Date(event.created_at).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: 'short',
                            })}
                          </span>
                        )}
                      </div>

                      {event.public_comment && (
                        <p className="text-sm text-slate-700 leading-snug whitespace-pre-wrap">
                          {event.public_comment}
                        </p>
                      )}

                      {mediaUrls.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                          {mediaUrls.map((url: string, idx: number) => (
                            <a
                              key={`${event.id}-media-${idx}`}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group relative aspect-video rounded-lg border bg-slate-50 overflow-hidden hover:ring-2 hover:ring-primary transition-all"
                            >
                              <img
                                src={url}
                                alt={`Evidencia ${idx + 1}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                              <span className="absolute bottom-1 right-1 bg-slate-900/75 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
                                <ImageIcon className="w-2.5 h-2.5" />
                                Ver
                              </span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Contacto Taller */}
        {cleanPhone && (
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href={`tel:${order.workshops.phone_whatsapp}`}
              className="flex items-center justify-center gap-2 w-full h-14 bg-white border-2 border-primary text-primary rounded-xl font-bold hover:bg-primary/5 transition-colors"
            >
              <Phone className="w-5 h-5" />
              Llamar al Taller
            </a>
            <a
              href={`https://wa.me/${cleanPhone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full h-14 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors"
            >
              <MessageSquare className="w-5 h-5" />
              Escribir por WhatsApp
            </a>
          </div>
        )}
      </main>

      <footer className="max-w-2xl mx-auto px-6 py-10 text-center text-muted-foreground space-y-2.5">
        <p className="text-xs leading-relaxed text-slate-500">
          <span className="font-semibold text-slate-700">
            {order.workshops?.name || 'El taller'}
          </span>{' '}
          es el Responsable del Tratamiento de los datos de esta orden; MotoTrack actúa únicamente
          como proveedor tecnológico (Encargado).
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] font-medium text-slate-500">
          <Link
            href="/legal/privacidad"
            className="underline decoration-slate-300 underline-offset-4 hover:text-slate-800"
          >
            Política de Privacidad
          </Link>
          <span aria-hidden="true">·</span>
          <Link
            href="/legal/terminos"
            className="underline decoration-slate-300 underline-offset-4 hover:text-slate-800"
          >
            Términos y Condiciones
          </Link>
        </div>
        <div className="pt-1 flex items-center justify-center gap-2 text-xs text-slate-500">
          <span>Impulsado por</span>
          <Link href="/" className="inline-flex items-center transition-opacity hover:opacity-80">
            <MotoTrackBrand variant="horizontal" theme="light" size="xs" />
          </Link>
        </div>
      </footer>
    </div>
  )
}
