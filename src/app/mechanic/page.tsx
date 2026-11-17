import { getMechanicOrders } from './actions'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Wrench, ChevronRight, Clock, MapPin } from 'lucide-react'

export default async function MechanicListPage() {
  const orders = await getMechanicOrders()

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-20">
      {/* Header Mobile Técnico */}
      <header className="p-6 bg-slate-800 border-b border-slate-700 sticky top-0 z-50 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tighter italic">MANOS SUCIAS</h1>
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Taller de Motocicletas</p>
          </div>
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <Wrench className="w-6 h-6 text-slate-900" />
          </div>
        </div>
      </header>

      <main className="p-4 space-y-4">
        <div className="flex items-center gap-2 px-2 pb-2">
          <Clock className="w-4 h-4 text-primary" />
          <h2 className="text-xs font-black uppercase tracking-widest opacity-70">Órdenes en Curso ({orders?.length || 0})</h2>
        </div>

        {orders?.map((order) => (
          <Link key={order.id} href={`/mechanic/order/${order.id}`} className="block active:scale-[0.98] transition-transform">
            <Card className="bg-slate-800 border-2 border-slate-700 overflow-hidden shadow-lg hover:border-primary/50 transition-colors">
              <CardContent className="p-0">
                <div className="p-5 flex justify-between items-start border-b border-slate-700/50">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Placa</p>
                    <h3 className="text-4xl font-black font-mono tracking-tighter text-white">
                      {order.motorcycles?.plate}
                    </h3>
                  </div>
                  <Badge className="bg-primary text-slate-900 font-black uppercase text-[10px] rounded-full px-3 py-1">
                    {order.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="p-5 bg-slate-800/50 flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="text-lg font-bold text-slate-100">{order.motorcycles?.make} {order.motorcycles?.model}</h4>
                    <div className="flex items-center gap-2 text-slate-400">
                      <p className="text-xs font-medium italic">Cliente: {order.customers?.full_name}</p>
                    </div>
                  </div>
                  <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                    <ChevronRight className="w-8 h-8 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        {(!orders || orders.length === 0) && (
          <div className="py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto border-2 border-dashed border-slate-700">
              <Wrench className="w-10 h-10 text-slate-600" />
            </div>
            <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">No hay órdenes asignadas</p>
          </div>
        )}
      </main>

      {/* Footer Mobile Nav Placeholder */}
      <nav className="fixed bottom-0 inset-x-0 bg-slate-800 border-t border-slate-700 p-4 flex justify-around items-center z-50 sm:hidden">
         <div className="flex flex-col items-center gap-1 text-primary">
            <Wrench className="w-6 h-6" />
            <span className="text-[10px] font-black uppercase">Órdenes</span>
         </div>
      </nav>
    </div>
  )
}
