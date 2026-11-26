import { Database } from '@/types/database.types'

export type WorkOrderStatus = Database['public']['Enums']['order_status']

export const WORKORDER_STATUS_ORDER: WorkOrderStatus[] = [
  'received',
  'diagnosing',
  'waiting_approval',
  'in_progress',
  'testing',
  'ready',
  'delivered',
]

export const WORKORDER_STATUS_LABELS: Record<WorkOrderStatus, string> = {
  received: 'Recibida',
  diagnosing: 'Diagnosticando',
  waiting_approval: 'Esperando Aprobación',
  in_progress: 'En Reparación',
  testing: 'Control de Calidad',
  ready: 'Lista para Entrega',
  delivered: 'Entregada',
  cancelled: 'Cancelada',
}

export function getWorkOrderStatusLabel(status: string | null | undefined): string {
  if (!status) return 'Recibida'
  return WORKORDER_STATUS_LABELS[status as WorkOrderStatus] || status
}

export function normalizePlate(plate: string): string {
  return plate.replace(/\s+/g, '').toUpperCase()
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isValidUUID(value: string): boolean {
  return UUID_REGEX.test(value.trim())
}

export function parseMediaUrls(mediaUrls: unknown): string[] {
  if (!Array.isArray(mediaUrls)) return []
  return mediaUrls.filter((u): u is string => typeof u === 'string' && u.length > 0)
}

export const FUEL_LEVEL_LABELS: Record<string, string> = {
  empty: 'Vacío',
  low: '1/4',
  half: '1/2',
  high: '3/4',
  full: 'Lleno',
}

export function getFuelLevelLabel(level: string | null | undefined): string {
  if (!level) return 'No registrado'
  return FUEL_LEVEL_LABELS[level] || level
}
