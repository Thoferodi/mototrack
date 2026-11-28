import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'

export function DemoBanner() {
  return (
    <div className="relative z-50 border-b border-white/10 bg-[#0B0D13]/95 px-4 py-2 text-xs text-slate-200 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 sm:px-2 lg:px-4">
        <p className="flex items-center gap-2 text-[11px] sm:text-xs text-slate-300">
          <span
            className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
            style={{
              backgroundColor: 'rgba(var(--brand-glow-rgb), 0.18)',
              color: 'var(--brand-text)',
            }}
          >
            <Sparkles className="h-3 w-3" />
          </span>
          <span>
            <strong className="font-semibold text-white">Vista Demo Interactiva</strong>
            <span className="hidden sm:inline"> · </span>
            <span className="block sm:inline text-slate-400">
              Así se ve la web oficial que incluye tu taller con MotoTrack
            </span>
          </span>
        </p>

        <Link
          href="/#precios"
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold transition-transform duration-150 hover:scale-[1.02] whitespace-nowrap"
          style={{
            backgroundColor: 'var(--brand-hex)',
            color: 'var(--brand-fg)',
          }}
        >
          Activar en mi taller <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  )
}
