import Link from 'next/link'
import { Plus, LayoutDashboard, Bike, User, ClipboardList } from 'lucide-react'
import { createClient } from '@/supabase/server'
import { Database } from '@/types/database.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CopyTrackerButton } from './copy-button'

type OrderWithDetails = Database['public']['Tables']['workorders']['Row'] & {
  motorcycles: Pick<Database['public']['Tables']['motorcycles']['Row'], 'plate' | 'model'>
  customers: Pick<Database['public']['Tables']['customers']['Row'], 'full_name'>
}

const KANBAN_COLUMNS = [
  { id: 'received', label: 'Recibidas', variant: 'secondary' as const },
  { id: 'diagnosing', label: 'En Diagnóstico', variant: 'warning' as const },
  { id: 'waiting_approval', label: 'Esperando Aprobación', variant: 'destructive' as const },
  { id: 'in_repair', label: 'En Reparación', variant: 'default' as const },
  { id: 'ready_for_pickup', label: 'Listas', variant: 'success' as const },
]

export default async function OrdersPage() {
  const supabase = createClient()

  // Fetch orders with joins
  const { data: orders, error } = await supabase
    .from('workorders')
    .select(`
      *,
      motorcycles (plate, model),
      customers (full_name)
    `)
    .order('created_at', { ascending: false }) as { data: OrderWithDetails[] | null, error: any }

  if (error) {
    console.error('Error fetching orders:', error)
    return <div>Error al cargar las órdenes.</div>
  }

  const ordersByStatus = (status: string) => 
    orders?.filter(order => order.status === status) || []

  return (
    <div className="p-4 md:p-6 space-y-6 bg-slate-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tablero de Órdenes</h1>
          <p className="text-muted-foreground">Gestiona el flujo de trabajo del taller en tiempo real.</p>
        </div>
        <Button asChild size="lg" className="h-12 md:h-10">
          <Link href="/dashboard/orders/new" className="gap-2">
            <Plus className="w-5 h-5" /> Nueva Orden
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((column) => (
          <div key={column.id} className="flex flex-col min-w-[280px] space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="font-semibold text-sm flex items-center gap-2 uppercase tracking-wider text-muted-foreground">
                {column.label}
                <Badge variant="outline" className="bg-background">{ordersByStatus(column.id).length}</Badge>
              </h2>
            </div>

            <div className="flex-1 space-y-3 bg-slate-100/50 p-2 rounded-xl border-2 border-dashed border-slate-200 min-h-[500px]">
              {ordersByStatus(column.id).map((order) => (
                <Link key={order.id} href={`/dashboard/orders/${order.id}`} className="block group">
                  <Card className="hover:shadow-md transition-all border-none shadow-sm ring-1 ring-slate-200">
                    <CardHeader className="p-4 pb-2 space-y-3">
                      <div className="flex justify-between items-start">
                        <Badge className="font-mono text-sm tracking-wider" variant={column.variant}>
                          {order.motorcycles.plate}
                        </Badge>
                        <CopyTrackerButton token={order.tracking_token} />
                      </div>
                      <div className="space-y-1">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                          <Bike className="w-4 h-4 text-slate-400" />
                          {order.motorcycles.model}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                          <User className="w-3.5 h-3.5" />
                          {order.customers.full_name}
                        </p>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400 uppercase font-medium">
                        <ClipboardList className="w-3 h-3" />
                        ID: {order.id.split('-')[0]}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
              
              {ordersByStatus(column.id).length === 0 && (
                <div className="h-20 flex items-center justify-center text-xs text-slate-400 italic">
                  Sin órdenes
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
