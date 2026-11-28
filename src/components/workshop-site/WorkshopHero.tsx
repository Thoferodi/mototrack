'use client'

import * as React from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  FileCheck2,
  MapPin,
  QrCode,
  Search,
  ShieldCheck,
  Smartphone,
} from 'lucide-react'

interface WorkshopHeroProps {
  workshopName: string
  address?: string | null
  orderCount: number
}

function BrandInteractiveButton({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  const ref = React.useRef<HTMLAnchorElement>(null)
  const rawX = useMotionValue(90)
  const springX = useSpring(rawX, { stiffness: 320, damping: 28, mass: 0.4 })
  const [hovered, setHovered] = React.useState(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    rawX.set(e.clientX - rect.left)
  }

  return (
    <a
      ref={ref}
      href={href}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative inline-flex h-12 w-full sm:w-auto items-center justify-center overflow-hidden rounded-full px-6 sm:px-7 text-xs sm:text-[13px] font-bold uppercase tracking-[0.04em] transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
      style={{
        backgroundColor: 'var(--brand-hex)',
        color: 'var(--brand-fg)',
        boxShadow: '0 0 32px rgba(var(--brand-glow-rgb), 0.36)',
      }}
    >
      <motion.span
        aria-hidden="true"
        style={{ x: springX }}
        className={`pointer-events-none absolute left-0 top-1/2 h-28 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full transition-opacity duration-300 ${
          hovered ? 'opacity-100' : 'opacity-65'
        }`}
      >
        <span
          className="block h-full w-full rounded-full blur-md"
          style={{
            background:
              'radial-gradient(50% 50% at 50% 50%, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.12) 48%, rgba(255,255,255,0) 100%)',
          }}
        />
      </motion.span>
      <span className="relative z-10 inline-flex items-center gap-2 whitespace-nowrap">
        {children}
      </span>
    </a>
  )
}

export function WorkshopHero({
  workshopName,
  address,
  orderCount,
}: WorkshopHeroProps) {
  const trustIndicators = [
    {
      icon: Camera,
      title: 'Recepción fotográfica y firma electrónica',
      detail: 'Documentamos el estado real de tu moto al ingresar.',
    },
    {
      icon: Smartphone,
      title: 'Presupuesto y aprobación en línea',
      detail: 'Apruebas o rechazas trabajos desde tu celular sin sorpresas.',
    },
    {
      icon: QrCode,
      title: 'Comprobante con código QR',
      detail: 'Respaldo ordenado e historial técnico por placa.',
    },
  ]

  return (
    <section
      id="top"
      className="relative overflow-x-clip bg-[#08090C] pb-16 pt-12 sm:pt-16 lg:pb-24 lg:pt-20"
    >
      {/* Haz volumétrico radial CSS a 60fps teñido con --brand-glow-rgb */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute left-1/2 top-[-140px] h-[520px] w-[940px] -translate-x-1/2 rounded-full opacity-45 blur-[110px]"
          style={{
            background:
              'radial-gradient(ellipse at 48% 45%, rgba(var(--brand-glow-rgb), 0.34) 0%, rgba(56, 189, 248, 0.14) 52%, rgba(8, 9, 12, 0) 76%)',
          }}
        />
        <div
          className="absolute left-[22%] top-0 h-[540px] w-[360px] -translate-x-1/2 opacity-40 blur-[56px] hidden lg:block"
          style={{
            background:
              'linear-gradient(180deg, rgba(var(--brand-glow-rgb), 0.24) 0%, rgba(56, 189, 248, 0.1) 55%, rgba(8, 9, 12, 0) 100%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.038]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Columna izquierda: Copy de alto impacto */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="min-w-0 w-full lg:col-span-7 space-y-6"
          >
            <div
              className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold backdrop-blur-md"
              style={{
                borderColor: 'rgba(var(--brand-glow-rgb), 0.35)',
                backgroundColor: 'rgba(var(--brand-glow-rgb), 0.11)',
                color: 'var(--brand-text)',
              }}
            >
              <span
                className="h-2 w-2 rounded-full animate-pulse"
                style={{ backgroundColor: 'var(--brand-text)' }}
              />
              <span>Taller con Seguimiento Digital en Vivo</span>
            </div>

            <h1 className="bg-gradient-to-br from-white via-slate-100 to-slate-300 bg-clip-text text-4xl font-semibold leading-[1.04] tracking-[-0.03em] text-transparent sm:text-5xl lg:text-[60px]">
              Tu moto en manos expertas.{' '}
              <span
                className="inline-block"
                style={{ color: 'var(--brand-text)' }}
              >
                Transparencia total
              </span>{' '}
              en cada kilómetro.
            </h1>

            <p className="max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
              En <strong className="font-semibold text-white">{workshopName}</strong> digitalizamos
              cada ingreso con evidencia fotográfica, diagnóstico claro y aprobación de presupuesto
              en línea desde tu celular. Sin llamadas ni sorpresas al recoger tu moto.
            </p>

            {/* Botones principales */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3.5 pt-1">
              <BrandInteractiveButton href="#agendar">
                Cotizar o Agendar Cita <ArrowRight className="h-4 w-4" />
              </BrandInteractiveButton>

              <a
                href="#consultar-moto"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/15 bg-[#0C0E14] px-6 text-xs sm:text-[13px] font-semibold uppercase tracking-[0.04em] text-slate-100 transition-all duration-200 hover:border-white/30 hover:bg-[#141722]"
              >
                <Search className="h-4 w-4" style={{ color: 'var(--brand-text)' }} />
                Consultar estado de mi moto
              </a>
            </div>

            {/* Micro-datos de confianza */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1 text-xs font-medium text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" style={{ color: 'var(--brand-text)' }} />
                Sin descargar apps
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" style={{ color: 'var(--brand-text)' }} />
                Evidencia real antes de reparar
              </span>
              {address && (
                <span className="inline-flex items-center gap-1.5 text-slate-300">
                  <MapPin className="h-3.5 w-3.5" style={{ color: 'var(--brand-text)' }} />
                  {address}
                </span>
              )}
            </div>
          </motion.div>

          {/* Columna derecha: Tarjeta Vista en Vivo del Taller */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1, ease: 'easeOut' }}
            className="min-w-0 w-full lg:col-span-5"
          >
            <div className="relative">
              {/* Flare sutil superior */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-8 -top-px h-px"
                style={{
                  background:
                    'linear-gradient(90deg, transparent 0%, rgba(var(--brand-glow-rgb), 0.85) 50%, transparent 100%)',
                }}
              />
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#101218]/90 p-5 sm:p-6 shadow-[0_24px_80px_rgba(0,0,0,0.75)] backdrop-blur-xl">
                <div className="flex items-center justify-between gap-2 border-b border-white/[0.08] pb-4">
                  <div className="min-w-0">
                    <p
                      className="text-[11px] font-bold uppercase tracking-wider"
                      style={{ color: 'var(--brand-text)' }}
                    >
                      Vista en Vivo del Taller
                    </p>
                    <h2 className="mt-0.5 truncate text-base font-bold text-white">
                      Protocolo de Atención {workshopName}
                    </h2>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Operativo
                  </span>
                </div>

                {/* Indicadores reales de confianza */}
                <div className="mt-4 space-y-3">
                  {trustIndicators.map((item) => {
                    const Icon = item.icon
                    return (
                      <div
                        key={item.title}
                        className="flex items-start gap-3 rounded-xl border border-white/[0.07] bg-[#0B0D13] p-3.5"
                      >
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border"
                          style={{
                            borderColor: 'rgba(var(--brand-glow-rgb), 0.3)',
                            backgroundColor: 'rgba(var(--brand-glow-rgb), 0.12)',
                            color: 'var(--brand-text)',
                          }}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-semibold text-white">
                            {item.title}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-400 leading-relaxed">
                            {item.detail}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Indicador discreto de actividad sin exponer datos privados */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-xs">
                  <span className="inline-flex items-center gap-2 text-slate-300">
                    <FileCheck2 className="h-4 w-4" style={{ color: 'var(--brand-text)' }} />
                    {orderCount >= 5
                      ? `${orderCount}+ órdenes gestionadas con trazabilidad`
                      : 'Trazabilidad digital activa por orden'}
                  </span>
                  <a
                    href="#consultar-moto"
                    className="font-semibold hover:underline shrink-0"
                    style={{ color: 'var(--brand-text)' }}
                  >
                    Rastrear →
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
