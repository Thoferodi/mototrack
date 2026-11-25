import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Plus } from 'lucide-react'
import { createServerSupabaseClient } from '@/supabase/server'
import { Button } from '@/components/ui/button'
import { OrdersBoard, OrderWithDetails } from './OrdersBoard'

export default async function OrdersPage() {
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

  const { data: orders, error } = await supabase
    .from('work_orders')
    .select(`
      *,
      motorcycles (
        license_plate,
        brand,
        model,
        customers (full_name, phone_whatsapp)
      ),
      order_items (quantity, unit_price, approved)
    `)
    .eq('workshop_id', profile.workshop_id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching orders:', error)
    return (
      <div className="p-6">
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-200 p-4 rounded-xl text-sm font-medium">
          Error al cargar las órdenes de trabajo. Intenta recargar la página.
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Tablero de Órdenes</h1>
          <p className="text-sm text-slate-400">
            Gestiona el flujo de trabajo del taller en tiempo real.
          </p>
        </div>
        <Button
          asChild
          size="lg"
          className="h-12 md:h-10 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold shadow-[0_0_24px_rgba(249,115,22,0.3)] border border-orange-400/50 transition-all"
        >
          <Link href="/dashboard/orders/new" className="gap-2">
            <Plus className="w-5 h-5" /> Nueva Orden
          </Link>
        </Button>
      </div>

      <OrdersBoard orders={(orders as unknown as OrderWithDetails[]) || []} />
    </div>
  )
}
