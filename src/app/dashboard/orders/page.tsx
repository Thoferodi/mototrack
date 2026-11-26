import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Bike, CheckCircle2, DollarSign, Plus, Receipt } from 'lucide-react'
import { createServerSupabaseClient } from '@/supabase/server'
import { Button } from '@/components/ui/button'
import { formatCOP, getBogotaPeriodRange, isTimestampInRange } from '@/lib/format'
import { OrdersBoard, OrderWithDetails } from './OrdersBoard'

export const dynamic = 'force-dynamic'

const FINANCIAL_KPI_ROLES = new Set(['owner', 'admin', 'manager'])

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

  const orderList = (orders as unknown as OrderWithDetails[]) || []
  const monthRange = getBogotaPeriodRange('this_month')

  let activeBikesCount = 0
  let deliveredThisMonthCount = 0
  let approvedRevenueMonth = 0
  let ordersWithApprovedItemsCount = 0

  for (const order of orderList) {
    const status = order.status || 'received'
    if (status !== 'delivered' && status !== 'cancelled') {
      activeBikesCount += 1
    }

    if (
      status === 'delivered' &&
      isTimestampInRange(order.updated_at || order.created_at, monthRange.startMs, monthRange.endMs)
    ) {
      deliveredThisMonthCount += 1
    }

    if (
      status !== 'cancelled' &&
      isTimestampInRange(order.created_at, monthRange.startMs, monthRange.endMs)
    ) {
      const approvedItems = (order.order_items || []).filter((item) => item.approved === true)
      if (approvedItems.length > 0) {
        ordersWithApprovedItemsCount += 1
        for (const item of approvedItems) {
          approvedRevenueMonth += Number(item.quantity ?? 1) * Number(item.unit_price ?? 0)
        }
      }
    }
  }

  const averageTicketMonth =
    ordersWithApprovedItemsCount > 0
      ? Math.round(approvedRevenueMonth / ordersWithApprovedItemsCount)
      : 0

  const canViewFinancials = FINANCIAL_KPI_ROLES.has(profile.role)

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

      {/* KPIs Mensuales */}
      <section
        aria-label="Indicadores del mes"
        className={
          canViewFinancials
            ? 'grid grid-cols-2 lg:grid-cols-4 gap-3'
            : 'grid grid-cols-2 gap-3 max-w-2xl'
        }
      >
        <div className="rounded-2xl border border-white/10 bg-[#101218] p-4 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Motos Activas
            </span>
            <span className="w-7 h-7 rounded-lg border border-orange-500/25 bg-orange-500/10 flex items-center justify-center text-orange-400">
              <Bike className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-2xl font-mono font-black tabular-nums text-white">
            {activeBikesCount}
          </p>
          <p className="text-[11px] text-slate-500">En taller actualmente</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#101218] p-4 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Entregadas (Mes)
            </span>
            <span className="w-7 h-7 rounded-lg border border-emerald-500/25 bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-2xl font-mono font-black tabular-nums text-white">
            {deliveredThisMonthCount}
          </p>
          <p className="text-[11px] text-slate-500 capitalize">{monthRange.label}</p>
        </div>

        {canViewFinancials && (
          <>
            <div className="rounded-2xl border border-white/10 bg-[#101218] p-4 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Ingresos Aprobados (Mes)
                </span>
                <span className="w-7 h-7 rounded-lg border border-orange-500/25 bg-orange-500/10 flex items-center justify-center text-orange-400">
                  <DollarSign className="w-3.5 h-3.5" />
                </span>
              </div>
              <p className="text-2xl font-mono font-black tabular-nums text-orange-400">
                {formatCOP(approvedRevenueMonth)}
              </p>
              <p className="text-[11px] text-slate-500">COP aprobados · {monthRange.label}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#101218] p-4 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Ticket Promedio
                </span>
                <span className="w-7 h-7 rounded-lg border border-sky-500/25 bg-sky-500/10 flex items-center justify-center text-sky-400">
                  <Receipt className="w-3.5 h-3.5" />
                </span>
              </div>
              <p className="text-2xl font-mono font-black tabular-nums text-white">
                {formatCOP(averageTicketMonth)}
              </p>
              <p className="text-[11px] text-slate-500 tabular-nums">
                {ordersWithApprovedItemsCount}{' '}
                {ordersWithApprovedItemsCount === 1 ? 'orden aprobada' : 'órdenes aprobadas'}
              </p>
            </div>
          </>
        )}
      </section>

      <OrdersBoard orders={orderList} />
    </div>
  )
}
