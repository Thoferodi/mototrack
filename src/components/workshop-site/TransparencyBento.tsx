'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import {
  Camera,
  Check,
  FileCheck2,
  PenTool,
  QrCode,
  ShieldCheck,
  Smartphone,
  X,
} from 'lucide-react'

function BentoCard({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  const cardRef = React.useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${e.clientX - rect.left}px`)
    el.style.setProperty('--my', `${e.clientY - rect.top}px`)
  }

  return (
    <motion.article
      ref={cardRef}
      onMouseMove={handleMouseMove}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.45, delay }}
      className={`group relative flex min-w-0 flex-col justify-between gap-5 overflow-hidden rounded-2xl border border-white/10 bg-[#101218] p-5 sm:p-6 transition-colors duration-300 hover:border-white/25 ${className}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(340px circle at var(--mx, 50%) var(--my, 50%), rgba(var(--brand-glow-rgb), 0.13), transparent 72%)',
        }}
      />
      <div className="relative z-10 flex h-full flex-col justify-between gap-5">{children}</div>
    </motion.article>
  )
}

export function TransparencyBento({ workshopName }: { workshopName: string }) {
  return (
    <section
      id="como-trabajamos"
      className="relative overflow-x-clip border-t border-white/[0.06] bg-[#08090C] py-20 lg:py-24"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-20 h-[360px] w-[680px] -translate-x-1/2 rounded-full opacity-20 blur-[120px]"
        style={{
          background:
            'radial-gradient(circle, rgba(var(--brand-glow-rgb), 0.35) 0%, rgba(56, 189, 248, 0.14) 55%, transparent 80%)',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center space-y-3">
          <span
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-widest"
            style={{
              borderColor: 'rgba(var(--brand-glow-rgb), 0.35)',
              backgroundColor: 'rgba(var(--brand-glow-rgb), 0.1)',
              color: 'var(--brand-text)',
            }}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Estándar de Transparencia
          </span>
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-5xl">
            Así cuidamos tu moto en {workshopName}
          </h2>
          <p className="text-sm sm:text-base text-slate-400">
            Cuatro pasos auditables desde que entregas las llaves hasta que sales rodando con tu
            comprobante en el celular.
          </p>
        </div>

        {/* Bento Grid de 4 tarjetas */}
        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-12">
          {/* 1. Recepción con Fotos y Firma Electrónica */}
          <BentoCard className="md:col-span-7" delay={0.02}>
            <div className="rounded-xl border border-white/10 bg-[#08090C] p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] pb-2.5">
                <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <Camera className="h-4 w-4" style={{ color: 'var(--brand-text)' }} />
                  Checklist de Recepción
                </span>
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                  4 Ángulos + Kilometraje
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['Frontal', 'Izquierdo', 'Derecho', 'Tablero'].map((angle) => (
                  <div
                    key={angle}
                    className="flex flex-col items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.02] px-2 py-2.5"
                  >
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-full"
                      style={{
                        backgroundColor: 'rgba(var(--brand-glow-rgb), 0.16)',
                        color: 'var(--brand-text)',
                      }}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    <span className="mt-1.5 text-[11px] font-medium text-slate-300">{angle}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-[#101218] px-3 py-2">
                <span className="inline-flex items-center gap-2 text-xs text-slate-300">
                  <PenTool className="h-3.5 w-3.5 text-sky-400" />
                  Firma electrónica de conformidad
                </span>
                <svg
                  viewBox="0 0 120 26"
                  className="h-5 w-20 shrink-0"
                  style={{ color: 'var(--brand-text)' }}
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M4 20 C 16 4, 24 22, 38 12 C 48 5, 55 21, 70 11 C 84 3, 94 18, 114 9"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">
                1. Recepción con Fotos y Firma Electrónica
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                Registramos el estado estético exacto, nivel de combustible y kilometraje al ingreso
                con firma electrónica para tu total tranquilidad.
              </p>
            </div>
          </BentoCard>

          {/* 2. Evidencia Real del Diagnóstico */}
          <BentoCard className="md:col-span-5" delay={0.06}>
            <div className="rounded-xl border border-white/10 bg-[#08090C] p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">Hallazgo del Técnico</span>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                  style={{
                    backgroundColor: 'rgba(var(--brand-glow-rgb), 0.16)',
                    color: 'var(--brand-text)',
                  }}
                >
                  Foto Verificada
                </span>
              </div>
              <div className="rounded-lg border border-white/[0.08] bg-[#101218] p-3 space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]">
                    <Camera className="h-4 w-4 text-slate-300" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-white">
                      Desgaste detectado antes de cambiar
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Enviado directo a tu enlace en vivo
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">2. Evidencia Real del Diagnóstico</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                Te mostramos fotos reales del repuesto o desgaste encontrado antes de intervenir tu
                motocicleta.
              </p>
            </div>
          </BentoCard>

          {/* 3. Presupuesto Interactivo 1-Clic */}
          <BentoCard className="md:col-span-5" delay={0.1}>
            <div className="rounded-xl border border-white/10 bg-[#08090C] p-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1.5 font-semibold text-slate-200">
                  <Smartphone className="h-3.5 w-3.5 text-sky-400" />
                  Decisión del Cliente
                </span>
                <span className="text-[10px] font-bold text-emerald-300">Sin sorpresas</span>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-emerald-500/25 bg-emerald-500/[0.07] px-3 py-2 text-xs">
                <span className="font-medium text-slate-100">Trabajo principal aprobado</span>
                <span className="inline-flex items-center gap-1 font-bold text-emerald-300">
                  <Check className="h-3.5 w-3.5" /> Aprobado
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs text-slate-400">
                <span className="line-through">Trabajo adicional opcional</span>
                <span className="inline-flex items-center gap-1 text-rose-300">
                  <X className="h-3.5 w-3.5" /> Rechazado
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">3. Presupuesto Interactivo 1-Clic</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                Apruebas o rechazas cada ítem desde tu celular. El total se actualiza al instante y
                solo ejecutamos lo autorizado.
              </p>
            </div>
          </BentoCard>

          {/* 4. Comprobante con QR e Historial por Placa */}
          <BentoCard className="md:col-span-7" delay={0.14}>
            <div className="rounded-xl border border-white/10 bg-[#08090C] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white p-2 text-slate-950">
                  <QrCode className="h-9 w-9" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-white">Comprobante de Orden + QR</p>
                  <p className="text-[11px] text-slate-400">
                    Detalle completo de trabajos aprobados, firmas y acceso rápido a la línea de
                    tiempo.
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 self-start sm:self-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold text-slate-200 shrink-0">
                <FileCheck2 className="h-3.5 w-3.5" style={{ color: 'var(--brand-text)' }} />
                Historial por placa
              </span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">
                4. Comprobante con QR e Historial por Placa
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                Cada visita queda respaldada en el historial técnico de tu moto y puedes consultar o
                imprimir tu comprobante con QR cuando lo necesites.
              </p>
            </div>
          </BentoCard>
        </div>
      </div>
    </section>
  )
}
