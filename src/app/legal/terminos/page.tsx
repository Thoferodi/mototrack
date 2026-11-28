import type { Metadata } from 'next'
import Link from 'next/link'
import { AlertTriangle, CheckCircle2, FileCheck2, ShieldAlert } from 'lucide-react'
import { LEGAL_CONFIG } from '@/lib/legal-config'
import { LegalDocumentShell, type LegalSectionItem } from '../LegalDocumentShell'

export const metadata: Metadata = {
  title: `Términos y Condiciones SaaS | ${LEGAL_CONFIG.brandName}`,
  description:
    'Términos y Condiciones de uso de MotoTrack SaaS en Colombia: licencia B2B, Acuerdo de Encargado del Tratamiento (Ley 1581 de 2012), firma electrónica (Ley 527 de 1999) y retención de archivos a 90 días.',
}

const SECTIONS: LegalSectionItem[] = [
  { id: 'identificacion', number: '01', title: 'Identificación y aceptación' },
  { id: 'objeto-licencia', number: '02', title: 'Objeto y licencia SaaS' },
  { id: 'cuentas-roles', number: '03', title: 'Cuentas, roles y credenciales' },
  { id: 'planes-pagos', number: '04', title: 'Planes, pagos y cancelación' },
  { id: 'encargado-datos', number: '05', title: 'Encargado del Tratamiento (Ley 1581)' },
  { id: 'retencion-90-dias', number: '06', title: 'Retención y depuración (90 días)' },
  { id: 'firma-electronica', number: '07', title: 'Firma electrónica y aprobaciones' },
  { id: 'limitacion-responsabilidad', number: '08', title: 'Limitación de responsabilidad' },
  { id: 'comprobantes-dian', number: '09', title: 'Exclusión de facturación DIAN' },
  { id: 'propiedad-ley', number: '10', title: 'Propiedad intelectual, PQRS y ley' },
]

