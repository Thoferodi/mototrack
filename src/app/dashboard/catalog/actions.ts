'use server'

import { z } from 'zod'
import { Database } from '@/types/database.types'

export type CatalogItemType = Database['public']['Enums']['item_type']

export interface CatalogItem {
  id: string
  name: string
  type: CatalogItemType
  default_price: number
  sku?: string
  notes?: string
}

const catalogItemSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es requerido'),
  type: z.enum(['spare_part', 'labor']),
  default_price: z.coerce.number().min(0, 'El precio no puede ser negativo'),
  sku: z.string().trim().optional(),
  notes: z.string().trim().optional(),
})

const CATALOG_NOT_PERSISTED_MSG =
  'La base de datos actual no incluye columna settings ni tabla catalog_items. Los ítems agregados en órdenes de trabajo aparecen aquí automáticamente.'

export async function createCatalogItem(input: {
  name: string
  type: CatalogItemType
  default_price: number
  sku?: string
  notes?: string
}): Promise<{ success: boolean; item?: CatalogItem; error?: string }> {
  const parsed = catalogItemSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Datos inválidos' }
  }
  return { success: false, error: CATALOG_NOT_PERSISTED_MSG }
}

export async function updateCatalogItem(
  _itemId: string,
  input: {
    name: string
    type: CatalogItemType
    default_price: number
    sku?: string
    notes?: string
  }
): Promise<{ success: boolean; error?: string }> {
  const parsed = catalogItemSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Datos inválidos' }
  }
  return { success: false, error: CATALOG_NOT_PERSISTED_MSG }
}

export async function deleteCatalogItem(
  _itemId: string
): Promise<{ success: boolean; error?: string }> {
  return { success: false, error: CATALOG_NOT_PERSISTED_MSG }
}
