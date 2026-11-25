import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ChevronLeft, Wrench, User, Calendar, ImageIcon } from 'lucide-react'
import { createServerSupabaseClient } from '@/supabase/server'
import { Badge } from '@/components/ui/badge'
import { getWorkOrderStatusLabel, parseMediaUrls } from '@/lib/workorder-status'
import { MechanicSignOutButton } from '../../sign-out-button'
import { StatusControls } from './status-controls'
import { EvidenceCapture } from './evidence-capture'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: {
    id: string
  }
}

export default async function MechanicOrderDetailPage({ params }: PageProps) {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, workshop_id')
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
      order_timeline_events (*)
    `)
    .eq('id', params.id)
    .eq('workshop_id', profile.workshop_id)
    .single()

  if (error || !order) {
    return notFound()
  }

  const timeline =
    order.order_timeline_events?.sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    ) || []

  const motorcycle = order.motorcycles
  const customer = motorcycle?.customers

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-16">
      {/* Header Fijo Mobile */}
      <header className="p-4 bg-slate-800 border-b border-slate-700 sticky top-0 z-50 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
          <Link
            href="/mechanic"
            aria-label="Volver a órdenes"
            className="h-14 px-3.5 bg-slate-700 hover:bg-slate-600 rounded-2xl flex items-center gap-1.5 active:scale-95 transition-transform shrink-0"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
            <span className="text-xs font-black uppercase tracking-wider hidden sm:inline">
              Órdenes
            </span>
          </Link>

          <div className="text-center min-w-0 px-1">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">
              Orden #{order.order_number ?? order.id.slice(0, 8)}
            </p>
            <h2 className="text-xl sm:text-2xl font-black font-mono tracking-tighter leading-none truncate">
              {motorcycle?.license_plate || 'SIN-PLACA'}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Badge className="bg-primary text-slate-900 font-black uppercase text-[10px] rounded-full px-3 py-1.5">
              {getWorkOrderStatusLabel(order.status)}
            </Badge>
            <MechanicSignOutButton compact />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Info Rápida del Vehículo */}
        <section className="bg-slate-800 rounded-3xl p-5 border-2 border-slate-700 flex justify-between items-center gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 bg-slate-700 rounded-2xl flex items-center justify-center shrink-0">
              <Wrench className="w-6 h-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-xl leading-tight truncate">
                {motorcycle?.brand}
              </h3>
              <p className="text-sm font-bold text-slate-400 truncate">
                {motorcycle?.model}
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">KMS</p>
            <p className="text-lg font-black text-white leading-tight">
              {order.mileage_in != null ? order.mileage_in.toLocaleString('es-CL') : '—'}
            </p>
          </div>
        </section>

        {/* Notas de Ingreso */}
        {order.customer_notes && (
          <section className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700 space-y-1">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
              Notas de Recepción
            </p>
            <p className="text-sm text-slate-200 whitespace-pre-wrap">{order.customer_notes}</p>
          </section>
        )}

        {/* Sección de Control de Estado */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <div className="w-1.5 h-4 bg-primary rounded-full" />
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
              Actualizar Estado
            </h4>
          </div>
          <StatusControls orderId={order.id} currentStatus={order.status || 'received'} />
        </section>

        {/* Sección de Captura de Evidencia */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <div className="w-1.5 h-4 bg-primary rounded-full" />
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
              Registrar Evidencia
            </h4>
          </div>
          <EvidenceCapture orderId={order.id} />
        </section>

        {/* Bitácora / Evidencias Registradas */}
        <section className="space-y-3 pt-2">
          <div className="flex items-center gap-2 px-1">
            <div className="w-1.5 h-4 bg-primary rounded-full" />
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
              Bitácora Reciente ({timeline.length})
            </h4>
          </div>
          {timeline.length === 0 ? (
            <p className="text-xs text-slate-500 italic px-1">
              Aún no hay registros en la bitácora de esta orden.
            </p>
          ) : (
            <div className="space-y-3">
              {timeline.map((event) => {
                const mediaUrls = parseMediaUrls(event.media_urls)
                return (
                  <div
                    key={event.id}
                    className="bg-slate-800/70 border border-slate-700 rounded-2xl p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Badge
                        variant="outline"
                        className="border-primary/40 text-primary text-[10px] font-black uppercase"
                      >
                        {getWorkOrderStatusLabel(event.status_snapshot)}
                      </Badge>
                      {event.created_at && (
                        <span className="text-[11px] font-semibold text-slate-400">
                          {new Date(event.created_at).toLocaleString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>
                    {event.public_comment && (
                      <p className="text-sm text-slate-200 whitespace-pre-wrap">
                        {event.public_comment}
                      </p>
                    )}
                    {mediaUrls.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                        {mediaUrls.map((url: string, idx: number) => (
                          <a
                            key={`${event.id}-img-${idx}`}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative aspect-video rounded-xl overflow-hidden border border-slate-700 bg-slate-900"
                          >
                            <img
                              src={url}
                              alt={`Evidencia ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute bottom-1 right-1 bg-slate-900/80 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
                              <ImageIcon className="w-2.5 h-2.5" />
                              Ver
                            </span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Info Adicional / Cliente */}
        <section className="pt-2 space-y-3">
          <div className="flex items-center gap-3 bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
            <User className="w-5 h-5 text-slate-400 shrink-0" />
            <div>
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                Cliente
              </p>
              <p className="font-bold text-slate-200">
                {customer?.full_name || 'Sin nombre'}
              </p>
            </div>
          </div>
          {order.created_at && (
            <div className="flex items-center gap-3 bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
              <Calendar className="w-5 h-5 text-slate-400 shrink-0" />
              <div>
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                  Ingreso
                </p>
                <p className="font-bold text-slate-200">
                  {new Date(order.created_at).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
