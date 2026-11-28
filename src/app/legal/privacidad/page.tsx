import type { Metadata } from 'next'
import Link from 'next/link'
import { ExternalLink, GlobeLock, Lock, ShieldCheck, UserCheck } from 'lucide-react'
import { LEGAL_CONFIG } from '@/lib/legal-config'
import { LegalDocumentShell, type LegalSectionItem } from '../LegalDocumentShell'

export const metadata: Metadata = {
  title: `Política de Tratamiento de Datos Personales | ${LEGAL_CONFIG.brandName}`,
  description:
    'Política de Privacidad y Protección de Datos Personales (Habeas Data — Ley 1581 de 2012 y Decreto 1377 de 2013) de MotoTrack SaaS en Colombia.',
}

const SECTIONS: LegalSectionItem[] = [
  { id: 'responsable', number: '01', title: 'Identificación y contacto' },
  { id: 'roles-tratamiento', number: '02', title: 'Responsable vs. Encargado' },
  { id: 'categorias-datos', number: '03', title: 'Categorías de datos tratados' },
  { id: 'finalidades', number: '04', title: 'Finalidades del tratamiento' },
  { id: 'derechos-arco', number: '05', title: 'Derechos de los titulares (ARCO)' },
  { id: 'procedimiento-plazos', number: '06', title: 'Procedimiento y plazos legales' },
  { id: 'transferencia-seguridad', number: '07', title: 'Infraestructura cloud y seguridad' },
  { id: 'vigencia', number: '08', title: 'Vigencia y actualizaciones' },
]

