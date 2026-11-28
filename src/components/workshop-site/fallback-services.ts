import type { PublicServiceItem, ServiceCategoryKey } from './types'

export const CURATED_FALLBACK_SERVICES: PublicServiceItem[] = [
  {
    id: 'fallback-preventive',
    name: 'Mantenimiento Preventivo',
    description:
      'Cambio de aceite, revisión de niveles, tensión y lubricación de cadena, guayas y chequeo integral de seguridad.',
    default_price: null,
    sku: null,
    isFallback: true,
    categoryKey: 'preventive',
  },
  {
    id: 'fallback-injection',
    name: 'Sincronización e Inyección',
    description:
      'Limpieza de inyectores o carburador, calibración de cuerpo de aceleración, filtro de aire y bujía.',
    default_price: null,
    sku: null,
    isFallback: true,
    categoryKey: 'injection',
  },
  {
    id: 'fallback-brakes',
    name: 'Sistema de Frenos',
    description:
      'Inspección de discos, pastillas o bandas, limpieza de mordazas y purga de líquido hidráulico.',
    default_price: null,
    sku: null,
    isFallback: true,
    categoryKey: 'brakes',
  },
  {
    id: 'fallback-suspension',
    name: 'Suspensión y Dirección',
    description:
      'Mantenimiento de barras telescópicas, cambio de retenedores, aceite hidráulico y ajuste de cunas.',
    default_price: null,
    sku: null,
    isFallback: true,
    categoryKey: 'suspension',
  },
  {
    id: 'fallback-drivetrain',
    name: 'Kit de Arrastre y Transmisión',
    description:
      'Reemplazo de piñón, catalina y cadena con alineación de rueda trasera y torque recomendado.',
    default_price: null,
    sku: null,
    isFallback: true,
    categoryKey: 'drivetrain',
  },
  {
    id: 'fallback-electrical',
    name: 'Diagnóstico Eléctrico',
    description:
      'Revisión de batería, regulador, estator, encendido, ramal eléctrico y lectura de códigos de falla.',
    default_price: null,
    sku: null,
    isFallback: true,
    categoryKey: 'electrical',
  },
]

export function inferServiceCategory(name: string): ServiceCategoryKey {
  const lower = name.toLowerCase()
  if (/(freno|pastilla|disco|mordaza|abs|dot4)/.test(lower)) return 'brakes'
  if (/(sincron|inyec|carbur|bujía|bujia|aceler)/.test(lower)) return 'injection'
  if (/(suspens|barra|retén|reten|direcc|cuna|amortigu)/.test(lower)) return 'suspension'
  if (/(arrastre|cadena|piñón|pinon|catalina|transmisi|embrague|clutch)/.test(lower)) {
    return 'drivetrain'
  }
  if (/(eléctr|electr|batería|bateria|escáner|escaner|obd|estator|luces)/.test(lower)) {
    return 'electrical'
  }
  if (/(prevent|aceite|general|revisión|revision|alistamiento)/.test(lower)) {
    return 'preventive'
  }
  return 'general'
}
