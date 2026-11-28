import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Wrench, ChevronRight, Clock, LayoutDashboard } from 'lucide-react'
import { createServerSupabaseClient } from '@/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getWorkOrderStatusLabel } from '@/lib/workorder-status'
import { MechanicSignOutButton } from './sign-out-button'

export const dynamic = 'force-dynamic'

export default async function MechanicListPage() {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, workshop_id, full_name, role, active, workshops(name)')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.workshop_id) {
    redirect('/login')
  }

  if (profile.active === false) {
    redirect('/login?error=account_disabled')
  }

  const { data: orders, error } = await supabase
    .from('work_orders')
    .select('*, motorcycles(*, customers(full_name))')
    .eq('workshop_id', profile.workshop_id)
    .or(`mechanic_id.eq.${profile.id},mechanic_id.is.null`)
    .not('status', 'in', '("delivered","cancelled")')
    .order('created_at', { ascending: false })

  const workshopName = (profile.workshops as { name?: string } | null)?.name || 'Taller'
  const roleStr = String(profile.role)
  const canAccessDashboard =
    roleStr === 'admin' ||
    roleStr === 'owner' ||
    roleStr === 'manager' ||
    roleStr === 'receptionist'

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-24">
      {/* Header Mobile Técnico */}
      <header className="p-4 sm:p-6 bg-slate-800 border-b border-slate-700 sticky top-0 z-50 shadow-2xl">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shrink-0">
              <Wrench className="w-6 h-6 text-slate-900" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-black tracking-tighter italic truncate">
                MANOS SUCIAS
              </h1>
              <p className="text-[11px] font-bold text-primary uppercase tracking-widest truncate">
                {workshopName} · {profile.full_name || user.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {canAccessDashboard && (
              <Button
                asChild
                variant="ghost"
                className="h-14 px-3 rounded-2xl text-slate-300 hover:text-white hover:bg-slate-700"
              >
                <Link href="/dashboard/orders" aria-label="Ir al panel administrativo">
                  <LayoutDashboard className="w-5 h-5" />
                </Link>
              </Button>
            )}
            <MechanicSignOutButton />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-4">
        <div className="flex items-center gap-2 px-2 pb-1">
          <Clock className="w-4 h-4 text-primary" />
          <h2 className="text-xs font-black uppercase tracking-widest opacity-70">
            Órdenes en Curso ({orders?.length || 0})
          </h2>
        </div>

        {error && (
          <div className="bg-red-950/60 border-2 border-red-500/40 text-red-200 p-4 rounded-2xl text-sm font-semibold">
            No pudimos cargar las órdenes de tu taller. Intenta recargar la página.
          </div>
        )}

        {orders?.map((order) => {
          const moto = order.motorcycles
          const customer = moto?.customers
          return (
            <Link
              key={order.id}
              href={`/mechanic/order/${order.id}`}
              className="block active:scale-[0.98] transition-transform"
            >
              <Card className="bg-slate-800 border-2 border-slate-700 overflow-hidden shadow-lg hover:border-primary/50 transition-colors">
                <CardContent className="p-0">
                  <div className="p-5 flex justify-between items-start gap-3 border-b border-slate-700/50">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Placa
                      </p>
                      <h3 className="text-3xl sm:text-4xl font-black font-mono tracking-tighter text-white">
                        {moto?.license_plate || 'SIN-PLACA'}
                      </h3>
                    </div>
                    <Badge className="bg-primary text-slate-900 font-black uppercase text-[10px] rounded-full px-3 py-1.5 shrink-0">
                      {getWorkOrderStatusLabel(order.status)}
                    </Badge>
                  </div>
                  <div className="p-5 bg-slate-800/50 flex items-center justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <h4 className="text-lg font-bold text-slate-100 truncate">
                        {moto?.brand} {moto?.model}
                      </h4>
                      <p className="text-xs font-medium italic text-slate-400 truncate">
                        Cliente: {customer?.full_name || 'Sin nombre'}
                      </p>
                    </div>
                    <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 shrink-0">
                      <ChevronRight className="w-8 h-8 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}

        {!error && (!orders || orders.length === 0) && (
          <div className="py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto border-2 border-dashed border-slate-700">
              <Wrench className="w-10 h-10 text-slate-600" />
            </div>
            <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">
              No hay órdenes asignadas en tu taller
            </p>
          </div>
        )}
      </main>

      {/* Footer Mobile Nav */}
      <nav className="fixed bottom-0 inset-x-0 bg-slate-800 border-t border-slate-700 px-6 py-3 flex justify-center items-center z-50 sm:hidden">
        <div className="flex items-center gap-2 text-primary">
          <Wrench className="w-5 h-5" />
          <span className="text-xs font-black uppercase tracking-wider">Órdenes Activas</span>
        </div>
      </nav>
    </div>
  )
}
