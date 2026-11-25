import Link from 'next/link'
import { Wrench } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-white/[0.08] bg-[#08090C] py-12 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 text-white">
              <Wrench className="h-4 w-4" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white">MotoTrack</span>
              <p className="text-xs text-slate-500">
                Software operativo para talleres de motocicletas en Colombia y LATAM.
              </p>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium">
            <a href="#funcionalidades" className="transition-colors hover:text-white">
              Funcionalidades
            </a>
            <a href="#portal-cliente" className="transition-colors hover:text-white">
              Portal Cliente
            </a>
            <a href="#precios" className="transition-colors hover:text-white">
              Precios
            </a>
            <a href="#faq" className="transition-colors hover:text-white">
              FAQ
            </a>
            <Link href="/track" className="text-orange-400 transition-colors hover:text-orange-300">
              Consultar Mi Moto
            </Link>
            <Link href="/t/taller-demo" className="transition-colors hover:text-white">
              Micrositio Demo
            </Link>
            <Link href="/login" className="transition-colors hover:text-white">
              Iniciar Sesión
            </Link>
          </nav>
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-2 border-t border-white/[0.06] pt-6 text-xs text-slate-500 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} MotoTrack SaaS. Todos los derechos reservados.</p>
          <p>Diseñado para talleres de motos · Colombia &amp; LATAM</p>
        </div>
      </div>
    </footer>
  )
}
