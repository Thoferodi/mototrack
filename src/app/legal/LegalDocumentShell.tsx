import type { ReactNode } from 'react'
import { CalendarClock, Scale } from 'lucide-react'
import { LEGAL_CONFIG } from '@/lib/legal-config'

export interface LegalSectionItem {
  id: string
  number: string
  title: string
}

interface LegalDocumentShellProps {
  badge: string
  title: string
  subtitle: string
  sections: LegalSectionItem[]
  children: ReactNode
}

export function LegalDocumentShell({
  badge,
  title,
  subtitle,
  sections,
  children,
}: LegalDocumentShellProps) {
  return (
    <div className="space-y-8">
      {/* Cabecera del documento */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#101218] p-6 sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-12 -top-px h-px bg-gradient-to-r from-transparent via-orange-400/80 to-transparent"
        />
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-orange-300">
              <Scale className="h-3.5 w-3.5 text-orange-400" />
              {badge}
            </span>
            <h1 className="bg-gradient-to-br from-white via-slate-100 to-orange-200 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
              {title}
            </h1>
            <p className="text-sm leading-relaxed text-slate-300 sm:text-base">{subtitle}</p>
          </div>

          <div className="shrink-0 rounded-xl border border-white/10 bg-[#0B0D13] px-4 py-3 text-xs text-slate-300">
            <p className="flex items-center gap-1.5 font-semibold text-white">
              <CalendarClock className="h-3.5 w-3.5 text-orange-400" />
              Vigencia y actualización
            </p>
            <p className="mt-1 text-slate-400">
              Actualizado el <span className="text-slate-200">{LEGAL_CONFIG.lastUpdated}</span>
            </p>
            <p className="text-slate-500">{LEGAL_CONFIG.jurisdictionCity}</p>
          </div>
        </div>
      </div>

      {/* Índice compacto en móvil / tablet */}
      <nav
        aria-label="Índice del documento"
        className="rounded-2xl border border-white/10 bg-[#101218] p-4 lg:hidden"
      >
        <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Contenido del documento
        </p>
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-[#0B0D13] px-3 py-2 text-xs text-slate-300 transition-colors hover:border-orange-500/35 hover:text-white"
            >
              <span className="font-mono text-[11px] font-bold text-orange-400">
                {section.number}
              </span>
              <span className="truncate">{section.title}</span>
            </a>
          ))}
        </div>
      </nav>

      {/* Layout de lectura: Índice lateral en escritorio + Cuerpo */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <aside className="hidden lg:col-span-4 lg:block xl:col-span-3">
          <div className="sticky top-32 rounded-2xl border border-white/10 bg-[#101218] p-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Índice de Cláusulas
            </p>
            <nav aria-label="Índice lateral" className="mt-4 space-y-1">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="group flex items-start gap-2.5 rounded-lg px-2.5 py-2 text-xs text-slate-300 transition-colors hover:bg-white/[0.04] hover:text-white"
                >
                  <span className="mt-0.5 font-mono text-[11px] font-bold text-orange-400/90 group-hover:text-orange-300">
                    {section.number}
                  </span>
                  <span className="leading-snug">{section.title}</span>
                </a>
              ))}
            </nav>
          </div>
        </aside>

        <div className="lg:col-span-8 xl:col-span-9 space-y-5">{children}</div>
      </div>
    </div>
  )
}
