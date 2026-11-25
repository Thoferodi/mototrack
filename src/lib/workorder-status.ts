import { Database } from '@/types/database.types'

export type WorkOrderStatus = Database['public']['Enums']['workorder_status']

export const WORKORDER_STATUS_ORDER: WorkOrderStatus[] = [
  'received',
  'diagnosing',
  'waiting_approval',
  'in_repair',
  'quality_check',
  'ready_for_pickup',
  'delivered',
]

export const WORKORDER_STATUS_LABELS: Record<WorkOrderStatus, string> = {
  received: 'Recibida',
  diagnosing: 'Diagnosticando',
  waiting_approval: 'Esperando Aprobación',
  in_repair: 'En Reparación',
  quality_check: 'Control de Calidad',
  ready_for_pickup: 'Lista para Entrega',
  delivered: 'Entregada',
}

export function getWorkOrderStatusLabel(status: string): string {
  return WORKORDER_STATUS_LABELS[status as WorkOrderStatus] || status
}

export function normalizePlate(plate: string): string {
  return plate.replace(/\s+/g, '').toUpperCase()
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isValidUUID(value: string): boolean {
  return UUID_REGEX.test(value.trim())
}
