import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { MotoTrackBrand } from '@/components/brand/MotoTrackBrand'
import { WorkshopLogo } from './WorkshopLogo'

interface WorkshopFooterProps {
  workshopName: string
  logoUrl?: string | null
}

export function WorkshopFooter({ workshopName, logoUrl }: WorkshopFooterProps) {
  return (
    <footer className="border-t border-white/[0.08] bg-[#08090C] py-10 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <WorkshopLogo name={workshopName} logoUrl={logoUrl} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">{workshopName}</p>
              <p className="text-xs text-slate-500">
                Servicio técnico especializado para motocicletas
              </p>
            </div>
          </div>

          <nav
            aria-label="Enlaces rápidos del taller"
            className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-slate-300"
          >
            <a href="#consultar-moto" className="transition-colors hover:text-white">
              Consultar Moto
            </a>
            <a href="#servicios" className="transition-colors hover:text-white">
              Servicios
            </a>
            <a href="#como-trabajamos" className="transition-colors hover:text-white">
              Cómo Trabajamos
            </a>
            <a href="#agendar" className="transition-colors hover:text-white">
              Agendar
            </a>
            <Link
              href="/legal/privacidad"
              className="text-slate-400 transition-colors hover:text-white"
            >
              Privacidad
            </Link>
            <Link
              href="/legal/terminos"
              className="text-slate-400 transition-colors hover:text-white"
            >
              Términos
            </Link>
          </nav>
        </div>

        <div className="flex flex-col items-start justify-between gap-4 border-t border-white/[0.06] pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} {workshopName}. Todos los derechos reservados.
          </p>

          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#101218] px-3.5 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-orange-500/40 hover:text-white"
          >
            <span className="text-slate-400">Impulsado por</span>
            <MotoTrackBrand variant="horizontal" theme="dark" size="xs" />
            <ExternalLink className="h-3 w-3 text-slate-400" />
          </a>
        </div>
      </div>
    </footer>
  )
}