function ClauseCard({
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

export default function TermsPage() {
  return (
    <LegalDocumentShell
      badge="Contrato SaaS B2B · Colombia"
      title="Términos y Condiciones de Uso"
      subtitle={`Condiciones contractuales que regulan el acceso y uso de la plataforma tecnológica ${LEGAL_CONFIG.brandName} SaaS por parte de talleres de motocicletas, su personal autorizado y usuarios del portal público de seguimiento.`}
      sections={SECTIONS}
    >
      <ClauseCard id="identificacion" number="01" title="Identificación del Proveedor y Aceptación del Servicio">
        <p>
          La plataforma <strong className="text-white">{LEGAL_CONFIG.brandName}</strong> es operada
          por <strong className="text-white">{LEGAL_CONFIG.legalEntityName}</strong>, identificada
          con <strong className="text-white">{LEGAL_CONFIG.taxId}</strong>, con domicilio principal
          en <strong className="text-white">{LEGAL_CONFIG.jurisdictionCity}</strong> y canal de
          atención en{' '}
          <a
            href={`mailto:${LEGAL_CONFIG.supportEmail}`}
            className="text-orange-400 underline underline-offset-4 hover:text-orange-300"
          >
            {LEGAL_CONFIG.supportEmail}
          </a>
          .
        </p>
        <p>
          Al crear una cuenta de taller, habilitar usuarios operativos, iniciar sesión o utilizar
          cualquiera de los módulos de {LEGAL_CONFIG.brandName} (panel administrativo, modo mecánico,
          micrositio público o Live Tracker), el representante legal del taller o usuario acepta de
          manera expresa, libre e informada los presentes Términos y Condiciones y la{' '}
          <Link
            href="/legal/privacidad"
            className="text-orange-400 underline underline-offset-4 hover:text-orange-300"
          >
            Política de Tratamiento de Datos Personales
          </Link>
          . Si no está de acuerdo con estas estipulaciones, debe abstenerse de utilizar el servicio.
        </p>
      </ClauseCard>

      <ClauseCard id="objeto-licencia" number="02" title="Objeto y Licencia de Uso SaaS">
        <p>
          {LEGAL_CONFIG.brandName} otorga al taller suscriptor (<strong className="text-white">el Cliente B2B</strong>)
          una licencia de uso bajo modalidad Software como Servicio (SaaS) de carácter{' '}
          <strong className="text-white">
            no exclusivo, revocable, intransferible y limitado
          </strong>{' '}
          a la vigencia de su suscripción activa, para gestionar órdenes de trabajo, recepción
          fotográfica de motocicletas, presupuestos interactivos, catálogo de repuestos y consulta
          en tiempo real para sus clientes finales.
        </p>
        <p>
          Esta licencia no implica bajo ninguna circunstancia venta, cesión ni licenciamiento del
          código fuente, bases de datos subyacentes, arquitectura multi-tenant, diseños ni derechos
          de propiedad intelectual de la plataforma. Queda prohibido descompilar, realizar
          ingeniería inversa, revender accesos o utilizar la plataforma para fines ilícitos o
          ajenos a la operación legítima del taller.
        </p>
      </ClauseCard>

      <ClauseCard id="cuentas-roles" number="03" title="Cuentas, Roles Operativos y Responsabilidad del Taller">
        <p>
          El acceso al entorno privado de cada taller se estructura mediante un modelo de
          aislamiento multi-tenant y control de acceso basado en los siguientes roles operativos:
        </p>
        <ul className="grid gap-2 sm:grid-cols-2 pt-1">
          {[
            {
              role: 'owner (Propietario)',
              desc: 'Control total del taller, equipo, configuración de marca blanca, rendimiento financiero y métricas.',
            },
            {
              role: 'admin (Administrador)',
              desc: 'Gestión operativa integral, catálogo, equipo, órdenes de trabajo y reportes de rendimiento.',
            },
            {
              role: 'manager (Gerente / Jefe de Taller)',
              desc: 'Supervisión de órdenes, asignación de mecánicos, presupuestos y métricas operativas.',
            },
            {
              role: 'receptionist (Recepción)',
              desc: 'Registro de clientes y motos, creación de órdenes, recepción con firma y gestión operativa sin acceso a métricas financieras sensibles.',
            },
            {
              role: 'mechanic (Mecánico)',
              desc: 'Acceso exclusivo al Modo Mecánico ("Manos Sucias") para registrar hallazgos, evidencias WebP y avance de estados.',
            },
          ].map((item) => (
            <li
              key={item.role}
              className="rounded-xl border border-white/[0.08] bg-[#0B0D13] p-3 text-xs"
            >
              <span className="font-mono font-bold text-orange-300">{item.role}</span>
              <p className="mt-1 text-slate-400 leading-relaxed">{item.desc}</p>
            </li>
          ))}
        </ul>
        <p>
          El taller es el único responsable de la custodia de sus credenciales, de asignar los
          permisos adecuados a cada integrante, de desactivar de inmediato las cuentas de empleados
          desvinculados desde el módulo de Equipo y de toda actividad realizada bajo sus cuentas
          autenticadas.
        </p>
      </ClauseCard>

      <ClauseCard id="planes-pagos" number="04" title="Planes, Pagos, Prueba Gratuita y Cancelación">
        <ul className="space-y-2.5 list-disc pl-5 marker:text-orange-400">
          <li>
            <strong className="text-white">Prueba gratuita:</strong> Los nuevos talleres pueden
            acceder a una prueba gratuita de <strong className="text-white">{LEGAL_CONFIG.trialDays} días calendario</strong>{' '}
            para evaluar la plataforma, sujeta a los límites del plan seleccionado.
          </li>
          <li>
            <strong className="text-white">Planes y tarifas:</strong> Los valores vigentes de los
            planes (<em>Taller Inicial</em>, <em>Taller Pro</em> y <em>Multi-Sede</em>) se publican
            en pesos colombianos (COP) en la sección de precios. Cuando aplique por configuración
            personalizada, migración asistida o capacitación presencial/remota, podrá acordarse un{' '}
            <strong className="text-white">cargo único de activación</strong> informado previamente
            al taller antes de la contratación.
          </li>
          <li>
            <strong className="text-white">Ciclos de facturación y descuento anual:</strong> La
            suscripción puede contratarse en modalidad mensual o anual. La modalidad anual aplica un{' '}
            <strong className="text-white">{LEGAL_CONFIG.annualDiscountPercent}% de descuento</strong>{' '}
            sobre la tarifa mensual equivalente y se liquida por período anual anticipado.
          </li>
          <li>
            <strong className="text-white">Renovación y cancelación:</strong> El taller puede
            solicitar la cancelación de la renovación automática en cualquier momento escribiendo a{' '}
            <a
              href={`mailto:${LEGAL_CONFIG.supportEmail}`}
              className="text-orange-400 underline underline-offset-4"
            >
              {LEGAL_CONFIG.supportEmail}
            </a>{' '}
            antes del corte del período vigente. Los pagos ya causados por períodos en curso o cargos
            de activación ejecutados no son reembolsables, salvo disposición legal imperativa en
            contrario.
          </li>
          <li>
            <strong className="text-white">Suspensión por mora:</strong> Transcurridos cinco (5)
            días calendario desde el vencimiento del pago sin confirmación de abono,{' '}
            {LEGAL_CONFIG.brandName} podrá restringir temporalmente el acceso operativo al panel y
            suspender la publicación del micrositio del taller hasta la normalización de la cuenta.
          </li>
        </ul>
      </ClauseCard>

      <ClauseCard
        id="encargado-datos"
        number="05"
        title="Cláusula de Encargado del Tratamiento (Acuerdo de Transmisión de Datos — Ley 1581 de 2012)"
      >
        <div className="rounded-xl border border-sky-500/30 bg-sky-500/[0.07] p-4 text-xs sm:text-sm text-sky-100 space-y-2">
          <p className="font-bold flex items-center gap-2 text-sky-200">
            <ShieldAlert className="h-4 w-4 text-sky-400 shrink-0" />
            Distribución legal de responsabilidades (Ley 1581 de 2012 y Decreto 1377 de 2013)
          </p>
          <p>
            Para todos los efectos legales en la República de Colombia, cada taller usuario actúa
            como <strong className="text-white">Responsable del Tratamiento</strong> respecto de los
            datos personales, números telefónicos (WhatsApp), correos electrónicos, placas,
            kilometraje, fotografías y firmas electrónicas de sus clientes motociclistas.{' '}
            <strong className="text-white">{LEGAL_CONFIG.brandName}</strong> actúa exclusivamente en
            calidad de <strong className="text-white">Encargado del Tratamiento</strong> y proveedor
            de infraestructura tecnológica.
          </p>
        </div>
        <p>En virtud de esta calidad de Encargado del Tratamiento, el taller declara y se obliga a:</p>
        <ul className="space-y-2 list-disc pl-5 marker:text-orange-400">
          <li>
            Obtener de manera previa, expresa e informada la autorización de tratamiento de datos
            personales de cada cliente motociclista antes de registrar su información en la
            plataforma, informándole sobre el seguimiento en línea y la conservación temporal de
            evidencias.
          </li>
          <li>
            Atender oportunamente las consultas y reclamos (derechos ARCO) formulados por los
            dueños de motocicletas en los términos de la Ley 1581 de 2012.
          </li>
          <li>
            {LEGAL_CONFIG.brandName} tratará dichos datos únicamente conforme a las instrucciones del
            taller derivadas de la operación normal del software, manteniendo aislamiento lógico por
            inquilino (Row Level Security) y absteniéndose de comercializar o ceder las bases de
            datos de clientes de los talleres a terceros.
          </li>
        </ul>
      </ClauseCard>

      <ClauseCard
        id="retencion-90-dias"
        number="06"
        title="Política de Retención y Depuración Automática de Archivos (90 Días)"
      >
        <div className="rounded-xl border border-orange-500/40 bg-orange-500/10 p-4 space-y-2">
          <p className="flex items-center gap-2 text-sm font-bold text-orange-200">
            <AlertTriangle className="h-4 w-4 text-orange-400 shrink-0" />
            Eliminación automática de fotografías y evidencias a los {LEGAL_CONFIG.mediaRetentionDays} días calendario
          </p>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
            Para optimizar el almacenamiento en la nube y mantener la velocidad operativa de la
            plataforma, las fotografías de ingreso, evidencias técnicas del mecánico y archivos
            multimedia asociados a órdenes de trabajo en estado{' '}
            <strong className="text-white">Entregada (delivered)</strong> o{' '}
            <strong className="text-white">Cancelada (cancelled)</strong> se eliminan de manera
            automática e irreversible una vez transcurridos{' '}
            <strong className="text-white">
              {LEGAL_CONFIG.mediaRetentionDays} días calendario
            </strong>{' '}
            desde el cierre o última actualización terminal de la orden, mediante un proceso
            automatizado diario.
          </p>
        </div>
        <p>
          El historial textual de la orden, ítems de presupuesto y trazabilidad básica de estados
          permanece en la base de datos operativa mientras la cuenta del taller esté activa. Si el
          taller requiere conservar las imágenes de soporte por un término superior para fines de
          garantía o archivo propio, es su exclusiva responsabilidad descargar y respaldar dichas
          fotografías localmente antes de cumplirse el plazo de {LEGAL_CONFIG.mediaRetentionDays}{' '}
          días.
        </p>
      </ClauseCard>

      <ClauseCard
        id="firma-electronica"
        number="07"
        title="Validez de Firmas Electrónicas y Aprobaciones Digitales"
      >
        <p>
          De conformidad con la <strong className="text-white">Ley 527 de 1999</strong> (sobre
          mensajes de datos y comercio electrónico) y el{' '}
          <strong className="text-white">Decreto 2364 de 2012</strong> (reglamentario de la firma
          electrónica en Colombia), los trazos manuscritos capturados en pantalla durante la recepción
          de la motocicleta y las aprobaciones o rechazos de ítems ejecutados por el cliente a
          través de su enlace único de seguimiento (<em>Magic Link</em>) constituyen{' '}
          <strong className="text-white">firmas electrónicas y mensajes de datos</strong> vinculados
          a un registro cronológico inmutable con fecha y hora en la bitácora de la orden.
        </p>
        <p>
          El taller es responsable de verificar la identidad de la persona que suscribe la
          recepción en el punto físico y de enviar el enlace de seguimiento exclusivamente al número
          de contacto autorizado por el propietario o tenedor de la motocicleta.
        </p>
      </ClauseCard>

      <ClauseCard
        id="limitacion-responsabilidad"
        number="08"
        title="Limitación de Responsabilidad"
      >
        <p>
          <strong className="text-white">{LEGAL_CONFIG.brandName} es exclusivamente una herramienta de software B2B.</strong>{' '}
          {LEGAL_CONFIG.brandName} no presta servicios de mecánica automotriz o de motocicletas, no
          inspecciona vehículos, no vende repuestos, no intermedia pagos entre el taller y el
          motociclista ni garantiza la calidad técnica, oportunidad o idoneidad de las reparaciones
          realizadas por los talleres usuarios.
        </p>
        <p>
          En consecuencia, {LEGAL_CONFIG.brandName} no será responsable por daños físicos, hurtos,
          pérdidas de motocicletas o accesorios, garantías mecánicas, errores de diagnóstico,
          sobrecostos, ni controversias contractuales o de consumo surgidas entre el taller y sus
          clientes. En la máxima medida permitida por la ley colombiana, la responsabilidad total
          acumulada de {LEGAL_CONFIG.brandName} frente al taller por fallas atribuibles al software
          se limitará al valor efectivamente pagado por el taller durante los últimos tres (3) meses
          de suscripción.
        </p>
      </ClauseCard>

      <ClauseCard
        id="comprobantes-dian"
        number="09"
        title="Comprobantes Operativos y Exclusión de Facturación Electrónica DIAN"
      >
        <div className="rounded-xl border border-white/10 bg-[#0B0D13] p-4 space-y-2">
          <p className="flex items-center gap-2 text-xs sm:text-sm font-bold text-white">
            <FileCheck2 className="h-4 w-4 text-orange-400 shrink-0" />
            Documento exclusivamente operativo — No válido como Factura Electrónica DIAN
          </p>
          <p className="text-xs sm:text-sm text-slate-300">
            Los resúmenes de presupuesto, órdenes de trabajo y comprobantes imprimibles o PDF con
            código QR generados por {LEGAL_CONFIG.brandName} tienen carácter estrictamente
            operativo e informativo de taller.{' '}
            <strong className="text-white">
              No constituyen Factura Electrónica de Venta, documento equivalente POS ni soporte
              fiscal ante la DIAN (Resolución 000165 de 2023 y normas concordantes).
            </strong>{' '}
            Cada taller es responsable de emitir su facturación electrónica o documento tributario
            correspondiente mediante su software contable o proveedor tecnológico autorizado por la
            DIAN.
          </p>
        </div>
      </ClauseCard>

      <ClauseCard
        id="propiedad-ley"
        number="10"
        title="Propiedad Intelectual, Disponibilidad, PQRS y Ley Aplicable"
      >
        <ul className="space-y-2.5 list-disc pl-5 marker:text-orange-400">
          <li>
            <strong className="text-white">Propiedad intelectual:</strong> La marca{' '}
            {LEGAL_CONFIG.brandName}, su interfaz, diseños, flujos, textos y software son de
            propiedad exclusiva de su titular y están protegidos por la legislación colombiana e
            internacional de derechos de autor y propiedad industrial.
          </li>
          <li>
            <strong className="text-white">Disponibilidad y soporte:</strong> Procuramos una
            disponibilidad continua del servicio sobre infraestructura cloud moderna, pudiendo
            realizar ventanas de mantenimiento programadas. El soporte técnico y la radicación de
            Peticiones, Quejas y Reclamos (PQRS) se atienden a través de{' '}
            <a
              href={`mailto:${LEGAL_CONFIG.supportEmail}`}
              className="text-orange-400 underline underline-offset-4"
            >
              {LEGAL_CONFIG.supportEmail}
            </a>
            .
          </li>
          <li>
            <strong className="text-white">Modificaciones:</strong> {LEGAL_CONFIG.brandName} podrá
            actualizar estos términos informando la fecha de actualización en esta página o dentro
            del panel operativo cuando los cambios sean sustanciales.
          </li>
          <li>
            <strong className="text-white">Ley aplicable y jurisdicción:</strong> Estos términos se
            rigen por las leyes de la <strong className="text-white">República de Colombia</strong>.
            Cualquier controversia derivada de su interpretación o ejecución se someterá a los
            jueces competentes de la ciudad de{' '}
            <strong className="text-white">{LEGAL_CONFIG.jurisdictionCity}</strong>, sin perjuicio
            de las facultades legales de la Superintendencia de Industria y Comercio (SIC) cuando
            apliquen.
          </li>
        </ul>

        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] px-4 py-3 text-xs text-emerald-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>
            ¿Tienes dudas sobre estas condiciones? Escríbenos a{' '}
            <a
              href={`mailto:${LEGAL_CONFIG.supportEmail}`}
              className="font-semibold underline underline-offset-4"
            >
              {LEGAL_CONFIG.supportEmail}
            </a>{' '}
            o consulta nuestra{' '}
            <Link
              href="/legal/privacidad"
              className="font-semibold underline underline-offset-4"
            >
              Política de Privacidad
            </Link>
            .
          </span>
        </div>
      </ClauseCard>
    </LegalDocumentShell>
  )
}
