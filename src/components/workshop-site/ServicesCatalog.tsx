'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Cog,
  Disc,
  Gauge,
  SlidersHorizontal,
  Sparkles,
  Wrench,
  Zap,
} from 'lucide-react'
import { formatCOP } from '@/lib/format'
import type { PublicServiceItem, ServiceCategoryKey } from './types'

interface ServicesCatalogProps {
  workshopName: string
  services: PublicServiceItem[]
  hasRealCatalog: boolean
  onSelectService: (serviceName: string) => void
}

const CATEGORY_ICON_MAP: Record<
  ServiceCategoryKey,
  React.ComponentType<{ className?: string }>
> = {
  preventive: Wrench,
  injection: Gauge,
  brakes: Disc,
  suspension: SlidersHorizontal,
  drivetrain: Cog,
  electrical: Zap,
  general: Wrench,
}

function ServiceSpotlightCard({
  service,
  index,
  onSelect,
}: {
  service: PublicServiceItem
  index: number
  onSelect: (name: string) => void
}) {
  const cardRef = React.useRef<HTMLDivElement>(null)
  const Icon = CATEGORY_ICON_MAP[service.categoryKey] || Wrench

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${e.clientX - rect.left}px`)
    el.style.setProperty('--my', `${e.clientY - rect.top}px`)
  }

  const showRealPrice = !service.isFallback && service.default_price !== null && service.default_price > 0

  return (
    <motion.article
      ref={cardRef}
      onMouseMove={handleMouseMove}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.24) }}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-[#101218] p-5 sm:p-6 transition-colors duration-300 hover:border-white/25"
    >
      {/* Efecto Spotlight al hover */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(320px circle at var(--mx, 50%) var(--my, 50%), rgba(var(--brand-glow-rgb), 0.14), rgba(56, 189, 248, 0.04) 48%, transparent 72%)',
        }}
      />

      <div className="relative z-10 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border"
            style={{
              borderColor: 'rgba(var(--brand-glow-rgb), 0.32)',
              backgroundColor: 'rgba(var(--brand-glow-rgb), 0.12)',
              color: 'var(--brand-text)',
            }}
          >
            <Icon className="h-5 w-5" />
          </div>

          {service.sku ? (
            <span className="rounded-md border border-white/10 bg-[#08090C] px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-400">
              {service.sku}
            </span>
          ) : (
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[10px] font-semibold text-slate-300">
              Servicio Técnico
            </span>
          )}
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
            {service.name}
          </h3>
          <p className="text-xs sm:text-sm leading-relaxed text-slate-400">
            {service.description}
          </p>
        </div>
      </div>

      <div className="relative z-10 mt-6 space-y-4 border-t border-white/[0.08] pt-4">
        <div className="flex items-baseline justify-between gap-2">
          {showRealPrice ? (
            <>
              <span className="text-[11px] font-medium text-slate-400">
                Mano de obra ref.
              </span>
              <span className="font-mono text-base font-extrabold tabular-nums text-white">
                {formatCOP(service.default_price!)} <span className="text-[11px] font-semibold text-slate-400">COP</span>
              </span>
            </>
          ) : (
            <span className="text-xs font-medium text-slate-300">
              Diagnóstico y cotización previa
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => onSelect(service.name)}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-[#08090C] px-4 text-xs font-bold text-slate-100 transition-all duration-150 hover:border-white/30 hover:bg-white/[0.06]"
        >
          <span>Cotizar este servicio</span>
          <ArrowRight
            className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5"
            style={{ color: 'var(--brand-text)' }}
          />
        </button>
      </div>
    </motion.article>
  )
}

export function ServicesCatalog({
  workshopName,
  services,
  hasRealCatalog,
  onSelectService,
}: ServicesCatalogProps) {
  return (
    <section id="servicios" className="relative overflow-x-clip bg-[#08090C] py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl space-y-3">
            <span
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-widest"
              style={{
                borderColor: 'rgba(var(--brand-glow-rgb), 0.35)',
                backgroundColor: 'rgba(var(--brand-glow-rgb), 0.1)',
                color: 'var(--brand-text)',
              }}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Portafolio de Servicios
            </span>
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Especialidades mecánicas de {workshopName}
            </h2>
            <p className="text-sm sm:text-base text-slate-400">
              {hasRealCatalog
                ? 'Selecciona el servicio que necesitas para prellenar tu solicitud de cita y cotización directa por WhatsApp.'
                : 'Servicios estándar de mantenimiento y diagnóstico especializado. El valor definitivo se confirma tras revisión técnica.'}
            </p>
          </div>

          <a
            href="#agendar"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider hover:underline shrink-0"
            style={{ color: 'var(--brand-text)' }}
          >
            ¿Buscas otro trabajo? Escríbenos <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => (
            <ServiceSpotlightCard
              key={service.id}
              service={service}
              index={index}
              onSelect={onSelectService}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
