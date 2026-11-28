import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import QRCode from 'qrcode'
import { Wrench } from 'lucide-react'
import { createServerSupabaseClient } from '@/supabase/server'
import {
  getFuelLevelLabel,
  getWorkOrderStatusLabel,
  parseMediaUrls,
} from '@/lib/workorder-status'
import { formatBogotaDateTime, formatCOP } from '@/lib/format'
import { PrintToolbar } from './PrintToolbar'

export const dynamic = 'force-dynamic'

interface ReceiptPageProps {
  params: {
    id: string
  }
}

function getApprovalMeta(approved: boolean | null): {
  label: string
  badgeClass: string
} {
  if (approved === true) {
    return {
      label: 'Aprobado',
      badgeClass: 'border-emerald-300 bg-emerald-50 text-emerald-800',
    }
  }
  if (approved === false) {
    return {
      label: 'Rechazado',
      badgeClass: 'border-rose-300 bg-rose-50 text-rose-800',
    }
  }
  return {
    label: 'Pendiente',
    badgeClass: 'border-amber-300 bg-amber-50 text-amber-800',
  }
}

function isSignatureUrl(url: string): boolean {
  const lower = url.toLowerCase()
  return (
    lower.includes('/signatures/') ||
    lower.includes('_signature.png') ||
    lower.endsWith('signature.png')
  )
}

function resolveBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (envUrl) {
    return envUrl.replace(/\/+$/, '')
  }

  const headerList = headers()
  const host = headerList.get('x-forwarded-host') || headerList.get('host') || ''
  if (!host) return ''

  const proto =
    headerList.get('x-forwarded-proto') ||
    (host.includes('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https')

  return `${proto}://${host}`.replace(/\/+$/, '')
}

