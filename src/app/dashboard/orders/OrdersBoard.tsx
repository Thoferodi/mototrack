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
  {
    id: 'received',
    label: 'Recibidas',
    dotClass: 'bg-slate-400',
    badgeClass: 'bg-slate-500/15 text-slate-200 border-slate-400/30 hover:bg-slate-500/20',
    countClass: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
  },
  {
    id: 'diagnosing',
    label: 'En Diagnóstico',
    dotClass: 'bg-sky-400',
    badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-400/30 hover:bg-sky-500/20',
    countClass: 'bg-sky-500/15 text-sky-300 border-sky-400/30',
  },
  {
    id: 'waiting_approval',
    label: 'Esperando Aprobación',
    dotClass: 'bg-amber-400',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-400/30 hover:bg-amber-500/20',
    countClass: 'bg-amber-500/15 text-amber-300 border-amber-400/30',
  },
  {
    id: 'in_progress',
    label: 'En Reparación',
    dotClass: 'bg-orange-500',
    badgeClass: 'bg-orange-500/15 text-orange-300 border-orange-400/30 hover:bg-orange-500/20',
    countClass: 'bg-orange-500/15 text-orange-300 border-orange-400/30',
  },
  {
    id: 'testing',
    label: 'Control Calidad',
    dotClass: 'bg-violet-400',
    badgeClass: 'bg-violet-500/15 text-violet-300 border-violet-400/30 hover:bg-violet-500/20',
    countClass: 'bg-violet-500/15 text-violet-300 border-violet-400/30',
  },
  {
    id: 'ready',
    label: 'Listas',
    dotClass: 'bg-emerald-400',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30 hover:bg-emerald-500/20',
    countClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
  },
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
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por placa, moto o cliente..."
            className="h-10 pl-10 rounded-xl bg-[#101218] border-white/10 text-white placeholder:text-slate-500 focus-visible:border-orange-500/60 focus-visible:ring-orange-500/30 focus-visible:ring-offset-0 [color-scheme:dark]"
          />
        </div>

        <div className="inline-flex items-center gap-1 bg-[#101218] border border-white/10 p-1 rounded-xl self-start sm:self-auto">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setView('active')}
            className={
              view === 'active'
                ? 'h-8 rounded-lg bg-orange-500/15 text-orange-300 border border-orange-500/30 hover:bg-orange-500/20 hover:text-orange-200 text-xs font-semibold'
                : 'h-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.04] text-xs font-semibold border border-transparent'
            }
          >
            En Curso ({activeOrders.length})
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setView('delivered')}
            className={
              view === 'delivered'
                ? 'h-8 rounded-lg bg-orange-500/15 text-orange-300 border border-orange-500/30 hover:bg-orange-500/20 hover:text-orange-200 text-xs font-semibold'
                : 'h-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.04] text-xs font-semibold border border-transparent'
            }
          >
            Entregadas ({deliveredOrders.length})
          </Button>
        </div>
      </div>

      {view === 'active' ? (
        <div className="flex gap-4 overflow-x-auto pb-4 [color-scheme:dark] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-[#0B0D12] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/15 hover:[&::-webkit-scrollbar-thumb]:bg-orange-500/40">
          {KANBAN_COLUMNS.map((column) => {
            const colOrders = ordersByStatus(column.id)
            return (
              <div key={column.id} className="flex flex-col min-w-[272px] w-[272px] shrink-0 space-y-3">
                <div className="flex items-center justify-between px-2">
                  <h2 className="font-semibold text-xs flex items-center gap-2 uppercase tracking-wider text-slate-200">
                    <span className={`h-2 w-2 rounded-full ${column.dotClass}`} />
                    <span>{column.label}</span>
                  </h2>
                  <Badge
                    variant="outline"
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${column.countClass}`}
                  >
                    {colOrders.length}
                  </Badge>
                </div>

                <div className="flex-1 space-y-3 bg-[#101218] p-2.5 rounded-2xl border border-white/10 min-h-[460px]">
                  {colOrders.map((order) => (
                    <Link key={order.id} href={`/dashboard/orders/${order.id}`} className="block group">
                      <Card className="rounded-xl border border-white/10 bg-[#13161E] text-slate-100 shadow-none transition-all duration-200 hover:border-orange-500/40 hover:bg-[#171B25]">
                        <CardHeader className="p-4 pb-2 space-y-3">
                          <div className="flex justify-between items-start gap-2">
                            <Badge
                              variant="outline"
                              className={`font-mono text-sm font-bold tracking-wider rounded-lg px-2.5 py-0.5 ${column.badgeClass}`}
                            >
                              {order.motorcycles?.license_plate || 'SIN-PLACA'}
                            </Badge>
                            {order.tracking_token && <CopyTrackerButton token={order.tracking_token} />}
                          </div>
                          <div className="space-y-1">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-white">
                              <Bike className="w-4 h-4 text-orange-400/90 shrink-0" />
                              <span className="truncate">
                                {order.motorcycles?.brand} {order.motorcycles?.model || 'Moto'}
                              </span>
                            </CardTitle>
                            <p className="text-xs text-slate-400 flex items-center gap-2">
                              <User className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                              <span className="truncate">
                                {order.motorcycles?.customers?.full_name || 'Sin cliente'}
                              </span>
                            </p>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="flex items-center justify-between gap-2 mt-2 pt-2.5 border-t border-white/[0.07] text-[11px] text-slate-400 uppercase font-medium">
                            <span className="flex items-center gap-1 font-mono text-slate-300">
                              <ClipboardList className="w-3 h-3 text-slate-500" />
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
                    <div className="h-24 flex items-center justify-center rounded-xl border border-dashed border-white/[0.08] text-xs text-slate-500 italic">
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
            <Link key={order.id} href={`/dashboard/orders/${order.id}`} className="block group">
              <Card className="rounded-2xl border border-white/10 bg-[#101218] text-slate-100 shadow-none transition-all duration-200 hover:border-orange-500/40 hover:bg-[#13161E]">
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-start gap-2">
                    <Badge
                      variant="outline"
                      className="font-mono text-sm font-bold tracking-wider rounded-lg border-white/15 bg-white/[0.06] text-white"
                    >
                      {order.motorcycles?.license_plate || 'SIN-PLACA'}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      Entregada
                    </Badge>
                  </div>
                  <CardTitle className="text-base font-bold pt-2 text-white">
                    {order.motorcycles?.brand} {order.motorcycles?.model}
                  </CardTitle>
                  <p className="text-xs text-slate-400">
                    Cliente: {order.motorcycles?.customers?.full_name || 'Sin cliente'}
                  </p>
                </CardHeader>
                <CardContent className="p-4 pt-2 flex justify-between items-center text-xs text-slate-400 border-t border-white/[0.07] mt-2">
                  <span className="font-mono">#{order.order_number ?? order.id.split('-')[0]}</span>
                  <span className="font-mono font-bold text-orange-400 text-sm">
                    ${calcOrderTotal(order.order_items).toLocaleString('es-CL')}
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
          {deliveredOrders.length === 0 && (
            <div className="col-span-full py-12 text-center text-sm text-slate-400 bg-[#101218] rounded-2xl border border-dashed border-white/10">
              No hay órdenes entregadas que coincidan con la búsqueda.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
