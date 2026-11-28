'use client'

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, MessageCircle, Search, X } from 'lucide-react'
import { WorkshopLogo } from './WorkshopLogo'
import { cleanWhatsAppPhone } from '@/lib/workshop-theme'

interface WorkshopNavbarProps {
  workshopName: string
  logoUrl?: string | null
  phoneWhatsapp?: string | null
}

const NAV_ANCHORS = [
  { label: 'Consultar Moto', href: '#consultar-moto' },
  { label: 'Servicios', href: '#servicios' },
  { label: 'Cómo Trabajamos', href: '#como-trabajamos' },
  { label: 'Agendar', href: '#agendar' },
]

export function WorkshopNavbar({
  workshopName,
  logoUrl,
  phoneWhatsapp,
}: WorkshopNavbarProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const cleanPhone = cleanWhatsAppPhone(phoneWhatsapp)
  const whatsappUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
        `Hola ${workshopName}, quiero agendar una cita o solicitar información para mi moto.`
      )}`
    : '#agendar'

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#08090C]/80 backdrop-blur-xl supports-[backdrop-filter]:bg-[#08090C]/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        {/* Identidad del Taller */}
        <a href="#top" className="flex min-w-0 items-center gap-3 group">
          <WorkshopLogo name={workshopName} logoUrl={logoUrl} size="md" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-base sm:text-lg font-bold tracking-tight text-white">
                {workshopName}
              </span>
              <span
                className="hidden sm:inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shrink-0"
                style={{
                  borderColor: 'rgba(var(--brand-glow-rgb), 0.35)',
                  backgroundColor: 'rgba(var(--brand-glow-rgb), 0.12)',
                  color: 'var(--brand-text)',
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full animate-pulse"
                  style={{ backgroundColor: 'var(--brand-text)' }}
                />
                En Vivo
              </span>
            </div>
            <p className="hidden sm:block text-[11px] text-slate-400 truncate">
              Taller especializado · Seguimiento digital
            </p>
          </div>
        </a>

        {/* Anclas suaves desktop */}
        <nav
          aria-label="Navegación del taller"
          className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-300"
        >
          {NAV_ANCHORS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="transition-colors duration-150 hover:text-white whitespace-nowrap"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Acciones desktop */}
        <div className="hidden md:flex items-center gap-2.5 shrink-0">
          <a
            href="#consultar-moto"
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-3.5 text-xs font-semibold text-slate-200 transition-all hover:border-white/30 hover:bg-white/[0.08] hover:text-white"
          >
            <Search className="h-3.5 w-3.5" style={{ color: 'var(--brand-text)' }} />
            Mi Moto
          </a>

          {cleanPhone ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-xs font-bold transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
              style={{
                backgroundColor: 'var(--brand-hex)',
                color: 'var(--brand-fg)',
                boxShadow: '0 0 22px rgba(var(--brand-glow-rgb), 0.32)',
              }}
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Agendar por WhatsApp
            </a>
          ) : (
            <a
              href="#agendar"
              className="inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-xs font-bold transition-transform duration-150 hover:scale-[1.02] whitespace-nowrap"
              style={{
                backgroundColor: 'var(--brand-hex)',
                color: 'var(--brand-fg)',
                boxShadow: '0 0 22px rgba(var(--brand-glow-rgb), 0.32)',
              }}
            >
              Cotizar Servicio
            </a>
          )}
        </div>

        {/* Acciones compactas móvil */}
        <div className="flex md:hidden items-center gap-2 shrink-0">
          <a
            href="#consultar-moto"
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.05] px-3 text-[11px] font-semibold text-slate-100"
          >
            <Search className="h-3.5 w-3.5" style={{ color: 'var(--brand-text)' }} />
            Mi Moto
          </a>
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={mobileOpen}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] text-slate-200 transition-colors hover:bg-white/[0.08]"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Menú móvil desplegable */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden border-t border-white/[0.08] bg-[#0B0D12]/95 backdrop-blur-xl md:hidden"
          >
            <div className="mx-auto max-w-7xl space-y-3 px-4 py-4">
              <div className="grid gap-1">
                {NAV_ANCHORS.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-xl px-3 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:bg-white/[0.06] hover:text-white"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
              <div className="border-t border-white/10 pt-3">
                {cleanPhone ? (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMobileOpen(false)}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full text-xs font-bold uppercase tracking-wider"
                    style={{
                      backgroundColor: 'var(--brand-hex)',
                      color: 'var(--brand-fg)',
                    }}
                  >
                    <MessageCircle className="h-4 w-4" />
                    Agendar por WhatsApp
                  </a>
                ) : (
                  <a
                    href="#agendar"
                    onClick={() => setMobileOpen(false)}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full text-xs font-bold uppercase tracking-wider"
                    style={{
                      backgroundColor: 'var(--brand-hex)',
                      color: 'var(--brand-fg)',
                    }}
                  >
                    Cotizar Servicio
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
