'use client'

import * as React from 'react'
import Link from 'next/link'
import { Bike, User, ClipboardList, Search, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Database } from '@/types/database.types'
import { CopyTrackerButton } from './copy-button'

type OrderItemSummary = Pick<
  Database['public']['Tables']['order_items']['Row'],
  'quantity' | 'unit_price' | 'approved'
>

export type OrderWithDetails = Database['public']['Tables']['work_orders']['Row'] & {
  motorcycles:
    | (Pick<Database['public']['Tables']['motorcycles']['Row'], 'license_plate' | 'brand' | 'model'> & {
        customers: Pick<
          Database['public']['Tables']['customers']['Row'],
          'full_name' | 'phone_whatsapp'
        > | null
      })
    | null
  order_items?: OrderItemSummary[]
}

const KANBAN_COLUMNS = [
  { id: 'received', label: 'Recibidas', variant: 'secondary' as const },
  { id: 'diagnosing', label: 'En Diagnóstico', variant: 'warning' as const },
  { id: 'waiting_approval', label: 'Esperando Aprobación', variant: 'destructive' as const },
  { id: 'in_progress', label: 'En Reparación', variant: 'default' as const },
  { id: 'testing', label: 'Control Calidad', variant: 'outline' as const },
  { id: 'ready', label: 'Listas', variant: 'success' as const },
]

function calcOrderTotal(items?: OrderItemSummary[]): number {
  if (!items || items.length === 0) return 0
  return items.reduce((acc, item) => {
    if (item.approved === false) return acc
    return acc + Number(item.quantity ?? 1) * Number(item.unit_price ?? 0)
  }, 0)
}

export function OrdersBoard({ orders }: { orders: OrderWithDetails[] }) {
  const [search, setSearch] = React.useState('')
  const [view, setView] = React.useState<'active' | 'delivered'>('active')

  const normalizedSearch = search.trim().toLowerCase()
  const normalizedCompactSearch = normalizedSearch.replace(/\s+/g, '')
  const filteredOrders = React.useMemo(() => {
    if (!normalizedSearch) return orders
    return orders.filter((order) => {
      const plate = order.motorcycles?.license_plate?.toLowerCase() || ''
      const compactPlate = plate.replace(/\s+/g, '')
      const model = `${order.motorcycles?.brand || ''} ${order.motorcycles?.model || ''}`.toLowerCase()
      const customer = order.motorcycles?.customers?.full_name?.toLowerCase() || ''
      const shortId = order.id.slice(0, 8).toLowerCase()
      const orderNum = String(order.order_number || '')
      return (
        plate.includes(normalizedSearch) ||
        (normalizedCompactSearch.length > 0 && compactPlate.includes(normalizedCompactSearch)) ||
        model.includes(normalizedSearch) ||
        customer.includes(normalizedSearch) ||
        shortId.includes(normalizedSearch) ||
        orderNum.includes(normalizedSearch)
      )
    })
  }, [orders, normalizedSearch, normalizedCompactSearch])

  const activeOrders = filteredOrders.filter(
    (o) => o.status !== 'delivered' && o.status !== 'cancelled'
  )
  const deliveredOrders = filteredOrders.filter((o) => o.status === 'delivered')

  const ordersByStatus = (status: string) =>
    activeOrders.filter((order) => (order.status || 'received') === status)

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por placa, moto o cliente..."
            className="pl-9 bg-white"
          />
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg self-start sm:self-auto">
          <Button
            type="button"
            variant={view === 'active' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setView('active')}
            className="text-xs font-semibold"
          >
            En Curso ({activeOrders.length})
          </Button>
          <Button
            type="button"
            variant={view === 'delivered' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setView('delivered')}
            className="text-xs font-semibold"
          >
            Entregadas ({deliveredOrders.length})
          </Button>
        </div>
      </div>

      {view === 'active' ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {KANBAN_COLUMNS.map((column) => {
            const colOrders = ordersByStatus(column.id)
            return (
              <div key={column.id} className="flex flex-col min-w-[265px] w-[265px] shrink-0 space-y-3">
                <div className="flex items-center justify-between px-2">
                  <h2 className="font-semibold text-xs flex items-center gap-2 uppercase tracking-wider text-muted-foreground">
                    {column.label}
                    <Badge variant="outline" className="bg-background">
                      {colOrders.length}
                    </Badge>
                  </h2>
                </div>

                <div className="flex-1 space-y-3 bg-slate-100/60 p-2 rounded-xl border-2 border-dashed border-slate-200 min-h-[460px]">
                  {colOrders.map((order) => (
                    <Link key={order.id} href={`/dashboard/orders/${order.id}`} className="block group">
                      <Card className="hover:shadow-md transition-all border-none shadow-sm ring-1 ring-slate-200">
                        <CardHeader className="p-4 pb-2 space-y-3">
                          <div className="flex justify-between items-start">
                            <Badge className="font-mono text-sm tracking-wider" variant={column.variant}>
                              {order.motorcycles?.license_plate || 'SIN-PLACA'}
                            </Badge>
                            {order.tracking_token && <CopyTrackerButton token={order.tracking_token} />}
                          </div>
                          <div className="space-y-1">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                              <Bike className="w-4 h-4 text-slate-400 shrink-0" />
                              <span className="truncate">
                                {order.motorcycles?.brand} {order.motorcycles?.model || 'Moto'}
                              </span>
                            </CardTitle>
                            <p className="text-xs text-muted-foreground flex items-center gap-2">
                              <User className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">
                                {order.motorcycles?.customers?.full_name || 'Sin cliente'}
                              </span>
                            </p>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400 uppercase font-medium">
                            <span className="flex items-center gap-1">
                              <ClipboardList className="w-3 h-3" />
                              #{order.order_number ?? order.id.split('-')[0]}
                            </span>
                            {order.created_at && (
                              <span>
                                {new Date(order.created_at).toLocaleDateString('es-ES', {
                                  day: '2-digit',
                                  month: 'short',
                                })}
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}

                  {colOrders.length === 0 && (
                    <div className="h-20 flex items-center justify-center text-xs text-slate-400 italic">
                      Sin órdenes
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {deliveredOrders.map((order) => (
            <Link key={order.id} href={`/dashboard/orders/${order.id}`} className="block">
              <Card className="hover:shadow-md transition-all border-slate-200">
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-start">
                    <Badge className="font-mono text-sm" variant="secondary">
                      {order.motorcycles?.license_plate || 'SIN-PLACA'}
                    </Badge>
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1" variant="outline">
                      <CheckCircle2 className="w-3 h-3" />
                      Entregada
                    </Badge>
                  </div>
                  <CardTitle className="text-base font-bold pt-2">
                    {order.motorcycles?.brand} {order.motorcycles?.model}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Cliente: {order.motorcycles?.customers?.full_name || 'Sin cliente'}
                  </p>
                </CardHeader>
                <CardContent className="p-4 pt-2 flex justify-between items-center text-xs text-slate-500 border-t mt-2">
                  <span>#{order.order_number ?? order.id.split('-')[0]}</span>
                  <span className="font-bold text-slate-900">
                    ${calcOrderTotal(order.order_items).toLocaleString('es-CL')}
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
          {deliveredOrders.length === 0 && (
            <div className="col-span-full py-12 text-center text-sm text-muted-foreground bg-white rounded-xl border border-dashed">
              No hay órdenes entregadas que coincidan con la búsqueda.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
