import Link from 'next/link'
import { ExternalLink, Mail, MapPin, ShieldCheck } from 'lucide-react'
import { LEGAL_CONFIG } from '@/lib/legal-config'
import { LegalHeader } from './LegalHeader'

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#08090C] text-slate-100 [color-scheme:dark] selection:bg-orange-500/30 selection:text-orange-100">
      {/* Glow ambiental sutil Huly × MotoTrack */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute left-1/2 top-[-120px] h-[460px] w-[860px] -translate-x-1/2 rounded-full opacity-35 blur-[120px]"
          style={{
            background:
              'radial-gradient(ellipse at 45% 45%, rgba(249,115,22,0.3) 0%, rgba(56,189,248,0.16) 55%, rgba(8,9,12,0) 80%)',
          }}
        />
      </div>

      <LegalHeader />

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        {children}
      </main>

      <footer className="relative z-10 border-t border-white/[0.08] bg-[#08090C] py-10 text-xs text-slate-400">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="space-y-1">
              <p className="font-semibold text-slate-200">{LEGAL_CONFIG.legalEntityName}</p>
              <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-400">
                <span>{LEGAL_CONFIG.taxId}</span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-orange-400" />
                  {LEGAL_CONFIG.jurisdictionCity}
                </span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <a
                href={`mailto:${LEGAL_CONFIG.supportEmail}`}
                className="inline-flex items-center gap-1.5 text-slate-300 transition-colors hover:text-orange-300"
              >
                <Mail className="h-3.5 w-3.5 text-orange-400" />
                {LEGAL_CONFIG.supportEmail}
              </a>
              <a
                href={`mailto:${LEGAL_CONFIG.privacyEmail}`}
                className="inline-flex items-center gap-1.5 text-slate-300 transition-colors hover:text-orange-300"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-sky-400" />
                {LEGAL_CONFIG.privacyEmail}
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

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-5 text-slate-500">
            <p>
              © {new Date().getFullYear()} {LEGAL_CONFIG.brandName} SaaS · República de Colombia.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/legal/terminos" className="hover:text-slate-300">
                Términos
              </Link>
              <Link href="/legal/privacidad" className="hover:text-slate-300">
                Privacidad
              </Link>
              <Link href="/legal/cookies" className="hover:text-slate-300">
                Cookies
              </Link>
              <Link href="/track" className="text-orange-400 hover:text-orange-300">
                Consultar Mi Moto
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
