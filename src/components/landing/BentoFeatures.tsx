'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import {
  Camera,
  Check,
  Database,
  Globe,
  Kanban,
  MessageCircle,
  PenTool,
  Search,
  Wrench,
} from 'lucide-react'

function SpotlightCard({
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
      className={`group relative overflow-hidden rounded-2xl border border-white/[0.1] bg-[#0C0E14] p-5 sm:p-6 transition-colors duration-300 hover:border-orange-400/35 ${className}`}
    >
      {/* Spotlight hover siguiendo el cursor */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(360px circle at var(--mx, 50%) var(--my, 50%), rgba(249,115,22,0.14), rgba(56,189,248,0.06) 45%, transparent 72%)',
        }}
      />
      <div className="relative z-10 flex h-full flex-col justify-between gap-5">{children}</div>
    </motion.article>
  )
}

export function BentoFeatures() {
  return (
    <section id="funcionalidades" className="relative overflow-x-clip bg-[#08090C] py-20 lg:py-28">
      {/* Glow ambiental sutil */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-24 h-[420px] w-[720px] -translate-x-1/2 rounded-full opacity-25 blur-[120px]"
        style={{
          background:
            'radial-gradient(circle, rgba(249,115,22,0.35) 0%, rgba(56,189,248,0.18) 55%, transparent 80%)',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.45 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-orange-300">
            Funcionalidades Reales
          </span>
          <h2 className="mt-4 bg-gradient-to-br from-white via-slate-100 to-orange-200/90 bg-clip-text text-3xl font-semibold tracking-tight text-transparent sm:text-5xl">
            Todo lo que pasa en tu taller, en una sola plataforma.
          </h2>
          <p className="mt-4 text-base text-slate-400 sm:text-lg">
            Cada módulo está construido para el flujo real de un taller de motocicletas: desde la
            recepción en puerta hasta la entrega final.
          </p>
        </motion.div>

        {/* Bento Grid Asimétrico de 6 tarjetas */}
        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-6 lg:grid-cols-12">
          {/* 1. Recepción con fotos WebP y firma digital */}
          <SpotlightCard className="md:col-span-6 lg:col-span-7" delay={0.02}>
            <div className="rounded-xl border border-white/10 bg-[#07090D] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.07] pb-3">
                <div className="flex items-center gap-2">
                  <Camera className="h-4 w-4 text-orange-400" />
                  <span className="text-xs font-semibold text-slate-200">
                    Checklist de Ingreso · 4 Ángulos
                  </span>
                </div>
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                  WebP ~218 KB
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {['Frontal', 'Izquierdo', 'Derecho', 'Tablero'].map((angle) => (
                  <div
                    key={angle}
                    className="flex flex-col items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] px-2 py-3"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500/15 text-orange-400">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    <span className="mt-1.5 text-[11px] font-medium text-slate-300">{angle}</span>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between rounded-lg border border-white/10 bg-[#0D1018] px-3 py-2">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <PenTool className="h-3.5 w-3.5 text-sky-400" />
                  <span>Firma de conformidad capturada</span>
                </div>
                <svg
                  viewBox="0 0 120 26"
                  className="h-5 w-24 text-orange-300"
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
                Recepción con fotos WebP y firma digital
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                Documenta estado físico, kilometraje y nivel de combustible en segundos. Comprime
                las fotos automáticamente a WebP (~250 KB) y guarda la firma en pantalla.
              </p>
            </div>
          </SpotlightCard>

          {/* 2. Tablero Kanban en tiempo real */}
          <SpotlightCard className="md:col-span-6 lg:col-span-5" delay={0.06}>
            <div className="rounded-xl border border-white/10 bg-[#07090D] p-4">
              <div className="flex items-center justify-between pb-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                  <Kanban className="h-4 w-4 text-sky-400" />
                  Flujo de Estados
                </span>
                <span className="text-[10px] font-mono text-slate-400">7 etapas</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { title: 'Diagnóstico', plate: 'BGT-41F', color: 'border-amber-500/40 text-amber-300' },
                  { title: 'Reparación', plate: 'MTZ-84D', color: 'border-orange-500/40 text-orange-300' },
                  { title: 'Lista', plate: 'KLM-19E', color: 'border-emerald-500/40 text-emerald-300' },
                ].map((col) => (
                  <div
                    key={col.title}
                    className="rounded-lg border border-white/[0.07] bg-white/[0.02] p-2"
                  >
                    <p className="truncate text-[10px] font-semibold text-slate-400">{col.title}</p>
                    <div className={`mt-2 rounded border bg-black/40 px-2 py-2 ${col.color}`}>
                      <p className="font-mono text-[10px] font-bold">{col.plate}</p>
                      <p className="mt-0.5 text-[9px] text-slate-400">Activa</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">Tablero Kanban en tiempo real</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                Visualiza al instante qué motos están en diagnóstico, esperando aprobación, en
                reparación o listas para entregar, con búsqueda por placa, cliente o número.
              </p>
            </div>
          </SpotlightCard>

          {/* 3. Modo Mecánico optimizado para celular */}
          <SpotlightCard className="md:col-span-3 lg:col-span-4" delay={0.1}>
            <div className="rounded-xl border border-white/10 bg-[#07090D] p-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black italic tracking-tight text-white">
                  MANOS SUCIAS
                </span>
                <Wrench className="h-4 w-4 text-orange-400" />
              </div>
              <div className="mt-3 space-y-2">
                <div className="flex h-14 items-center justify-center rounded-xl bg-orange-500 px-3 text-xs font-black uppercase tracking-wide text-slate-950">
                  + Subir Foto Evidencia
                </div>
                <div className="flex h-12 items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] px-3 text-xs font-semibold text-slate-200">
                  Avanzar Estado (56px touch)
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">
                Modo Mecánico táctil para celular
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                Interfaz exclusiva para técnicos con botones altos de 56px ideales para guantes o
                grasa y carga directa de evidencias desde la cámara.
              </p>
            </div>
          </SpotlightCard>

          {/* 4. Presupuestos interactivos con WhatsApp */}
          <SpotlightCard className="md:col-span-3 lg:col-span-4" delay={0.14}>
            <div className="rounded-xl border border-white/10 bg-[#07090D] p-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">Presupuesto #042</span>
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                  2 aprobados
                </span>
              </div>
              <div className="mt-3 space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between rounded-md bg-white/[0.04] px-2.5 py-1.5 text-slate-200">
                  <span>Pastillas freno Brembo</span>
                  <span className="font-bold text-emerald-400">✓ $120.000</span>
                </div>
                <div className="flex items-center justify-between rounded-md bg-white/[0.02] px-2.5 py-1.5 text-slate-500 line-through">
                  <span>Lavado motor vapor</span>
                  <span>✕ Rechazado</span>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 py-2 text-[11px] font-semibold text-emerald-300">
                <MessageCircle className="h-3.5 w-3.5" />
                Enviar enlace por WhatsApp
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">
                Presupuestos interactivos por WhatsApp
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                Comparte el enlace único en un clic. El total activo excluye automáticamente los
                ítems rechazados y bloquea cambios al confirmar.
              </p>
            </div>
          </SpotlightCard>

          {/* 5. Historial clínico por placa y catálogo */}
          <SpotlightCard className="md:col-span-6 lg:col-span-4" delay={0.18}>
            <div className="rounded-xl border border-white/10 bg-[#07090D] p-4">
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-xs text-slate-300">
                <Search className="h-3.5 w-3.5 text-orange-400" />
                <span className="font-mono font-bold text-white">MTZ-84D</span>
                <span className="ml-auto text-[10px] text-slate-400">24.800 km</span>
              </div>
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center justify-between rounded-md border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 text-[11px]">
                  <span className="inline-flex items-center gap-1.5 text-slate-300">
                    <Database className="h-3 w-3 text-sky-400" /> Aceite Motul 7100
                  </span>
                  <span className="font-mono text-orange-300">$68.000</span>
                </div>
                <div className="flex items-center justify-between rounded-md border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 text-[11px]">
                  <span className="inline-flex items-center gap-1.5 text-slate-300">
                    <Database className="h-3 w-3 text-sky-400" /> Mano de obra sincronización
                  </span>
                  <span className="font-mono text-orange-300">$95.000</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">
                Historial clínico por placa y catálogo
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                Consulta todas las visitas previas de cada motocicleta y cotiza en segundos usando
                tu catálogo de repuestos y mano de obra con SKU.
              </p>
            </div>
          </SpotlightCard>

          {/* 6. Micrositio de marca blanca */}
          <SpotlightCard className="md:col-span-6 lg:col-span-12" delay={0.22}>
            <div className="grid items-center gap-6 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/30 bg-sky-400/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-300">
                  <Globe className="h-3 w-3" /> Marca Blanca Multi-Tenant
                </span>
                <h3 className="mt-3 text-xl font-bold text-white">
                  Tu propio micrositio público en <span className="font-mono text-orange-400">/t/tu-taller</span>
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  Genera automáticamente la página web de tu taller con tu logotipo, color
                  corporativo, servicios, botón de citas por WhatsApp y buscador de placa validado
                  con los últimos 4 dígitos del teléfono del dueño.
                </p>
              </div>

              <div className="lg:col-span-7">
                <div className="rounded-xl border border-white/10 bg-[#07090D] p-4">
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="h-5 w-5 rounded bg-orange-500" />
                      <span className="text-xs font-bold text-white">MotoSpeed Bogotá</span>
                    </div>
                    <span className="rounded-md bg-white/[0.06] px-2 py-0.5 font-mono text-[10px] text-slate-300">
                      mototrack.app/t/taller-demo
                    </span>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-white/[0.07] bg-white/[0.02] p-3">
                      <p className="text-[11px] font-semibold text-slate-200">
                        Buscador de Placa Público
                      </p>
                      <div className="mt-2 flex gap-1.5">
                        <div className="flex-1 rounded border border-white/10 bg-black/50 px-2 py-1.5 font-mono text-[10px] text-slate-300">
                          PLACA: RKT-74F
                        </div>
                        <div className="rounded border border-white/10 bg-black/50 px-2 py-1.5 font-mono text-[10px] text-slate-400">
                          Tel: 4821
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col justify-between rounded-lg border border-orange-500/25 bg-orange-500/[0.06] p-3">
                      <p className="text-[11px] font-semibold text-orange-200">
                        Branding 100% Configurable
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="h-4 w-4 rounded-full bg-orange-500 ring-2 ring-white/30" />
                        <span className="h-4 w-4 rounded-full bg-sky-500" />
                        <span className="h-4 w-4 rounded-full bg-emerald-500" />
                        <span className="ml-auto text-[10px] font-medium text-slate-300">
                          Logo + Color propio
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SpotlightCard>
        </div>
      </div>
    </section>
  )
}
