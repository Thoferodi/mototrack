'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  ArrowUpRight,
  BarChart3,
  Bike,
  CheckCircle2,
  ChevronDown,
  DollarSign,
  UserX,
  Wrench,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  formatBogotaDate,
  formatCOP,
  PERFORMANCE_PERIOD_LABELS,
  PerformancePeriod,
} from '@/lib/format'
import { TEAM_ROLE_LABELS, UserRole } from '@/lib/team'
import { getWorkOrderStatusLabel } from '@/lib/workorder-status'
import { cn } from '@/lib/utils'

export interface PerformanceOrderRow {
  id: string
  order_number: number
  status: string
  created_at: string | null
  license_plate: string
  bike_label: string
  customer_name: string
  approved_labor: number
  approved_total: number
}

export interface MechanicPerformanceSummary {
  id: string
  full_name: string
  role: UserRole
  active: boolean
  active_orders_count: number
  delivered_in_period: number
  approved_labor: number
  approved_total: number
  orders: PerformanceOrderRow[]
}

export interface UnassignedPerformanceSummary {
  active_orders_count: number
  delivered_in_period: number
  approved_labor: number
  approved_total: number
  orders: PerformanceOrderRow[]
}

interface PerformanceViewProps {
  period: PerformancePeriod
  periodLabel: string
  totals: {
    activeOrders: number
    deliveredInPeriod: number
    approvedLabor: number
    approvedTotal: number
    totalOrdersInPeriod: number
  }
  mechanics: MechanicPerformanceSummary[]
  unassigned: UnassignedPerformanceSummary | null
}

const PERIOD_OPTIONS: PerformancePeriod[] = [
  'this_month',
  'last_month',
  'last_90d',
  'all',
]

