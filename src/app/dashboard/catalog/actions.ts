'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/supabase/server'

export interface CatalogItem {
  id: string
  name: string
  type: 'part' | 'labor'
  default_price: number
  sku?: string
  notes?: string
}

const catalogItemSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es requerido'),
  type: z.enum(['part', 'labor']),
  default_price: z.coerce.number().min(0, 'El precio no puede ser negativo'),
  sku: z.string().trim().optional(),
  notes: z.string().trim().optional(),
})

async function getWorkshopSettingsContext() {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('No autenticado')

  const { data: profile } = await supabase
    .from('profiles')
    .select('workshop_id')
    .eq('id', user.id)
    .single()

  if (!profile) throw new Error('Perfil no encontrado')

  const { data: workshop, error } = await supabase
    .from('workshops')
    .select('id, settings')
    .eq('id', profile.workshop_id)
    .single()

  if (error || !workshop) throw new Error('Taller no encontrado')

  const currentSettings =
    workshop.settings && typeof workshop.settings === 'object' && !Array.isArray(workshop.settings)
      ? (workshop.settings as Record<string, any>)
      : {}

  const catalog: CatalogItem[] = Array.isArray(currentSettings.catalog)
    ? currentSettings.catalog
    : []

  return { supabase, workshopId: workshop.id, currentSettings, catalog }
}

async function saveCatalog(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  workshopId: string,
  currentSettings: Record<string, any>,
  catalog: CatalogItem[]
) {
  const { error } = await supabase
    .from('workshops')
    .update({
      settings: {
        ...currentSettings,
        catalog,
      },
    })
    .eq('id', workshopId)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/catalog')
  revalidatePath('/dashboard/orders/[id]', 'page')
}

export async function createCatalogItem(input: {
  name: string
  type: 'part' | 'labor'
  default_price: number
  sku?: string
  notes?: string
}) {
  const parsed = catalogItemSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Datos inválidos' }
  }

  try {
    const { supabase, workshopId, currentSettings, catalog } = await getWorkshopSettingsContext()
    const newItem: CatalogItem = {
      id: crypto.randomUUID(),
      name: parsed.data.name,
      type: parsed.data.type,
      default_price: parsed.data.default_price,
      sku: parsed.data.sku || '',
      notes: parsed.data.notes || '',
    }

    const updatedCatalog = [newItem, ...catalog]
    await saveCatalog(supabase, workshopId, currentSettings, updatedCatalog)
    return { success: true, item: newItem }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error al crear el ítem' }
  }
}

export async function updateCatalogItem(
  itemId: string,
  input: {
    name: string
    type: 'part' | 'labor'
    default_price: number
    sku?: string
    notes?: string
  }
) {
  const parsed = catalogItemSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Datos inválidos' }
  }

  try {
    const { supabase, workshopId, currentSettings, catalog } = await getWorkshopSettingsContext()
    const exists = catalog.some((item) => item.id === itemId)
    if (!exists) {
      return { success: false, error: 'El ítem no existe en el catálogo' }
    }

    const updatedCatalog = catalog.map((item) =>
      item.id === itemId
        ? {
            ...item,
            name: parsed.data.name,
            type: parsed.data.type,
            default_price: parsed.data.default_price,
            sku: parsed.data.sku || '',
            notes: parsed.data.notes || '',
          }
        : item
    )

    await saveCatalog(supabase, workshopId, currentSettings, updatedCatalog)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error al actualizar el ítem' }
  }
}

export async function deleteCatalogItem(itemId: string) {
  try {
    const { supabase, workshopId, currentSettings, catalog } = await getWorkshopSettingsContext()
    const updatedCatalog = catalog.filter((item) => item.id !== itemId)
    await saveCatalog(supabase, workshopId, currentSettings, updatedCatalog)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error al eliminar el ítem' }
  }
}
