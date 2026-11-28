'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeft, Cookie, FileText, ShieldCheck } from 'lucide-react'
import { MotoTrackBrand } from '@/components/brand/MotoTrackBrand'
import { LEGAL_CONFIG } from '@/lib/legal-config'

const LEGAL_NAV_ITEMS = [
  {
    href: '/legal/terminos',
    label: 'Términos y Condiciones',
    shortLabel: 'Términos',
    icon: FileText,
  },
  {
    href: '/legal/privacidad',
    label: 'Política de Privacidad',
    shortLabel: 'Privacidad',
    icon: ShieldCheck,
  },
  {
    href: '/legal/cookies',
    label: 'Política de Cookies',
    shortLabel: 'Cookies',
    icon: Cookie,
  },
] as const

export function LegalHeader() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#08090C]/85 backdrop-blur-xl supports-[backdrop-filter]:bg-[#08090C]/70">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="flex items-center group shrink-0">
            <MotoTrackBrand variant="horizontal" theme="dark" size="md" badge="Legal" />
          </Link>
        </div>

        <Link
          href="/"
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-3.5 text-xs font-semibold text-slate-200 transition-all hover:border-orange-500/40 hover:bg-white/[0.08] hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-orange-400" />
          Volver al inicio
        </Link>
      </div>

      {/* Navegación cruzada entre documentos legales */}
      <div className="border-t border-white/[0.06] bg-[#0B0D12]/70">
        <nav
          aria-label="Documentos legales"
          className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2.5 sm:px-6 lg:px-8"
        >
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {LEGAL_NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                    isActive
                      ? 'border-orange-500/45 bg-orange-500/15 text-orange-200 shadow-[0_0_20px_rgba(249,115,22,0.12)]'
                      : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  <Icon
                    className={`h-3.5 w-3.5 shrink-0 ${
                      isActive ? 'text-orange-400' : 'text-slate-400'
                    }`}
                  />
                  <span className="hidden sm:inline">{item.label}</span>
                  <span className="sm:hidden">{item.shortLabel}</span>
                </Link>
              )
            })}
          </div>

          <p className="text-[11px] font-medium text-slate-400">
            Última actualización:{' '}
            <span className="font-semibold text-slate-200">{LEGAL_CONFIG.lastUpdated}</span>
          </p>
        </nav>
      </div>
    </header>
  )
}
