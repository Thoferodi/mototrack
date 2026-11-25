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

  if (!profile) {
    redirect('/login')
  }

  const { data: orders, error } = (await supabase
    .from('workorders')
    .select(`
      *,
      motorcycles (plate, make, model),
      customers (full_name, phone)
    `)
    .eq('workshop_id', profile.workshop_id)
    .order('created_at', { ascending: false })) as {
    data: OrderWithDetails[] | null
    error: any
  }

  if (error) {
    console.error('Error fetching orders:', error)
    return (
      <div className="p-6">
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl text-sm font-medium">
          Error al cargar las órdenes de trabajo. Intenta recargar la página.
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tablero de Órdenes</h1>
          <p className="text-muted-foreground">
            Gestiona el flujo de trabajo del taller en tiempo real.
          </p>
        </div>
        <Button asChild size="lg" className="h-12 md:h-10">
          <Link href="/dashboard/orders/new" className="gap-2">
            <Plus className="w-5 h-5" /> Nueva Orden
          </Link>
        </Button>
      </div>

      <OrdersBoard orders={orders || []} />
    </div>
  )
}
