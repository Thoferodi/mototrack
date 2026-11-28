import Link from 'next/link'
import { ExternalLink, Mail, ShieldCheck } from 'lucide-react'
import { MotoTrackBrand } from '@/components/brand/MotoTrackBrand'
import { LEGAL_CONFIG } from '@/lib/legal-config'

export function Footer() {
  return (
    <footer className="border-t border-white/[0.08] bg-[#08090C] py-12 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-12">
          {/* Marca y navegación producto */}
          <div className="md:col-span-6 space-y-5">
            <div className="space-y-2.5">
              <Link href="/" className="inline-flex">
                <MotoTrackBrand variant="stacked" theme="dark" size="sm" />
              </Link>
              <p className="text-xs text-slate-400 max-w-sm">
                Software operativo para talleres de motocicletas en Colombia y LATAM.
              </p>
            </div>

            <nav
              aria-label="Navegación principal del pie"
              className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium"
            >
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

          {/* Bloque Legal y Protección al Consumidor */}
          <div className="md:col-span-6 rounded-2xl border border-white/[0.08] bg-[#101218]/70 p-5 space-y-3">
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-200">
              <ShieldCheck className="h-3.5 w-3.5 text-orange-400" />
              Legal y Protección al Consumidor
            </p>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium">
              <Link
                href="/legal/terminos"
                className="text-slate-300 transition-colors hover:text-orange-300"
              >
                Términos y Condiciones
              </Link>
              <Link
                href="/legal/privacidad"
                className="text-slate-300 transition-colors hover:text-orange-300"
              >
                Política de Privacidad
              </Link>
              <Link
                href="/legal/cookies"
                className="text-slate-300 transition-colors hover:text-orange-300"
              >
                Política de Cookies
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/[0.06] pt-3 text-xs">
              <a
                href={`mailto:${LEGAL_CONFIG.supportEmail}`}
                className="inline-flex items-center gap-1.5 text-slate-300 transition-colors hover:text-white"
              >
                <Mail className="h-3.5 w-3.5 text-orange-400" />
                Soporte / PQRS: {LEGAL_CONFIG.supportEmail}
              </a>
              <a
                href={LEGAL_CONFIG.sicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-slate-300 underline decoration-white/20 underline-offset-4 transition-colors hover:text-white hover:decoration-orange-400"
              >
                Superintendencia de Industria y Comercio (SIC)
                <ExternalLink className="h-3 w-3 text-orange-400" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-2 border-t border-white/[0.06] pt-6 text-xs text-slate-500 sm:flex-row sm:items-center">
          <p>
            © {new Date().getFullYear()} {LEGAL_CONFIG.brandName} SaaS. Todos los derechos
            reservados.
          </p>
          <p>Diseñado para talleres de motos · {LEGAL_CONFIG.jurisdictionCity}</p>
        </div>
      </div>
    </footer>
  )
}
