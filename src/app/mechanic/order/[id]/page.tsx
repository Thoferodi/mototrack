import { createServerSupabaseClient } from '@/supabase/server'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { StatusControls } from './status-controls'
import { EvidenceCapture } from './evidence-capture'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronLeft, Wrench, User, Calendar } from 'lucide-react'
import Link from 'next/link'

interface PageProps {
  params: {
    id: string
  }
}

export default async function MechanicOrderDetailPage({ params }: PageProps) {
  const supabase = createServerSupabaseClient()

  const { data: order, error } = await supabase
    .from('workorders')
    .select(`
      *,
      motorcycles (*),
      customers (*)
    `)
    .eq('id', params.id)
    .single()

  if (error || !order) return notFound()

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-12">
      {/* Header Fijo Mobile */}
      <header className="p-4 bg-slate-800 border-b border-slate-700 sticky top-0 z-50 flex items-center justify-between shadow-lg">
        <Link href="/mechanic" className="h-12 w-12 bg-slate-700 rounded-2xl flex items-center justify-center active:scale-90 transition-transform">
          <ChevronLeft className="w-6 h-6 text-white" />
        </Link>
        <div className="text-center">
          <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest leading-none mb-1">Orden de Trabajo</p>
          <h2 className="text-2xl font-black font-mono tracking-tighter leading-none">{order.motorcycles?.plate}</h2>
        </div>
        <Badge className="bg-primary text-slate-900 font-black uppercase text-[10px] rounded-full px-3 py-1">
          {order.status.replace('_', ' ')}
        </Badge>
      </header>

      <main className="p-4 space-y-6">
        {/* Info Rápida del Vehículo */}
        <section className="bg-slate-800 rounded-3xl p-5 border-2 border-slate-700 flex justify-between items-center">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-700 rounded-2xl flex items-center justify-center">
                 <Wrench className="w-6 h-6 text-primary" />
              </div>
              <div>
                 <h3 className="font-black text-xl leading-tight">{order.motorcycles?.make}</h3>
                 <p className="text-sm font-bold text-slate-400">{order.motorcycles?.model}</p>
              </div>
           </div>
           <div className="text-right">
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">KMS</p>
              <p className="text-lg font-black text-white leading-tight">{order.mileage?.toLocaleString()}</p>
           </div>
        </section>

        {/* Sección de Control de Estado */}
        <section className="space-y-4">
           <div className="flex items-center gap-2 px-1">
              <div className="w-1.5 h-4 bg-primary rounded-full" />
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Actualizar Estado</h4>
           </div>
           <StatusControls orderId={order.id} currentStatus={order.status} />
        </section>

        {/* Sección de Captura de Evidencia */}
        <section className="space-y-4">
           <div className="flex items-center gap-2 px-1">
              <div className="w-1.5 h-4 bg-primary rounded-full" />
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Registrar Evidencia</h4>
           </div>
           <EvidenceCapture orderId={order.id} />
        </section>

        {/* Info Adicional / Cliente */}
        <section className="pt-4 space-y-3">
           <div className="flex items-center gap-3 bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
              <User className="w-5 h-5 text-slate-500" />
              <div>
                 <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Cliente</p>
                 <p className="font-bold text-slate-200">{order.customers?.full_name}</p>
              </div>
           </div>
           <div className="flex items-center gap-3 bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
              <Calendar className="w-5 h-5 text-slate-500" />
              <div>
                 <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Ingreso</p>
                 <p className="font-bold text-slate-200">{new Date(order.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
              </div>
           </div>
        </section>
      </main>
    </div>
  )
}
