export interface PricingPlan {
  id: 'inicial' | 'pro' | 'multisede'
  name: string
  tagline: string
  badge?: string
  popular?: boolean
  monthlyPriceCOP: number
  annualMonthlyPriceCOP: number
  usdApproxMonthly: string
  usdApproxAnnual: string
  ctaLabel: string
  ctaHref: string
  external?: boolean
  limits: string[]
  features: string[]
}

/**
 * Edita aquí el número de WhatsApp comercial de MotoTrack (formato internacional sin +)
 * y los montos de los planes para Colombia / LATAM.
 */
export const COMMERCIAL_WHATSAPP_URL =
  'https://wa.me/573000000000?text=Hola%20MotoTrack%2C%20quiero%20informaci%C3%B3n%20sobre%20los%20planes%20para%20mi%20taller.'

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'inicial',
    name: 'Taller Inicial',
    tagline: 'Ideal para talleres independientes que dejan atrás el cuaderno y el desorden.',
    monthlyPriceCOP: 119000,
    annualMonthlyPriceCOP: 82900,
    usdApproxMonthly: '~USD $28/mes',
    usdApproxAnnual: '~USD $20/mes',
    ctaLabel: 'Empezar Gratis 14 Días',
    ctaHref: '/login',
    limits: [
      '$2.800 COP diarios',
      '1 sede / taller',
      'Hasta 2 mecánicos + 1 recepción',
      'Hasta 60 órdenes al mes',
      '50 ítems en catálogo de repuestos',
    ],
    features: [
      'Recepción con fotos WebP y firma electrónica',
      'Tablero Kanban de estados en tiempo real',
      'Modo Mecánico "Manos Sucias" móvil',
      'Portal Live Tracker por enlace único (/track)',
      'Historial clínico por placa',
    ],
  },
  {
    id: 'pro',
    name: 'Taller Pro',
    tagline: 'Para talleres de alto flujo que quieren aprobaciones rápidas y marca propia.',
    badge: 'Más Popular',
    popular: true,
    monthlyPriceCOP: 219000,
    annualMonthlyPriceCOP: 152900,
    usdApproxMonthly: '~USD $52/mes',
    usdApproxAnnual: '~USD $37/mes',
    ctaLabel: 'Probar Taller Pro Gratis',
    ctaHref: '/login',
    limits: [
      '$7.300 COP diarios',
      '1 sede con personal ampliado',
      'Hasta 8 mecánicos + recepción ilimitada',
      'Órdenes de trabajo ilimitadas',
      'Catálogo de repuestos y mano de obra ilimitado',
    ],
    features: [
      'Todo lo incluido en Taller Inicial',
      'Micrositio de marca blanca (/t/tu-taller)',
      'Logo y color corporativo personalizado',
      'Presupuesto interactivo con enlace directo WhatsApp',
      'Soporte prioritario por WhatsApp',
    ],
  },
  {
    id: 'multisede',
    name: 'Multi-Sede',
    tagline: 'Control centralizado para redes de talleres, centros de servicio y concesionarios.',
    monthlyPriceCOP: 399000,
    annualMonthlyPriceCOP: 278900,
    usdApproxMonthly: '~USD $95/mes',
    usdApproxAnnual: '~USD $67/mes',
    ctaLabel: 'Hablar con Ventas',
    ctaHref: COMMERCIAL_WHATSAPP_URL,
    external: true,
    limits: [
      '$13.300 COP diarios',
      'Hasta 5 sedes independientes (aislamiento estricto)',
      'Mecánicos y usuarios administrativos ilimitados',
      'Órdenes y catálogos ilimitados por sede',
      'Subdominio o ruta de marca por cada sede',
    ],
    features: [
      'Todo lo incluido en Taller Pro',
      'Acompañamiento de migración de datos e inventario',
      'Capacitación en vivo para recepción y técnicos',
      'Gestión de accesos por rol (Admin / Recepción / Mecánico)',
      'Canal directo de soporte técnico dedicado',
    ],
  },
]

export function formatCOP(amount: number): string {
  return `$${amount.toLocaleString('es-CO')}`
}
