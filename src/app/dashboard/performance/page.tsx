import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/supabase/server'
import {
  getBogotaPeriodRange,
  isTimestampInRange,
  normalizePerformancePeriod,
} from '@/lib/format'
import {
  MechanicPerformanceSummary,
  PerformanceOrderRow,
  PerformanceView,
  UnassignedPerformanceSummary,
} from './PerformanceView'

export const dynamic = 'force-dynamic'

const PERFORMANCE_ALLOWED_ROLES = new Set(['owner', 'admin', 'manager'])

interface PerformancePageProps {
  searchParams?: {
    period?: string
  }
}

interface OrderAccumulator {
  activeOrdersCount: number
  deliveredInPeriod: number
  approvedLabor: number
  approvedTotal: number
  orders: PerformanceOrderRow[]
}

function createEmptyAccumulator(): OrderAccumulator {
  return {
    activeOrdersCount: 0,
    deliveredInPeriod: 0,
    approvedLabor: 0,
    approvedTotal: 0,
    orders: [],
  }
}

export default async function PerformancePage({ searchParams }: PerformancePageProps) {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, workshop_id, role, active')
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

  if (!PERFORMANCE_ALLOWED_ROLES.has(profile.role)) {
    redirect('/dashboard/orders')
  }

  const period = normalizePerformancePeriod(searchParams?.period)
  const periodRange = getBogotaPeriodRange(period)

  const [{ data: profiles, error: profilesError }, { data: orders, error: ordersError }] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, role, active')
        .eq('workshop_id', profile.workshop_id)
        .order('full_name', { ascending: true }),
      supabase
        .from('work_orders')
        .select(`
          id,
          order_number,
          status,
          created_at,
          updated_at,
          mechanic_id,
          motorcycles (
            license_plate,
            brand,
            model,
            customers (full_name)
          ),
          order_items (
            type,
            quantity,
            unit_price,
            approved
          )
        `)
        .eq('workshop_id', profile.workshop_id)
        .order('created_at', { ascending: false }),
    ])

  if (profilesError || ordersError) {
    console.error('Error fetching performance data:', profilesError || ordersError)
    return (
      <div className="p-6">
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-200 p-4 rounded-xl text-sm font-medium">
          Error al cargar los datos de rendimiento del taller. Intenta recargar la página.
        </div>
      </div>
    )
  }

  const profileList = profiles || []
  const profileIds = new Set(profileList.map((p) => p.id))
  const byMechanic = new Map<string, OrderAccumulator>()
  const unassignedAcc = createEmptyAccumulator()

  let totalActiveOrders = 0
  let totalDeliveredInPeriod = 0
  let totalApprovedLabor = 0
  let totalApproved = 0
  let totalOrdersInPeriod = 0

  for (const order of orders || []) {
    const status = order.status || 'received'
    const isActive = status !== 'delivered' && status !== 'cancelled'
    const inPeriod = isTimestampInRange(
      order.created_at,
      periodRange.startMs,
      periodRange.endMs
    )

    const assignedKey =
      order.mechanic_id && profileIds.has(order.mechanic_id)
        ? order.mechanic_id
        : null

    let targetAcc: OrderAccumulator
    if (assignedKey) {
      let existing = byMechanic.get(assignedKey)
      if (!existing) {
        existing = createEmptyAccumulator()
        byMechanic.set(assignedKey, existing)
      }
      targetAcc = existing
    } else {
      targetAcc = unassignedAcc
    }

    if (isActive) {
      totalActiveOrders += 1
      targetAcc.activeOrdersCount += 1
    }

    if (!inPeriod) continue

    totalOrdersInPeriod += 1

    if (status === 'delivered') {
      totalDeliveredInPeriod += 1
      targetAcc.deliveredInPeriod += 1
    }

    let orderLabor = 0
    let orderTotal = 0
    if (status !== 'cancelled') {
      for (const item of order.order_items || []) {
        if (item.approved !== true) continue
        const lineTotal = Number(item.quantity ?? 1) * Number(item.unit_price ?? 0)
        orderTotal += lineTotal
        if (item.type === 'labor') {
          orderLabor += lineTotal
        }
      }
    }

    totalApprovedLabor += orderLabor
    totalApproved += orderTotal
    targetAcc.approvedLabor += orderLabor
    targetAcc.approvedTotal += orderTotal

    const moto = order.motorcycles
    const bikeLabel = [moto?.brand, moto?.model].filter(Boolean).join(' ') || 'Motocicleta'

    targetAcc.orders.push({
      id: order.id,
      order_number: order.order_number,
      status,
      created_at: order.created_at,
      license_plate: moto?.license_plate || 'SIN-PLACA',
      bike_label: bikeLabel,
      customer_name: moto?.customers?.full_name || 'Sin cliente',
      approved_labor: orderLabor,
      approved_total: orderTotal,
    })
  }

  const mechanics: MechanicPerformanceSummary[] = []
  for (const p of profileList) {
    const isActive = p.active !== false
    const acc = byMechanic.get(p.id) || createEmptyAccumulator()
    const hasHistoryInPeriod = acc.orders.length > 0
    const hasCurrentActive = acc.activeOrdersCount > 0

    // Mecánicos activos siempre visibles; inactivos solo si tienen órdenes históricas en el período;
    // otros roles solo si tienen órdenes asignadas en el período o activas actualmente.
    const shouldInclude = isActive
      ? p.role === 'mechanic' || hasHistoryInPeriod || hasCurrentActive
      : hasHistoryInPeriod

    if (!shouldInclude) continue

    mechanics.push({
      id: p.id,
      full_name: p.full_name,
      role: p.role,
      active: isActive,
      active_orders_count: acc.activeOrdersCount,
      delivered_in_period: acc.deliveredInPeriod,
      approved_labor: acc.approvedLabor,
      approved_total: acc.approvedTotal,
      orders: acc.orders,
    })
  }

  mechanics.sort((a, b) => {
    if (b.approved_total !== a.approved_total) return b.approved_total - a.approved_total
    if (b.delivered_in_period !== a.delivered_in_period) {
      return b.delivered_in_period - a.delivered_in_period
    }
    if (b.active_orders_count !== a.active_orders_count) {
      return b.active_orders_count - a.active_orders_count
    }
    return a.full_name.localeCompare(b.full_name, 'es')
  })

  const unassigned: UnassignedPerformanceSummary | null =
    unassignedAcc.orders.length > 0 || unassignedAcc.activeOrdersCount > 0
      ? {
          active_orders_count: unassignedAcc.activeOrdersCount,
          delivered_in_period: unassignedAcc.deliveredInPeriod,
          approved_labor: unassignedAcc.approvedLabor,
          approved_total: unassignedAcc.approvedTotal,
          orders: unassignedAcc.orders,
        }
      : null

  return (
    <div className="p-4 md:p-6">
      <PerformanceView
        period={period}
        periodLabel={periodRange.label}
        totals={{
          activeOrders: totalActiveOrders,
          deliveredInPeriod: totalDeliveredInPeriod,
          approvedLabor: totalApprovedLabor,
          approvedTotal: totalApproved,
          totalOrdersInPeriod,
        }}
        mechanics={mechanics}
        unassigned={unassigned}
      />
    </div>
  )
}
