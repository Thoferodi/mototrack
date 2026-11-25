'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/supabase/server'
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

const STAFF_ROLES = new Set(['owner', 'manager', 'admin', 'receptionist'])

function isMissingCatalogTableError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  return (
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    Boolean(error.message?.toLowerCase().includes('catalog_items'))
  )
}

async function getAuthorizedCatalogContext() {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('workshop_id, role')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.workshop_id) {
    throw new Error('Perfil de taller no encontrado')
  }

  if (!STAFF_ROLES.has(String(profile.role))) {
    throw new Error('No tienes permisos para modificar el catálogo')
  }

  return { supabase, workshopId: profile.workshop_id }
}

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

  try {
    const { supabase, workshopId } = await getAuthorizedCatalogContext()
    const { data, error } = await supabase
      .from('catalog_items')
      .insert({
        workshop_id: workshopId,
        name: parsed.data.name,
        type: parsed.data.type,
        default_price: parsed.data.default_price,
        sku: parsed.data.sku || null,
        notes: parsed.data.notes || null,
      })
      .select('id, name, type, default_price, sku, notes')
      .single()

    if (error) {
      if (isMissingCatalogTableError(error)) {
        return {
          success: false,
          error:
            'Falta crear la tabla catalog_items en Supabase. Ejecuta supabase/catalog_items.sql en el SQL Editor.',
        }
      }
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/catalog')
    revalidatePath('/dashboard/orders/[id]', 'page')

    return {
      success: true,
      item: {
        id: data.id,
        name: data.name,
        type: data.type,
        default_price: Number(data.default_price ?? 0),
        sku: data.sku || undefined,
        notes: data.notes || undefined,
      },
    }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error al crear el ítem' }
  }
}

export async function updateCatalogItem(
  itemId: string,
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

  try {
    const { supabase, workshopId } = await getAuthorizedCatalogContext()
    const { data, error } = await supabase
      .from('catalog_items')
      .update({
        name: parsed.data.name,
        type: parsed.data.type,
        default_price: parsed.data.default_price,
        sku: parsed.data.sku || null,
        notes: parsed.data.notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', itemId)
      .eq('workshop_id', workshopId)
      .select('id')
      .maybeSingle()

    if (error) {
      if (isMissingCatalogTableError(error)) {
        return {
          success: false,
          error:
            'Falta crear la tabla catalog_items en Supabase. Ejecuta supabase/catalog_items.sql en el SQL Editor.',
        }
      }
      return { success: false, error: error.message }
    }

    if (!data) {
      return { success: false, error: 'El ítem no existe en tu catálogo.' }
    }

    revalidatePath('/dashboard/catalog')
    revalidatePath('/dashboard/orders/[id]', 'page')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error al actualizar el ítem' }
  }
}

export async function deleteCatalogItem(
  itemId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { supabase, workshopId } = await getAuthorizedCatalogContext()
    const { data, error } = await supabase
      .from('catalog_items')
      .delete()
      .eq('id', itemId)
      .eq('workshop_id', workshopId)
      .select('id')
      .maybeSingle()

    if (error) {
      if (isMissingCatalogTableError(error)) {
        return {
          success: false,
          error:
            'Falta crear la tabla catalog_items en Supabase. Ejecuta supabase/catalog_items.sql en el SQL Editor.',
        }
      }
      return { success: false, error: error.message }
    }

    if (!data) {
      return { success: false, error: 'El ítem no existe en tu catálogo.' }
    }

    revalidatePath('/dashboard/catalog')
    revalidatePath('/dashboard/orders/[id]', 'page')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error al eliminar el ítem' }
  }
}
