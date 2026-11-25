'use client'

import * as React from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, Search, Wrench, X, ArrowRight } from 'lucide-react'
import { GlowButton } from './GlowButton'

const NAV_LINKS = [
  { label: 'Funcionalidades', href: '#funcionalidades' },
  { label: 'Portal Cliente', href: '#portal-cliente' },
  { label: 'Precios', href: '#precios' },
  { label: 'FAQ', href: '#faq' },
]

export function Navbar() {
  const [mobileOpen, setMobileOpen] = React.useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#08090C]/75 backdrop-blur-xl supports-[backdrop-filter]:bg-[#08090C]/65">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-[0_0_20px_rgba(249,115,22,0.45)] transition-transform duration-200 group-hover:scale-105">
            <Wrench className="h-4 w-4" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold tracking-tight text-white">MotoTrack</span>
            <span className="hidden sm:inline-block rounded-full border border-orange-500/30 bg-orange-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-orange-400">
              SaaS
            </span>
          </div>
        </Link>

        {/* Anclas desktop */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-300">
          {NAV_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="transition-colors duration-150 hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Acciones desktop */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          <Link
            href="/track"
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-3.5 text-xs font-semibold text-slate-200 transition-all hover:border-sky-400/40 hover:bg-white/[0.08] hover:text-white"
          >
            <Search className="h-3.5 w-3.5 text-orange-400" />
            Consultar Mi Moto
          </Link>

          <Link
            href="/login"
            className="inline-flex h-9 items-center px-3 text-xs font-semibold uppercase tracking-wider text-slate-300 transition-colors hover:text-white"
          >
            Iniciar Sesión
          </Link>

          <GlowButton href="/login" size="sm">
            Probar Gratis <ArrowRight className="h-3.5 w-3.5" />
          </GlowButton>
        </div>

        {/* Acciones compactas + Hamburguesa móvil */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            href="/track"
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.05] px-3 text-[11px] font-semibold text-slate-200"
          >
            <Search className="h-3.5 w-3.5 text-orange-400" />
            <span>Mi Moto</span>
          </Link>
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
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="overflow-hidden border-t border-white/[0.08] bg-[#0B0D12]/95 backdrop-blur-xl md:hidden"
          >
            <div className="mx-auto max-w-7xl space-y-4 px-4 py-5">
              <div className="grid gap-1">
                {NAV_LINKS.map((item) => (
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

              <div className="flex flex-col gap-2.5 border-t border-white/10 pt-4">
                <Link
                  href="/track"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.05] text-xs font-semibold uppercase tracking-wider text-slate-100"
                >
                  <Search className="h-4 w-4 text-orange-400" />
                  Consultar Mi Moto
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex h-11 items-center justify-center rounded-full border border-white/15 bg-transparent text-xs font-semibold uppercase tracking-wider text-slate-300"
                >
                  Iniciar Sesión
                </Link>
                <GlowButton
                  href="/login"
                  size="md"
                  className="w-full"
                >
                  Probar Gratis <ArrowRight className="h-4 w-4" />
                </GlowButton>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