const STATUS_BADGE_CLASSES: Record<string, string> = {
  received: 'bg-slate-500/15 text-slate-200 border-slate-400/30',
  diagnosing: 'bg-sky-500/15 text-sky-300 border-sky-400/30',
  waiting_approval: 'bg-amber-500/15 text-amber-300 border-amber-400/30',
  in_progress: 'bg-orange-500/15 text-orange-300 border-orange-400/30',
  testing: 'bg-violet-500/15 text-violet-300 border-violet-400/30',
  ready: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
  delivered: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
  cancelled: 'bg-rose-500/15 text-rose-300 border-rose-400/30',
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'M'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

function getWorkloadBadge(activeCount: number): { label: string; className: string } {
  if (activeCount === 0) {
    return {
      label: 'Disponible',
      className: 'border-white/10 bg-white/[0.04] text-slate-400',
    }
  }
  if (activeCount <= 3) {
    return {
      label: `${activeCount} en curso`,
      className: 'border-sky-500/30 bg-sky-500/15 text-sky-300',
    }
  }
  return {
    label: `${activeCount} en curso · Alta carga`,
    className: 'border-orange-500/35 bg-orange-500/15 text-orange-300',
  }
}

function OrdersDetailList({ orders }: { orders: PerformanceOrderRow[] }) {
  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 bg-[#0B0D13] px-4 py-6 text-center text-xs text-slate-400">
        No hay órdenes registradas en este período.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-white/10 bg-[#0B0D13]">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-white/10 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-white/[0.02]">
            <tr>
              <th className="px-3.5 py-2.5">Placa</th>
              <th className="px-3.5 py-2.5">Motocicleta</th>
              <th className="px-3.5 py-2.5">Cliente</th>
              <th className="px-3 py-2.5">Orden</th>
              <th className="px-3.5 py-2.5">Estado</th>
              <th className="px-3.5 py-2.5 text-right">Mano de Obra</th>
              <th className="px-3.5 py-2.5 text-right">Total Aprobado</th>
              <th className="px-3.5 py-2.5">Fecha</th>
              <th className="px-3.5 py-2.5 text-right">Detalle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {orders.map((ord) => {
              const statusClass =
                STATUS_BADGE_CLASSES[ord.status] ||
                'bg-white/[0.06] text-slate-200 border-white/15'
              return (
                <tr key={ord.id} className="hover:bg-white/[0.03] transition-colors">
                  <td className="px-3.5 py-2.5 whitespace-nowrap">
                    <span className="inline-block rounded-md border border-orange-500/35 bg-orange-500/15 px-2 py-0.5 font-mono text-xs font-bold tracking-wider text-orange-300">
                      {ord.license_plate}
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5 font-semibold text-white">
                    {ord.bike_label}
                  </td>
                  <td className="px-3.5 py-2.5 text-slate-300">{ord.customer_name}</td>
                  <td className="px-3.5 py-2.5 font-mono text-slate-300">
                    #{ord.order_number}
                  </td>
                  <td className="px-3.5 py-2.5 whitespace-nowrap">
                    <Badge variant="outline" className={`rounded-full text-[10px] font-semibold ${statusClass}`}>
                      {getWorkOrderStatusLabel(ord.status)}
                    </Badge>
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-mono tabular-nums text-slate-200 whitespace-nowrap">
                    {formatCOP(ord.approved_labor)}
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-mono tabular-nums font-bold text-orange-300 whitespace-nowrap">
                    {formatCOP(ord.approved_total)}
                  </td>
                  <td className="px-3.5 py-2.5 text-slate-400 whitespace-nowrap">
                    {formatBogotaDate(ord.created_at)}
                  </td>
                  <td className="px-3.5 py-2.5 text-right whitespace-nowrap">
                    <Link
                      href={`/dashboard/orders/${ord.id}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:border-orange-500/40 hover:bg-orange-500/15 hover:text-orange-200 transition-colors"
                    >
                      Abrir
                      <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-2.5">
        {orders.map((ord) => {
          const statusClass =
            STATUS_BADGE_CLASSES[ord.status] ||
            'bg-white/[0.06] text-slate-200 border-white/15'
          return (
            <Link
              key={ord.id}
              href={`/dashboard/orders/${ord.id}`}
              className="block rounded-xl border border-white/10 bg-[#0B0D13] p-3.5 space-y-2.5 hover:border-orange-500/40 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="rounded-md border border-orange-500/35 bg-orange-500/15 px-2 py-0.5 font-mono text-xs font-bold tracking-wider text-orange-300">
                    {ord.license_plate}
                  </span>
                  <span className="font-mono text-xs text-slate-400">#{ord.order_number}</span>
                </div>
                <Badge variant="outline" className={`rounded-full text-[10px] font-semibold ${statusClass}`}>
                  {getWorkOrderStatusLabel(ord.status)}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-bold text-white truncate">{ord.bike_label}</p>
                <p className="text-xs text-slate-400 truncate">
                  {ord.customer_name} · {formatBogotaDate(ord.created_at)}
                </p>
              </div>
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/[0.07] text-xs">
                <div>
                  <span className="text-slate-500">Mano de obra: </span>
                  <span className="font-mono tabular-nums font-semibold text-slate-200">
                    {formatCOP(ord.approved_labor)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Total: </span>
                  <span className="font-mono tabular-nums font-bold text-orange-300">
                    {formatCOP(ord.approved_total)}
                  </span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export function PerformanceView({
  period,
  periodLabel,
  totals,
  mechanics,
  unassigned,
}: PerformanceViewProps) {
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(() => new Set())

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const participationDenom =
    totals.approvedTotal > 0 ? totals.approvedTotal : totals.totalOrdersInPeriod

  return (
    <div className="space-y-6">
      {/* Cabecera y Filtro de Período */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-orange-400 shrink-0" />
            Rendimiento de Mecánicos
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Productividad, mano de obra aprobada e historial de motos por técnico ·{' '}
            <span className="text-slate-200 font-medium capitalize">{periodLabel}</span>
          </p>
        </div>

        <nav
          aria-label="Selector de período"
          className="inline-flex flex-wrap items-center gap-1 rounded-xl border border-white/10 bg-[#101218] p-1 self-start lg:self-auto"
        >
          {PERIOD_OPTIONS.map((option) => {
            const isActive = period === option
            return (
              <Link
                key={option}
                href={`/dashboard/performance?period=${option}`}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                  isActive
                    ? 'bg-orange-500/15 text-orange-300 border border-orange-500/30 shadow-[0_0_16px_rgba(249,115,22,0.12)]'
                    : 'border border-transparent text-slate-400 hover:text-white hover:bg-white/[0.04]'
                )}
              >
                {PERFORMANCE_PERIOD_LABELS[option]}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Resumen Superior */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
            {totals.activeOrders}
          </p>
          <p className="text-[11px] text-slate-500">En taller actualmente</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#101218] p-4 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Entregadas
            </span>
            <span className="w-7 h-7 rounded-lg border border-emerald-500/25 bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-2xl font-mono font-black tabular-nums text-white">
            {totals.deliveredInPeriod}
          </p>
          <p className="text-[11px] text-slate-500 capitalize">{periodLabel}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#101218] p-4 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Mano de Obra
            </span>
            <span className="w-7 h-7 rounded-lg border border-sky-500/25 bg-sky-500/10 flex items-center justify-center text-sky-400">
              <Wrench className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-2xl font-mono font-black tabular-nums text-sky-300">
            {formatCOP(totals.approvedLabor)}
          </p>
          <p className="text-[11px] text-slate-500">COP aprobados</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#101218] p-4 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Aprobado
            </span>
            <span className="w-7 h-7 rounded-lg border border-orange-500/25 bg-orange-500/10 flex items-center justify-center text-orange-400">
              <DollarSign className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-2xl font-mono font-black tabular-nums text-orange-400">
            {formatCOP(totals.approvedTotal)}
          </p>
          <p className="text-[11px] text-slate-500">Repuestos + mano de obra</p>
        </div>
      </section>

      {/* Lista de Mecánicos */}
      <section className="space-y-4">
        {mechanics.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-[#101218] p-10 text-center space-y-2">
            <Wrench className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-white">
              Aún no hay mecánicos activos registrados en el taller
            </p>
            <p className="text-xs text-slate-400">
              Agrega técnicos desde la sección Equipo para medir su desempeño y asignarles órdenes.
            </p>
          </div>
        ) : (
          mechanics.map((mech) => {
            const isExpanded = expandedIds.has(mech.id)
            const workload = getWorkloadBadge(mech.active_orders_count)
            const numerator =
              totals.approvedTotal > 0 ? mech.approved_total : mech.orders.length
            const sharePct =
              participationDenom > 0
                ? Math.min(100, Math.round((numerator / participationDenom) * 100))
                : 0

            return (
              <div
                key={mech.id}
                className="rounded-2xl border border-white/10 bg-[#101218] overflow-hidden transition-colors hover:border-white/15"
              >
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  onClick={() => toggleExpand(mech.id)}
                  className="w-full text-left p-4 sm:p-5 space-y-4 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Identidad */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-11 h-11 rounded-xl border border-orange-500/30 bg-orange-500/15 text-orange-300 font-bold text-sm flex items-center justify-center shrink-0">
                        {getInitials(mech.full_name)}
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-base font-bold text-white truncate">
                            {mech.full_name}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[10px] border-white/15 bg-white/[0.04] text-slate-300"
                          >
                            {TEAM_ROLE_LABELS[mech.role] || mech.role}
                          </Badge>
                          {!mech.active && (
                            <Badge
                              variant="outline"
                              className="text-[10px] border-rose-500/30 bg-rose-500/15 text-rose-300"
                            >
                              Inactivo
                            </Badge>
                          )}
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${workload.className}`}
                          >
                            {workload.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400">
                          {mech.orders.length}{' '}
                          {mech.orders.length === 1 ? 'orden en el período' : 'órdenes en el período'}{' '}
                          · Clic para {isExpanded ? 'ocultar' : 'ver'} detalle de motos
                        </p>
                      </div>
                    </div>

                    {/* Métricas + Chevron */}
                    <div className="flex items-center justify-between lg:justify-end gap-4 sm:gap-6">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5 flex-1 lg:flex-initial">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Activas
                          </p>
                          <p className="text-base font-mono font-bold tabular-nums text-white">
                            {mech.active_orders_count}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Entregadas
                          </p>
                          <p className="text-base font-mono font-bold tabular-nums text-emerald-300">
                            {mech.delivered_in_period}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Mano de Obra
                          </p>
                          <p className="text-base font-mono font-bold tabular-nums text-sky-300">
                            {formatCOP(mech.approved_labor)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Total Aprobado
                          </p>
                          <p className="text-base font-mono font-black tabular-nums text-orange-400">
                            {formatCOP(mech.approved_total)}
                          </p>
                        </div>
                      </div>

                      <div className="w-8 h-8 rounded-lg border border-white/10 bg-white/[0.03] flex items-center justify-center text-slate-300 shrink-0">
                        <ChevronDown
                          className={cn(
                            'w-4 h-4 transition-transform duration-200',
                            isExpanded && 'rotate-180 text-orange-400'
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Barra sutil de participación */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Participación en el período</span>
                      <span className="font-mono tabular-nums font-semibold text-slate-300">
                        {sharePct}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-300"
                        style={{ width: `${sharePct}%` }}
                      />
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-white/10 bg-[#0D0F15] p-4 sm:p-5">
                    <OrdersDetailList orders={mech.orders} />
                  </div>
                )}
              </div>
            )
          })
        )}

        {/* Bloque separado: Órdenes sin mecánico asignado */}
        {unassigned && (
          <div className="rounded-2xl border border-amber-500/25 bg-[#101218] overflow-hidden">
            <button
              type="button"
              aria-expanded={expandedIds.has('__unassigned__')}
              onClick={() => toggleExpand('__unassigned__')}
              className="w-full text-left p-4 sm:p-5 space-y-3 hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl border border-amber-500/30 bg-amber-500/15 text-amber-300 flex items-center justify-center shrink-0">
                    <UserX className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-bold text-white">
                        Órdenes sin mecánico asignado
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] border-amber-500/30 bg-amber-500/15 text-amber-300"
                      >
                        Pendiente de asignación
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400">
                      {unassigned.orders.length}{' '}
                      {unassigned.orders.length === 1
                        ? 'orden en el período'
                        : 'órdenes en el período'}{' '}
                      · Haz clic para ver y asignar un responsable
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between lg:justify-end gap-4 sm:gap-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5 flex-1 lg:flex-initial">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Activas
                      </p>
                      <p className="text-base font-mono font-bold tabular-nums text-white">
                        {unassigned.active_orders_count}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Entregadas
                      </p>
                      <p className="text-base font-mono font-bold tabular-nums text-emerald-300">
                        {unassigned.delivered_in_period}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Mano de Obra
                      </p>
                      <p className="text-base font-mono font-bold tabular-nums text-sky-300">
                        {formatCOP(unassigned.approved_labor)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Total Aprobado
                      </p>
                      <p className="text-base font-mono font-black tabular-nums text-orange-400">
                        {formatCOP(unassigned.approved_total)}
                      </p>
                    </div>
                  </div>

                  <div className="w-8 h-8 rounded-lg border border-white/10 bg-white/[0.03] flex items-center justify-center text-slate-300 shrink-0">
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 transition-transform duration-200',
                        expandedIds.has('__unassigned__') && 'rotate-180 text-amber-300'
                      )}
                    />
                  </div>
                </div>
              </div>
            </button>

            {expandedIds.has('__unassigned__') && (
              <div className="border-t border-white/10 bg-[#0D0F15] p-4 sm:p-5">
                <OrdersDetailList orders={unassigned.orders} />
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
