import { createServerSupabaseClient } from '@/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, Search, PackageCheck, Wrench, CheckCircle2, Truck, Circle, MapPin, Phone, Lock, Check, X } from 'lucide-react'
import { Database } from '@/types/database.types'
import { ItemApprovalButtons } from './ItemApprovalButtons'

type Status = Database['public']['Enums']['workorder_status']

const statusConfig: Record<Status, { label: string, icon: any, color: string, description: string }> = {
  received: { 
    label: 'Recibida', 
    icon: Clock, 
    color: 'bg-slate-100 text-slate-700 border-slate-200',
    description: 'Hemos recibido tu motocicleta y pronto comenzaremos el diagnóstico.'
  },
  diagnosing: { 
    label: 'Diagnosticando', 
    icon: Search, 
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    description: 'Nuestros técnicos están revisando a detalle cada punto de tu moto.'
  },
  waiting_approval: { 
    label: 'Esperando Aprobación', 
    icon: PackageCheck, 
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    description: 'El presupuesto está listo. Por favor, revisa los ítems y aprueba para continuar.'
  },
  in_repair: { 
    label: 'En Reparación', 
    icon: Wrench, 
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    description: '¡Manos a la obra! Estamos trabajando en las reparaciones aprobadas.'
  },
  quality_check: { 
    label: 'Control de Calidad', 
    icon: CheckCircle2, 
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    description: 'Estamos realizando pruebas finales para asegurar que todo esté perfecto.'
  },
  ready_for_pickup: { 
    label: 'Lista para Entrega', 
    icon: PackageCheck, 
    color: 'bg-green-100 text-green-700 border-green-200',
    description: '¡Tu moto está lista! Ya puedes pasar por ella al taller.'
  },
  delivered: { 
    label: 'Entregada', 
    icon: Truck, 
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    description: 'La orden ha sido finalizada y la moto entregada satisfactoriamente.'
  },
}

interface PageProps {
  params: {
    token: string
  }
}

