import type { Metadata } from 'next'
import Link from 'next/link'
import { Settings2, ShieldCheck } from 'lucide-react'
import { LEGAL_CONFIG } from '@/lib/legal-config'
import { LegalDocumentShell, type LegalSectionItem } from '../LegalDocumentShell'

export const metadata: Metadata = {
  title: `Política de Cookies y Almacenamiento Local | ${LEGAL_CONFIG.brandName}`,
  description:
    'Información clara sobre el uso exclusivo de cookies técnicas esenciales de autenticación y sesión en MotoTrack SaaS.',
}

const SECTIONS: LegalSectionItem[] = [
  { id: 'que-son', number: '01', title: '¿Qué son y cuáles usamos?' },
  { id: 'cero-publicidad', number: '02', title: 'Ausencia de cookies publicitarias' },
  { id: 'gestion', number: '03', title: 'Gestión desde el navegador' },
]

function CookieCard({
  id,
  number,
  title,
  children,
}: {
  id: string
  number: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      className="scroll-mt-36 rounded-2xl border border-white/10 bg-[#101218] p-6 sm:p-7 space-y-4"
    >
      <div className="flex items-baseline gap-3 border-b border-white/[0.07] pb-3.5">
        <span className="font-mono text-xs font-bold text-orange-400">{number}</span>
        <h2 className="text-lg font-bold tracking-tight text-white sm:text-xl">{title}</h2>
      </div>
      <div className="space-y-3 text-sm leading-relaxed text-slate-300">{children}</div>
    </section>
  )
}

export default function CookiesPage() {
  return (
    <LegalDocumentShell
      badge="Transparencia Digital"
      title="Política de Cookies y Almacenamiento Local"
      subtitle={`Detalle sobre las cookies técnicas utilizadas por ${LEGAL_CONFIG.brandName} para mantener sesiones seguras y asegurar el funcionamiento correcto de la plataforma.`}
      sections={SECTIONS}
    >
      <CookieCard id="que-son" number="01" title="¿Qué son las cookies y qué usa MotoTrack actualmente?">
        <p>
          Las cookies y el almacenamiento local son pequeños archivos que el navegador guarda en tu
          dispositivo para recordar el estado de una sesión o preferencias técnicas entre páginas.
        </p>
        <p>
          Actualmente, <strong className="text-white">{LEGAL_CONFIG.brandName}</strong> utiliza{' '}
          <strong className="text-white">
            únicamente cookies técnicas estrictamente necesarias
          </strong>{' '}
          para la prestación del servicio, las cuales no requieren consentimiento previo publicitario
          por ser indispensables para la operación solicitada por el usuario:
        </p>
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#0B0D13]">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/10 bg-white/[0.03] text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3">Proveedor / Tecnología</th>
                <th className="px-4 py-3">Finalidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-slate-300">
              <tr>
                <td className="px-4 py-3 font-semibold text-white whitespace-nowrap">
                  Autenticación y sesión
                </td>
                <td className="px-4 py-3 font-mono text-orange-300 whitespace-nowrap">
                  Supabase Auth (<code>sb-*-auth-token</code>)
                </td>
                <td className="px-4 py-3">
                  Mantener iniciada la sesión segura de administradores, recepcionistas y mecánicos,
                  validar tokens SSR y aplicar protección de rutas en el middleware.
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-white whitespace-nowrap">
                  Preferencias básicas de UI
                </td>
                <td className="px-4 py-3 font-mono text-sky-300 whitespace-nowrap">
                  Navegador / Estado local
                </td>
                <td className="px-4 py-3">
                  Conservar estado visual elemental de la interfaz y evitar recargas innecesarias
                  durante la navegación del panel operativo.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CookieCard>

      <CookieCard
        id="cero-publicidad"
        number="02"
        title="Sin cookies publicitarias ni rastreadores de terceros"
      >
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.07] p-4 space-y-2">
          <p className="flex items-center gap-2 text-xs sm:text-sm font-bold text-emerald-200">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            Entorno operativo libre de rastreo publicitario
          </p>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
            La plataforma operativa de {LEGAL_CONFIG.brandName} (panel del taller, Modo Mecánico,
            buscador <code>/track</code> y portal del cliente <code>/track/[token]</code>){' '}
            <strong className="text-white">
              no inyecta cookies publicitarias, de retargeting ni rastreadores comerciales de
              terceros
            </strong>
            .
          </p>
        </div>
        <p>
          En caso de que en el futuro se incorporen herramientas de analítica web o píxeles
          comerciales en el sitio informativo público, {LEGAL_CONFIG.brandName} actualizará esta
          política previamente e implementará el mecanismo de gestión de consentimiento que exija la
          normativa aplicable.
        </p>
      </CookieCard>

      <CookieCard id="gestion" number="03" title="Cómo gestionar o deshabilitar cookies y funciones dependientes">
        <p>
          Puedes configurar tu navegador (Chrome, Safari, Edge, Firefox o navegadores móviles) para
          bloquear o eliminar las cookies almacenadas en cualquier momento desde la sección de
          Privacidad y Seguridad de tu navegador.
        </p>
        <div className="rounded-xl border border-white/10 bg-[#0B0D13] p-4 space-y-2 text-xs text-slate-300">
          <p className="flex items-center gap-2 font-bold text-white">
            <Settings2 className="h-4 w-4 text-orange-400 shrink-0" />
            Funciones que dependen de cookies técnicas
          </p>
          <p>
            Si bloqueas o eliminas las cookies estrictamente necesarias, podrás seguir navegando la
            página informativa y las páginas legales, pero{' '}
            <strong className="text-white">
              no podrás iniciar sesión ni mantener activa la autenticación
            </strong>{' '}
            en las rutas protegidas del panel administrativo (<code>/dashboard</code>) ni en el Modo
            Mecánico (<code>/mechanic</code>).
          </p>
        </div>
        <p className="text-xs text-slate-400">
          Para cualquier inquietud sobre privacidad o cookies, escríbenos a{' '}
          <a
            href={`mailto:${LEGAL_CONFIG.privacyEmail}`}
            className="text-orange-400 underline underline-offset-4"
          >
            {LEGAL_CONFIG.privacyEmail}
          </a>{' '}
          o revisa nuestra{' '}
          <Link href="/legal/privacidad" className="text-orange-400 underline underline-offset-4">
            Política de Privacidad
          </Link>
          .
        </p>
      </CookieCard>
    </LegalDocumentShell>
  )
}