function PolicyCard({
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

export default function PrivacyPage() {
  return (
    <LegalDocumentShell
      badge="Habeas Data · Ley 1581 de 2012"
      title="Política de Tratamiento de Datos Personales"
      subtitle={`Lineamientos de protección de datos personales adoptados por ${LEGAL_CONFIG.brandName} en cumplimiento de la Constitución Política de Colombia (art. 15), la Ley Estatutaria 1581 de 2012 y el Decreto 1377 de 2013.`}
      sections={SECTIONS}
    >
      <PolicyCard id="responsable" number="01" title="Identificación del Responsable y Canales de Atención">
        <p>
          El tratamiento de datos personales administrado directamente por la plataforma está a
          cargo de <strong className="text-white">{LEGAL_CONFIG.legalEntityName}</strong>,
          identificada con <strong className="text-white">{LEGAL_CONFIG.taxId}</strong> y domicilio
          en <strong className="text-white">{LEGAL_CONFIG.jurisdictionCity}</strong>.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 pt-1">
          <div className="rounded-xl border border-white/[0.08] bg-[#0B0D13] p-3.5 text-xs">
            <p className="font-bold text-white">Canal de Privacidad y Habeas Data</p>
            <a
              href={`mailto:${LEGAL_CONFIG.privacyEmail}`}
              className="mt-1 inline-block text-orange-400 underline underline-offset-4 hover:text-orange-300"
            >
              {LEGAL_CONFIG.privacyEmail}
            </a>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-[#0B0D13] p-3.5 text-xs">
            <p className="font-bold text-white">Soporte Técnico y Comercial</p>
            <a
              href={`mailto:${LEGAL_CONFIG.supportEmail}`}
              className="mt-1 inline-block text-orange-400 underline underline-offset-4 hover:text-orange-300"
            >
              {LEGAL_CONFIG.supportEmail}
            </a>
          </div>
        </div>
      </PolicyCard>

      <PolicyCard
        id="roles-tratamiento"
        number="02"
        title="Diferenciación de Roles: Responsable vs. Encargado"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-orange-500/30 bg-orange-500/[0.07] p-4 space-y-2">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-300">
              <UserCheck className="h-4 w-4 text-orange-400 shrink-0" />
              MotoTrack como Responsable
            </p>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              Actuamos como <strong className="text-white">Responsables del Tratamiento</strong>{' '}
              respecto de los datos de talleres suscriptores, representantes legales, usuarios del
              equipo del taller (administradores, recepcionistas, mecánicos), prospectos comerciales
              y datos de facturación o soporte del servicio SaaS.
            </p>
          </div>

          <div className="rounded-xl border border-sky-500/30 bg-sky-500/[0.07] p-4 space-y-2">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-300">
              <ShieldCheck className="h-4 w-4 text-sky-400 shrink-0" />
              MotoTrack como Encargado
            </p>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              Actuamos como <strong className="text-white">Encargados del Tratamiento</strong>{' '}
              respecto de los datos de clientes finales (motociclistas), placas, evidencias
              fotográficas y firmas electrónicas ingresados por cada taller. En este ámbito,{' '}
              <strong className="text-white">el taller es el Responsable del Tratamiento</strong> y
              quien decide sobre la recolección, uso y autorización de la información.
            </p>
          </div>
        </div>
      </PolicyCard>

      <PolicyCard id="categorias-datos" number="03" title="Categorías de Datos Tratados y Menores de Edad">
        <p>Dependiendo del perfil del titular, en la plataforma pueden tratarse las siguientes categorías:</p>
        <ul className="space-y-2 list-disc pl-5 marker:text-orange-400">
          <li>
            <strong className="text-white">Datos de identificación y contacto:</strong> nombre
            completo, documento de identidad (cuando el taller lo registre), número de teléfono /
            WhatsApp y correo electrónico.
          </li>
          <li>
            <strong className="text-white">Datos de cuenta operativa del taller:</strong> correo de
            acceso, rol asignado, estado activo/inactivo y registros de actividad en órdenes.
          </li>
          <li>
            <strong className="text-white">Datos del vehículo y orden de servicio:</strong> placa,
            marca, modelo, año, kilometraje de ingreso, nivel de combustible, notas de síntomas e
            ítems de presupuesto.
          </li>
          <li>
            <strong className="text-white">Evidencia multimedia y trazos de firma electrónica:</strong>{' '}
            fotografías del estado físico o reparaciones de la motocicleta y trazos gráficos de firma
            electrónica de conformidad capturados en recepción.
          </li>
        </ul>
        <p className="rounded-xl border border-white/[0.08] bg-[#0B0D13] p-3.5 text-xs text-slate-300">
          <strong className="text-white">Menores de edad:</strong> {LEGAL_CONFIG.brandName} es una
          plataforma B2B dirigida a talleres y propietarios o conductores mayores de edad. No
          recolectamos de manera intencional datos personales de niños, niñas ni adolescentes. Si
          llegara a identificarse un registro sin la debida autorización legal del representante,
          se procederá a su supresión inmediata.
        </p>
      </PolicyCard>

      <PolicyCard id="finalidades" number="04" title="Finalidades del Tratamiento">
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-bold text-white">A. Respecto de Talleres y Usuarios del Equipo</h3>
            <ul className="mt-1.5 space-y-1.5 list-disc pl-5 marker:text-orange-400">
              <li>Proveer acceso autenticado, administrar roles y mantener la seguridad multi-tenant.</li>
              <li>Gestionar suscripciones, pruebas gratuitas, renovaciones, cobros y soporte técnico.</li>
              <li>Enviar notificaciones operativas, de seguridad o cambios contractuales relevantes.</li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              B. Respecto de Clientes Motociclistas (por cuenta de cada Taller Responsable)
            </h3>
            <ul className="mt-1.5 space-y-1.5 list-disc pl-5 marker:text-sky-400">
              <li>
                Registrar el ingreso de la motocicleta, su estado físico y la firma electrónica de
                conformidad.
              </li>
              <li>
                Habilitar la consulta del estado de reparación en tiempo real mediante enlace
                privado (<em>Magic Link</em>) o validación por placa y últimos 4 dígitos de teléfono.
              </li>
              <li>
                Permitir la aprobación o rechazo electrónico de ítems del presupuesto y conservar la
                trazabilidad histórica de mantenimiento del vehículo en el taller.
              </li>
            </ul>
          </div>
        </div>
      </PolicyCard>

      <PolicyCard id="derechos-arco" number="05" title="Derechos de los Titulares (ARCO)">
        <p>
          Conforme al artículo 8 de la Ley 1581 de 2012, los titulares de los datos personales tienen
          derecho a:
        </p>
        <ul className="space-y-2 list-disc pl-5 marker:text-orange-400">
          <li>
            <strong className="text-white">Conocer, actualizar y rectificar</strong> sus datos
            personales frente al Responsable o Encargado.
          </li>
          <li>
            <strong className="text-white">Solicitar prueba de la autorización</strong> otorgada,
            salvo cuando expresamente se exceptúe como requisito para el tratamiento.
          </li>
          <li>
            <strong className="text-white">Ser informados</strong> previa solicitud respecto del uso
            que se les ha dado a sus datos personales.
          </li>
          <li>
            <strong className="text-white">Revocar la autorización y/o solicitar la supresión</strong>{' '}
            del dato cuando en el tratamiento no se respeten los principios, derechos y garantías
            constitucionales y legales, o cuando no exista deber legal o contractual de conservarlo.
          </li>
          <li>
            <strong className="text-white">Presentar quejas</strong> ante la{' '}
            <a
              href={LEGAL_CONFIG.sicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-orange-400 underline underline-offset-4 hover:text-orange-300"
            >
              Superintendencia de Industria y Comercio (SIC)
              <ExternalLink className="h-3 w-3" />
            </a>{' '}
            por infracciones a lo dispuesto en la Ley 1581 de 2012, una vez agotado el requisito de
            procedibilidad ante el Responsable.
          </li>
        </ul>
      </PolicyCard>

      <PolicyCard id="procedimiento-plazos" number="06" title="Procedimiento y Plazos Legales de Atención">
        <p>
          Los dueños de motocicletas cuyos datos fueron registrados por un taller específico deben
          dirigir sus consultas o reclamos <strong className="text-white">primariamente al taller</strong>{' '}
          como Responsable del Tratamiento. Para datos respecto de los cuales {LEGAL_CONFIG.brandName}{' '}
          actúa como Responsable, o para apoyo técnico en canalización, el titular puede escribir a{' '}
          <a
            href={`mailto:${LEGAL_CONFIG.privacyEmail}`}
            className="text-orange-400 underline underline-offset-4"
          >
            {LEGAL_CONFIG.privacyEmail}
          </a>{' '}
          indicando su nombre completo, número de identificación/teléfono, placa (si aplica) y
          descripción clara de su solicitud.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 pt-1">
          <div className="rounded-xl border border-white/10 bg-[#0B0D13] p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-orange-300">
              Consultas (Art. 14 Ley 1581)
            </p>
            <p className="mt-1.5 text-sm font-semibold text-white">Máximo 10 días hábiles</p>
            <p className="mt-1 text-xs text-slate-400">
              Contados a partir de la fecha de recibo. Si no fuere posible atenderla dentro de dicho
              término, se informará al interesado y se responderá en máximo{' '}
              <strong className="text-slate-200">5 días hábiles</strong> adicionales.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#0B0D13] p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-sky-300">
              Reclamos (Art. 15 Ley 1581)
            </p>
            <p className="mt-1.5 text-sm font-semibold text-white">Máximo 15 días hábiles</p>
            <p className="mt-1 text-xs text-slate-400">
              Contados desde el día siguiente a la recepción completa. Cuando no fuere posible
              atenderlo en ese plazo, se informará el motivo de la demora con prórroga máxima de{' '}
              <strong className="text-slate-200">8 días hábiles</strong>.
            </p>
          </div>
        </div>
      </PolicyCard>

      <PolicyCard
        id="transferencia-seguridad"
        number="07"
        title="Transmisión Internacional de Datos, Seguridad y Retención"
      >
        <div className="rounded-xl border border-white/10 bg-[#0B0D13] p-4 space-y-2">
          <p className="flex items-center gap-2 text-xs sm:text-sm font-bold text-white">
            <GlobeLock className="h-4 w-4 text-sky-400 shrink-0" />
            Infraestructura Cloud Internacional (Vercel y Supabase)
          </p>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Para garantizar alta disponibilidad y desempeño técnico, la plataforma aloja y procesa
            información en infraestructura en la nube provista por terceros internacionales
            especializados, principalmente <strong className="text-white">Vercel</strong> (despliegue
            y ejecución aplicativa) y <strong className="text-white">Supabase</strong> (base de
            datos PostgreSQL, autenticación y almacenamiento de objetos). Al aceptar esta política, el
            titular autoriza expresamente dicha transmisión internacional bajo estándares de
            confidencialidad y seguridad.
          </p>
        </div>
        <ul className="space-y-2 list-disc pl-5 marker:text-orange-400">
          <li>
            <strong className="text-white flex-inline items-center gap-1">
              <Lock className="inline h-3.5 w-3.5 text-orange-400 mr-1" />
              Medidas técnicas de protección:
            </strong>{' '}
            Cifrado de comunicaciones en tránsito mediante HTTPS/TLS, control de sesiones con tokens
            firmados, políticas de seguridad a nivel de fila (<em>Row Level Security - RLS</em>) en
            base de datos para aislar estrictamente la información por taller (<code>workshop_id</code>),
            y acceso público a órdenes únicamente mediante UUID impredecibles o validación de placa
            con últimos 4 dígitos del teléfono.
          </li>
          <li>
            <strong className="text-white">Depuración automática de multimedia a los 90 días:</strong>{' '}
            Las fotografías y evidencias visuales asociadas a órdenes entregadas o canceladas se
            eliminan automáticamente de nuestro almacenamiento transcurridos{' '}
            <strong className="text-white">{LEGAL_CONFIG.mediaRetentionDays} días calendario</strong>{' '}
            desde el cierre de la orden.
          </li>
        </ul>
      </PolicyCard>

      <PolicyCard id="vigencia" number="08" title="Vigencia y Modificaciones de la Política">
        <p>
          La presente Política de Tratamiento de Datos Personales rige a partir del{' '}
          <strong className="text-white">{LEGAL_CONFIG.lastUpdated}</strong>. Cualquier cambio
          sustancial será publicado oportunamente en esta URL y notificado a los talleres activos
          por los canales registrados. Las bases de datos permanecerán vigentes mientras se
          mantenga la relación contractual con el taller o subsista una finalidad legítima o deber
          legal de conservación.
        </p>
      </PolicyCard>
    </LegalDocumentShell>
  )
}