export default async function PublicTrackerPage({ params }: PageProps) {
  const supabase = createServerSupabaseClient()

  // Consulta pública usando el tracking_token
  const { data: order, error } = await supabase
    .from('workorders')
    .select(`
      *,
      workshops (*),
      motorcycles (*),
      order_items (*),
      order_timeline_events (*)
    `)
    .eq('tracking_token', params.token)
    .single()

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <Card className="max-w-md w-full border-2">
          <CardContent className="pt-12 pb-12 space-y-4">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
              <Search className="w-10 h-10 text-slate-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Orden no encontrada</h1>
            <p className="text-muted-foreground">
              El enlace que utilizaste parece ser inválido o la orden ya no está disponible.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentStatus = statusConfig[order.status]
  const StatusIcon = currentStatus.icon
  
  const timeline = order.order_timeline_events?.sort((a: any, b: any) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  ) || []

  // Calcular total de ítems aprobados (o todos si está esperando aprobación)
  const isWaitingApproval = order.status === 'waiting_approval'
  const total = order.order_items?.reduce((acc: number, item: any) => {
    if (!isWaitingApproval && item.status === 'rejected') return acc
    return acc + (item.quantity * item.unit_price)
  }, 0) || 0

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Cabecera del Taller */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {order.workshops?.logo_url ? (
              <img src={order.workshops.logo_url} alt={order.workshops.name} className="w-10 h-10 rounded-lg object-contain bg-slate-50 border" />
            ) : (
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                <Wrench className="w-5 h-5 text-primary" />
              </div>
            )}
            <div>
              <h2 className="font-bold text-slate-900 leading-tight">{order.workshops?.name}</h2>
              <p className="text-[10px] font-bold text-primary uppercase tracking-tighter flex items-center gap-1">
                <MapPin className="w-2.5 h-2.5" />
                {order.workshops?.address || 'Sucursal Central'}
              </p>
            </div>
          </div>
          <div className="text-right">
             <Badge variant="outline" className="text-xs font-mono font-bold bg-slate-900 text-white border-slate-900">
               {order.motorcycles?.plate}
             </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
        {/* Estado Destacado */}
        <Card className="border-2 overflow-hidden">
          <div className={`h-2 ${currentStatus.color.split(' ')[0]}`} />
          <CardContent className="p-6 text-center space-y-4">
            <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${currentStatus.color} border-2`}>
              <StatusIcon className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">{currentStatus.label}</h1>
              <p className="text-slate-600 text-sm mt-1">{currentStatus.description}</p>
            </div>
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
                 <h3 className="font-bold text-slate-900">{order.motorcycles?.make} {order.motorcycles?.model}</h3>
              </div>
           </div>
           <div className="text-right">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Kilometraje</p>
              <h3 className="font-bold text-slate-900">{order.mileage?.toLocaleString()} km</h3>
           </div>
        </div>

        {/* Presupuesto y Aprobación */}
        <Card className="border-2 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/80 border-b py-4 flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-primary" />
              Presupuesto Detallado
            </CardTitle>
            {!isWaitingApproval ? (
              <Badge variant="secondary" className="gap-1.5 bg-amber-100 text-amber-800 border-amber-200 text-xs py-1">
                <Lock className="w-3.5 h-3.5" />
                Presupuesto cerrado - Moto en {currentStatus.label.toLowerCase()}
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1.5 bg-yellow-50 text-yellow-800 border-yellow-300 text-xs py-1 animate-pulse">
                Acción requerida: Aprueba o rechaza ítems
              </Badge>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/50 text-[10px] font-bold text-muted-foreground uppercase border-b">
                  <tr>
                    <th className="px-4 py-2 text-left">Concepto</th>
                    <th className="px-4 py-2 text-right">Cant. x Precio</th>
                    <th className="px-4 py-2 text-right">Total</th>
                    <th className="px-4 py-2 text-center">Estado / Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.order_items?.map((item: any) => (
                    <tr key={item.id} className={item.status === 'rejected' ? 'opacity-50 bg-slate-50/50' : ''}>
                      <td className="px-4 py-3">
                        <div className={`font-semibold text-slate-800 ${item.status === 'rejected' ? 'line-through' : ''}`}>{item.description}</div>
                        <div className="text-[10px] text-muted-foreground uppercase font-bold">{item.type === 'labor' ? 'Mano de Obra' : 'Repuesto'}</div>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        {item.quantity} x ${item.unit_price.toLocaleString('es-CL')}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">${(item.quantity * item.unit_price).toLocaleString('es-CL')}</td>
                      <td className="px-4 py-3 text-center">
                        <ItemApprovalButtons
                          trackingToken={params.token}
                          itemId={item.id}
                          currentStatus={item.status || 'pending'}
                          isLocked={!isWaitingApproval}
                        />
                      </td>
                    </tr>
                  ))}
                  {(!order.order_items || order.order_items.length === 0) && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground italic">
                        No se han agregado ítems al presupuesto aún.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
               <span className="text-sm font-bold uppercase tracking-wider opacity-70">Total Aprobado</span>
               <span className="text-xl font-black">${total.toLocaleString('es-CL')}</span>
            </div>
          </CardContent>
        </Card>

        {/* Bitácora / Historial */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900 px-1">Historial de Servicio</h3>
          <div className="relative space-y-6 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {timeline.map((event: any) => {
              const config = statusConfig[event.status as Status] || { icon: Circle, color: 'text-slate-400' }
              const Icon = config.icon
              return (
                <div key={event.id} className="relative pl-12">
                  <div className={`absolute left-0 top-0 w-10 h-10 rounded-full border-4 border-slate-50 bg-white flex items-center justify-center z-10 shadow-sm ${config.color.split(' ')[1]}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="bg-white p-4 rounded-xl border-2 shadow-sm space-y-1">
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] font-black uppercase text-primary tracking-widest">{config.label}</span>
                       <span className="text-[10px] font-bold text-muted-foreground">
                         {new Date(event.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                         {' · '}
                         {new Date(event.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                       </span>
                    </div>
                    <p className="text-sm text-slate-700 leading-snug">{event.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Contacto Taller */}
        {order.workshops?.phone && (
          <div className="pt-4">
             <a 
              href={`tel:${order.workshops.phone}`}
              className="flex items-center justify-center gap-2 w-full h-14 bg-white border-2 border-primary text-primary rounded-xl font-bold hover:bg-primary/5 transition-colors"
             >
               <Phone className="w-5 h-5" />
               Llamar al Taller
             </a>
          </div>
        )}
      </main>

      <footer className="max-w-2xl mx-auto px-6 py-12 text-center text-muted-foreground">
         <p className="text-[10px] font-bold uppercase tracking-widest">Desarrollado por MotoTrack SaaS</p>
      </footer>
    </div>
  )
}