export default async function OrderReceiptPage({ params }: ReceiptPageProps) {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
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
      id,
      order_number,
      status,
      mileage_in,
      fuel_level,
      customer_notes,
      tracking_token,
      created_at,
      updated_at,
      workshop_id,
      mechanic_id,
      motorcycles (
        license_plate,
        brand,
        model,
        year,
        customers (
          full_name,
          phone_whatsapp,
          document_id,
          email
        )
      ),
      order_items (
        id,
        description,
        type,
        quantity,
        unit_price,
        approved
      ),
      order_timeline_events (
        id,
        media_urls,
        created_at
      )
    `)
    .eq('id', params.id)
    .eq('workshop_id', profile.workshop_id)
    .single()

  if (error || !order) {
    return notFound()
  }

  const [{ data: workshop }, mechanicResult] = await Promise.all([
    supabase
      .from('workshops')
      .select('name, address, phone_whatsapp, logo_url, primary_color')
      .eq('id', order.workshop_id)
      .single(),
    order.mechanic_id
      ? supabase
          .from('profiles')
          .select('full_name')
          .eq('id', order.mechanic_id)
          .eq('workshop_id', order.workshop_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const motorcycle = order.motorcycles
  const customer = motorcycle?.customers
  const items = order.order_items || []

  // Firma de recepción tomada de order_timeline_events.media_urls (el evento más antiguo con firma)
  const timelineSorted = [...(order.order_timeline_events || [])].sort(
    (a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
  )
  let receptionSignatureUrl: string | null = null
  for (const ev of timelineSorted) {
    const urls = parseMediaUrls(ev.media_urls)
    const sig = urls.find(isSignatureUrl)
    if (sig) {
      receptionSignatureUrl = sig
      break
    }
  }

  const approvedTotal = items.reduce((acc, item) => {
    if (item.approved !== true) return acc
    return acc + Number(item.quantity ?? 1) * Number(item.unit_price ?? 0)
  }, 0)

  const pendingTotal = items.reduce((acc, item) => {
    if (item.approved !== null) return acc
    return acc + Number(item.quantity ?? 1) * Number(item.unit_price ?? 0)
  }, 0)

  const baseUrl = resolveBaseUrl()
  const trackingUrl = order.tracking_token
    ? `${baseUrl}/track/${order.tracking_token}`
    : `${baseUrl}/track`

  const qrSvg = await QRCode.toString(trackingUrl, {
    type: 'svg',
    margin: 1,
    width: 132,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#09090b',
      light: '#ffffff',
    },
  })

  const orderLabel = `#${order.order_number ?? order.id.slice(0, 8)}`
  const statusLabel = getWorkOrderStatusLabel(order.status)

  return (
    <div className="min-h-screen bg-[#08090C] print:min-h-0 print:bg-white">
      <PrintToolbar orderId={order.id} />

      <div className="p-4 sm:p-6 md:p-8 print:p-0">
        <article className="max-w-[820px] mx-auto bg-white text-zinc-950 rounded-2xl border border-zinc-200 shadow-2xl p-6 sm:p-9 space-y-6 print:max-w-none print:rounded-none print:border-0 print:shadow-none print:p-0 print:space-y-5">
          {/* Encabezado del Taller y Orden */}
          <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-5 pb-5 border-b border-zinc-200">
            <div className="flex items-start gap-4 min-w-0">
              {workshop?.logo_url ? (
                <div className="w-16 h-16 rounded-xl border border-zinc-200 bg-white p-1.5 flex items-center justify-center shrink-0 overflow-hidden">
                  <img
                    src={workshop.logo_url}
                    alt={workshop.name}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: workshop?.primary_color || '#EA580C' }}
                >
                  <Wrench className="w-6 h-6" />
                </div>
              )}

              <div className="min-w-0 space-y-1">
                <h1 className="text-xl font-extrabold tracking-tight text-zinc-950">
                  {workshop?.name || 'Taller MotoTrack'}
                </h1>
                {workshop?.address && (
                  <p className="text-xs text-zinc-600">{workshop.address}</p>
                )}
                {workshop?.phone_whatsapp && (
                  <p className="text-xs font-medium text-zinc-700">
                    WhatsApp: <span className="font-mono">{workshop.phone_whatsapp}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="sm:text-right space-y-1.5 shrink-0">
              <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">
                Comprobante de Orden
              </p>
              <p className="text-2xl font-mono font-black tracking-tight text-zinc-950">
                {orderLabel}
              </p>
              <div className="flex sm:justify-end items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-zinc-300 bg-zinc-100 px-2.5 py-0.5 text-[11px] font-bold text-zinc-900">
                  {statusLabel}
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Ingreso: {formatBogotaDateTime(order.created_at)}
              </p>
            </div>
          </header>

          {/* Datos Cliente y Motocicleta */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:grid-cols-2">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 space-y-2.5">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-200 pb-1.5">
                Datos del Cliente
              </h2>
              <div className="space-y-1 text-sm">
                <p className="font-bold text-zinc-950">
                  {customer?.full_name || 'Cliente no registrado'}
                </p>
                <p className="text-xs text-zinc-700">
                  WhatsApp:{' '}
                  <span className="font-mono font-semibold text-zinc-900">
                    {customer?.phone_whatsapp || '—'}
                  </span>
                </p>
                {customer?.document_id && (
                  <p className="text-xs text-zinc-700">
                    Documento: <span className="font-mono">{customer.document_id}</span>
                  </p>
                )}
                {customer?.email && (
                  <p className="text-xs text-zinc-700 truncate">Correo: {customer.email}</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 space-y-2.5">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-200 pb-1.5">
                Datos de la Motocicleta
              </h2>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                <div>
                  <span className="text-zinc-500 block">Placa</span>
                  <span className="inline-block mt-0.5 rounded-md border border-zinc-300 bg-white px-2 py-0.5 font-mono text-sm font-black tracking-wider text-zinc-950">
                    {motorcycle?.license_plate || 'SIN-PLACA'}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Kilometraje</span>
                  <span className="font-mono font-bold text-zinc-950">
                    {order.mileage_in?.toLocaleString('es-CO') ?? 0} km
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Marca / Modelo</span>
                  <span className="font-semibold text-zinc-950">
                    {motorcycle?.brand || ''} {motorcycle?.model || '—'}{' '}
                    {motorcycle?.year ? `(${motorcycle.year})` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Nivel de Combustible</span>
                  <span className="font-semibold text-zinc-950">
                    {getFuelLevelLabel(order.fuel_level)}
                  </span>
                </div>
                {mechanicResult.data?.full_name && (
                  <div className="col-span-2 pt-0.5">
                    <span className="text-zinc-500">Mecánico responsable: </span>
                    <span className="font-semibold text-zinc-900">
                      {mechanicResult.data.full_name}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Observaciones de Ingreso */}
          <section className="rounded-xl border border-zinc-200 p-4 space-y-1.5">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Síntomas / Notas de Ingreso
            </h2>
            <p className="text-xs sm:text-sm text-zinc-800 whitespace-pre-wrap leading-relaxed">
              {order.customer_notes || 'Sin notas o síntomas reportados en recepción.'}
            </p>
          </section>

          {/* Tabla de Presupuesto / Trabajos */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                Detalle de Repuestos y Mano de Obra
              </h2>
              <span className="text-[11px] font-medium text-zinc-500">Moneda: COP</span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-zinc-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-zinc-100 text-[10px] font-bold uppercase tracking-wider text-zinc-600 border-b border-zinc-200">
                  <tr>
                    <th className="px-3.5 py-2.5">Descripción</th>
                    <th className="px-2.5 py-2.5">Tipo</th>
                    <th className="px-2.5 py-2.5 text-center">Cant.</th>
                    <th className="px-3 py-2.5 text-right">Precio Unit.</th>
                    <th className="px-2.5 py-2.5 text-center">Estado</th>
                    <th className="px-3.5 py-2.5 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {items.map((item) => {
                    const qty = Number(item.quantity ?? 1)
                    const unitPrice = Number(item.unit_price ?? 0)
                    const subtotal = qty * unitPrice
                    const approval = getApprovalMeta(item.approved)
                    const isRejected = item.approved === false

                    return (
                      <tr key={item.id} className={isRejected ? 'bg-zinc-50/70 text-zinc-400' : ''}>
                        <td className="px-3.5 py-2.5 font-semibold text-zinc-900">
                          <span className={isRejected ? 'line-through text-zinc-400' : ''}>
                            {item.description}
                          </span>
                        </td>
                        <td className="px-2.5 py-2.5 text-zinc-600 whitespace-nowrap">
                          {item.type === 'labor' ? 'Mano de obra' : 'Repuesto'}
                        </td>
                        <td className="px-2.5 py-2.5 text-center font-mono tabular-nums">
                          {qty}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono tabular-nums whitespace-nowrap">
                          {formatCOP(unitPrice)}
                        </td>
                        <td className="px-2.5 py-2.5 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${approval.badgeClass}`}
                          >
                            {approval.label}
                          </span>
                        </td>
                        <td
                          className={`px-3.5 py-2.5 text-right font-mono tabular-nums font-bold whitespace-nowrap ${
                            isRejected ? 'line-through text-zinc-400' : 'text-zinc-950'
                          }`}
                        >
                          {formatCOP(subtotal)}
                        </td>
                      </tr>
                    )
                  })}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-zinc-500 italic">
                        No hay repuestos ni mano de obra registrados aún en esta orden.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col items-end gap-1 pt-1">
              {pendingTotal > 0 && (
                <div className="flex items-center gap-4 text-xs text-zinc-600">
                  <span>Pendiente por aprobar:</span>
                  <span className="font-mono tabular-nums font-semibold">
                    {formatCOP(pendingTotal)} COP
                  </span>
                </div>
              )}
              <div className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                  Total Aprobado (COP)
                </span>
                <span className="text-lg font-mono font-black tabular-nums text-zinc-950">
                  {formatCOP(approvedTotal)} COP
                </span>
              </div>
            </div>
          </section>

          {/* Pie en 2 Columnas: Firmas + QR */}
          <footer className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-5 border-t border-zinc-200 print:grid-cols-2 break-inside-avoid">
            {/* Columna Izquierda: Firma de Recepción + Línea de Entrega */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  Firma de Recepción
                </p>
                {receptionSignatureUrl ? (
                  <div className="h-24 rounded-lg border border-zinc-200 bg-white p-2 flex items-center justify-center">
                    <img
                      src={receptionSignatureUrl}
                      alt="Firma de recepción del cliente"
                      className="max-h-full w-auto object-contain"
                    />
                  </div>
                ) : (
                  <div className="h-20 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 flex items-center justify-center text-[11px] text-zinc-500">
                    Sin firma electrónica de recepción registrada
                  </div>
                )}
                <p className="text-[10px] leading-snug text-zinc-600">
                  Ingreso autorizado mediante firma electrónica. Evidencia fotográfica disponible en
                  línea durante 90 días calendario.
                </p>
              </div>

              <div className="pt-2 space-y-1">
                <div className="h-10 border-b border-zinc-400" />
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-700">
                  Firma de Entrega / Conformidad del Cliente
                </p>
                <p className="text-[10px] text-zinc-500">Nombre y C.C.: ___________________________</p>
              </div>
            </div>

            {/* Columna Derecha: QR al Live Tracker */}
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 flex items-center gap-4">
              <div
                aria-label="Código QR de seguimiento en vivo"
                className="w-[132px] h-[132px] shrink-0 rounded-lg border border-zinc-200 bg-white p-1.5 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
              <div className="min-w-0 space-y-1.5">
                <p className="text-xs font-extrabold uppercase tracking-wider text-zinc-900">
                  Seguimiento en Vivo
                </p>
                <p className="text-xs text-zinc-700 leading-snug font-medium">
                  Escanea para ver fotos y aprobar trabajos en vivo
                </p>
                <p className="text-[10px] font-mono text-zinc-500 break-all">
                  {trackingUrl}
                </p>
              </div>
            </div>
          </footer>

          {/* Pie legal y aclaración tributaria DIAN */}
          <div className="border-t border-zinc-200 pt-3 text-center break-inside-avoid">
            <p className="text-[10px] leading-snug text-zinc-600">
              Comprobante interno de orden de servicio. Este documento tiene carácter
              exclusivamente operativo y NO constituye Factura Electrónica de Venta ni documento
              equivalente ante la DIAN (Resolución 000165 de 2023).
            </p>
          </div>
        </article>
      </div>
    </div>
  )
}
