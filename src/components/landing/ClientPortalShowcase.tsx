'use client'

import * as React from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  Check,
  CheckCircle2,
  PackageCheck,
  RotateCcw,
  Search,
  Smartphone,
  X,
} from 'lucide-react'

interface DemoBudgetItem {
  id: string
  description: string
  type: 'spare_part' | 'labor'
  quantity: number
  unitPrice: number
  status: 'pending' | 'approved' | 'rejected'
}

const INITIAL_DEMO_ITEMS: DemoBudgetItem[] = [
  {
    id: '1',
    description: 'Kit de arrastre reforzado Cassarella',
    type: 'spare_part',
    quantity: 1,
    unitPrice: 165000,
    status: 'approved',
  },
  {
    id: '2',
    description: 'Pastillas de freno delanteras sinterizadas',
    type: 'spare_part',
    quantity: 1,
    unitPrice: 88000,
    status: 'pending',
  },
  {
    id: '3',
    description: 'Sincronización e inyección electrónica',
    type: 'labor',
    quantity: 1,
    unitPrice: 95000,
    status: 'pending',
  },
]

export function ClientPortalShowcase() {
  const [items, setItems] = React.useState<DemoBudgetItem[]>(INITIAL_DEMO_ITEMS)

  const handleDecision = (id: string, decision: 'approved' | 'rejected') => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: decision } : item))
    )
  }

  const handleReset = () => {
    setItems(INITIAL_DEMO_ITEMS)
  }

  const pendingCount = items.filter((i) => i.status === 'pending').length
  const rejectedCount = items.filter((i) => i.status === 'rejected').length

  // Exactamente la misma lógica que PublicBudgetCard: excluye rechazados del Total Activo
  const activeTotal = items.reduce((acc, item) => {
    if (item.status === 'rejected') return acc
    return acc + item.quantity * item.unitPrice
  }, 0)

  const badgeInfo =
    pendingCount > 0
      ? {
          label: `Acción requerida · ${pendingCount} pendiente${pendingCount > 1 ? 's' : ''}`,
          classes: 'border-amber-300 bg-amber-50 text-amber-800',
        }
      : rejectedCount > 0
      ? {
          label: `Presupuesto ajustado · ${items.length - rejectedCount} aprobados`,
          classes: 'border-sky-300 bg-sky-50 text-sky-800',
        }
      : {
          label: 'Presupuesto 100% aprobado',
          classes: 'border-emerald-300 bg-emerald-50 text-emerald-800',
        }

  return (
    <section
      id="portal-cliente"
      className="relative overflow-x-clip bg-[#F8FAFC] py-20 text-slate-900 lg:py-28"
    >
      {/* Sutiles halos pastel sobre fondo claro estilo Huly light-break */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 right-0 h-80 w-80 rounded-full bg-orange-200/40 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 h-80 w-80 rounded-full bg-sky-200/40 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-12">
          {/* Columna izquierda: narrativa */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.45 }}
            className="lg:col-span-6"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-orange-700">
              <Smartphone className="h-3.5 w-3.5" /> Portal del Motociclista
            </span>

            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-5xl sm:leading-[1.08]">
              Tu cliente sigue su moto en vivo. Sin instalar apps.
            </h2>

            <p className="mt-5 text-base leading-relaxed text-slate-600 sm:text-lg">
              Al recibir la moto, generamos un enlace privado único y un acceso por placa. Desde
              cualquier celular el dueño ve en qué etapa está su reparación, revisa las fotos del
              mecánico y aprueba o rechaza repuestos con total transparencia.
            </p>

            <div className="mt-7 space-y-3.5">
              {[
                'Sin descargas, sin contraseñas ni registros molestos para el cliente.',
                'Cada ítem rechazado se descuenta al instante del Total Activo.',
                'Compatible con link directo por WhatsApp y buscador público por placa.',
              ].map((point) => (
                <div key={point} className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
                  <span className="text-sm font-medium text-slate-700">{point}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <Link
                href="/track"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-slate-950 px-6 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-slate-950/15 transition-all hover:bg-orange-600"
              >
                <Search className="h-4 w-4" />
                Probar Buscador (/track)
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/t/taller-demo"
                className="inline-flex h-12 items-center justify-center rounded-full border border-slate-300 bg-white px-5 text-xs font-bold uppercase tracking-wider text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50"
              >
                Ver Micrositio Demo
              </Link>
            </div>
          </motion.div>

          {/* Columna derecha: Simulador Interactivo en Marco Móvil */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="lg:col-span-6"
          >
            <div className="mx-auto w-full max-w-[420px] rounded-[2rem] border-[6px] border-slate-900 bg-white p-4 shadow-[0_28px_70px_rgba(15,23,42,0.16)] sm:p-5">
              {/* Notch superior simulado */}
              <div className="mx-auto mb-4 h-1.5 w-20 rounded-full bg-slate-200" />

              {/* Encabezado del tracker */}
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3.5">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-orange-600">
                    Simulador Interactivo · Live Tracker
                  </p>
                  <p className="mt-0.5 truncate text-base font-extrabold text-slate-900">
                    Yamaha MT-03 · RKT-74F
                  </p>
                  <p className="text-xs text-slate-500">Orden #042 · Taller Demo MotoTrack</p>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  title="Reiniciar simulador"
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition-colors hover:bg-slate-100"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reiniciar
                </button>
              </div>

              {/* Badge de estado dinámico */}
              <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <PackageCheck className="h-4 w-4 text-orange-600" />
                  <span>Presupuesto Detallado</span>
                </div>
                <motion.span
                  key={badgeInfo.label}
                  initial={{ scale: 0.96, opacity: 0.7 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${badgeInfo.classes}`}
                >
                  {badgeInfo.label}
                </motion.span>
              </div>

              {/* Lista interactiva de ítems */}
              <div className="mt-3.5 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-slate-50/50">
                <AnimatePresence initial={false}>
                  {items.map((item) => {
                    const isRejected = item.status === 'rejected'
                    const isApproved = item.status === 'approved'
                    return (
                      <motion.div
                        key={item.id}
                        layout
                        className={`p-3 transition-colors ${
                          isRejected ? 'bg-slate-100/80 opacity-65' : 'bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p
                              className={`text-xs font-bold text-slate-900 ${
                                isRejected ? 'line-through text-slate-500' : ''
                              }`}
                            >
                              {item.description}
                            </p>
                            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                              {item.type === 'labor' ? 'Mano de Obra' : 'Repuesto'} ·{' '}
                              {item.quantity} x ${item.unitPrice.toLocaleString('es-CO')}
                            </p>
                          </div>
                          <span className="shrink-0 text-xs font-extrabold text-slate-900">
                            ${item.unitPrice.toLocaleString('es-CO')}
                          </span>
                        </div>

                        <div className="mt-2.5 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleDecision(item.id, 'approved')}
                            className={`inline-flex flex-1 items-center justify-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition-all ${
                              isApproved
                                ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-400 hover:text-emerald-700'
                            }`}
                          >
                            <Check className="h-3.5 w-3.5" />
                            {isApproved ? 'Aprobado' : 'Aprobar'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDecision(item.id, 'rejected')}
                            className={`inline-flex flex-1 items-center justify-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition-all ${
                              isRejected
                                ? 'border-rose-600 bg-rose-600 text-white shadow-sm'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-rose-400 hover:text-rose-700'
                            }`}
                          >
                            <X className="h-3.5 w-3.5" />
                            {isRejected ? 'Rechazado' : 'Rechazar'}
                          </button>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>

              {/* Total Activo recalculado en vivo */}
              <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-950 px-4 py-3 text-white">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Total Activo
                  </p>
                  <p className="text-[11px] text-slate-300">
                    {rejectedCount > 0
                      ? `${rejectedCount} ítem(s) descontado(s)`
                      : 'Incluye ítems vigentes'}
                  </p>
                </div>
                <motion.p
                  key={activeTotal}
                  initial={{ scale: 0.94 }}
                  animate={{ scale: 1 }}
                  className="text-lg font-black text-orange-400"
                >
                  ${activeTotal.toLocaleString('es-CO')} COP
                </motion.p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
