'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/supabase/server'
import { isValidUUID, normalizePlate } from '@/lib/workorder-status'
import { sanitizeText } from '@/lib/sanitize'

const STAFF_ROLES = new Set(['owner', 'admin', 'manager', 'receptionist'])

const vehicleSchema = z.object({
  license_plate: z
    .string()
    .trim()
    .min(1, 'La placa es requerida')
    .max(20, 'La placa es demasiado larga'),
  brand: z
    .string()
    .trim()
    .min(1, 'La marca es requerida')
    .max(80, 'La marca es demasiado larga'),
  model: z
    .string()
    .trim()
    .min(1, 'El modelo es requerido')
    .max(80, 'El modelo es demasiado largo'),
  year: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : Number(val)),
    z.number().int('Año inválido').min(1950).max(2100).optional()
  ),
  customer_id: z.string().optional(),
  customer_name: z.string().trim().max(120, 'El nombre es demasiado largo').optional(),
  customer_phone: z.string().trim().max(30, 'El teléfono es demasiado largo').optional(),
})

async function getWorkshopContext() {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado.')

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('workshop_id, role, active')
    .eq('id', user.id)
    .single()

  if (error || !profile || !profile.workshop_id) {
    throw new Error('Perfil de taller no encontrado.')
  }
  if (profile.active === false) {
    throw new Error('Tu cuenta está desactivada.')
  }
  if (!STAFF_ROLES.has(String(profile.role))) {
    throw new Error('No tienes permisos para administrar vehículos.')
  }
  return { supabase, workshopId: profile.workshop_id }
}

export async function createVehicle(input: {
  license_plate: string
  brand: string
  model: string
  year?: number | string
  customer_id?: string
  customer_name?: string
  customer_phone?: string
}) {
  const parsed = vehicleSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Datos inválidos' }
  }

  try {
    const { supabase, workshopId } = await getWorkshopContext()
    const normalizedPlate = normalizePlate(sanitizeText(parsed.data.license_plate, 20))
    const cleanBrand = sanitizeText(parsed.data.brand, 80)
    const cleanModel = sanitizeText(parsed.data.model, 80)

    if (!normalizedPlate || !cleanBrand || !cleanModel) {
      return { success: false, error: 'Placa, marca y modelo son obligatorios.' }
    }

    const { data: existingPlate } = await supabase
      .from('motorcycles')
      .select('id')
      .eq('workshop_id', workshopId)
      .eq('license_plate', normalizedPlate)
      .maybeSingle()

    if (existingPlate) {
      return {
        success: false,
        error: `Ya existe un vehículo registrado con la placa ${normalizedPlate}.`,
      }
    }

    let customerId = parsed.data.customer_id?.trim()
    if (customerId) {
      if (!isValidUUID(customerId)) {
        return { success: false, error: 'Identificador de cliente inválido.' }
      }
      const { data: validCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('id', customerId)
        .eq('workshop_id', workshopId)
        .maybeSingle()

      if (!validCustomer) {
        return { success: false, error: 'El cliente seleccionado no pertenece a este taller.' }
      }
      customerId = validCustomer.id
    } else {
      const cleanName = sanitizeText(parsed.data.customer_name || '', 120)
      const cleanPhone = sanitizeText(parsed.data.customer_phone || '', 30)
      if (!cleanName) {
        return {
          success: false,
          error: 'Selecciona un cliente o ingresa el nombre del propietario.',
        }
      }
      if (!cleanPhone) {
        return {
          success: false,
          error: 'El número de WhatsApp del propietario es requerido.',
        }
      }
      const { data: newCustomer, error: custError } = await supabase
        .from('customers')
        .insert({
          workshop_id: workshopId,
          full_name: cleanName,
          phone_whatsapp: cleanPhone,
        })
        .select('id')
        .single()

      if (custError || !newCustomer) {
        console.error('[vehicles] Error creating customer:', custError?.code)
        return { success: false, error: 'No se pudo registrar al propietario.' }
      }
      customerId = newCustomer.id
    }

    const { error } = await supabase.from('motorcycles').insert({
      workshop_id: workshopId,
      customer_id: customerId,
      license_plate: normalizedPlate,
      brand: cleanBrand,
      model: cleanModel,
      year: parsed.data.year ?? null,
    })

    if (error) {
      console.error('[vehicles] Error creating vehicle:', error.code)
      return { success: false, error: 'No se pudo registrar el vehículo.' }
    }

    revalidatePath('/dashboard/vehicles')
    revalidatePath('/dashboard/orders')
    return { success: true }
  } catch (err: unknown) {
    console.error('[vehicles] Unexpected error in createVehicle:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al registrar el vehículo.',
    }
  }
}

export async function updateVehicle(
  vehicleId: string,
  input: {
    license_plate: string
    brand: string
    model: string
    year?: number | string
    customer_id?: string
    customer_name?: string
    customer_phone?: string
  }
) {
  if (!isValidUUID(vehicleId)) {
    return { success: false, error: 'Identificador de vehículo inválido.' }
  }

  const parsed = vehicleSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Datos inválidos' }
  }

  try {
    const { supabase, workshopId } = await getWorkshopContext()
    const normalizedPlate = normalizePlate(sanitizeText(parsed.data.license_plate, 20))
    const cleanBrand = sanitizeText(parsed.data.brand, 80)
    const cleanModel = sanitizeText(parsed.data.model, 80)

    const { data: duplicate } = await supabase
      .from('motorcycles')
      .select('id')
      .eq('workshop_id', workshopId)
      .eq('license_plate', normalizedPlate)
      .neq('id', vehicleId)
      .maybeSingle()

    if (duplicate) {
      return { success: false, error: `Otro vehículo ya tiene la placa ${normalizedPlate}.` }
    }

    const customerId = parsed.data.customer_id?.trim()
    if (customerId) {
      if (!isValidUUID(customerId)) {
        return { success: false, error: 'Identificador de cliente inválido.' }
      }
      const { data: validCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('id', customerId)
        .eq('workshop_id', workshopId)
        .maybeSingle()

      if (!validCustomer) {
        return { success: false, error: 'El cliente asociado no pertenece a este taller.' }
      }

      const cleanName = sanitizeText(parsed.data.customer_name || '', 120)
      const cleanPhone = sanitizeText(parsed.data.customer_phone || '', 30)
      if (cleanName) {
        await supabase
          .from('customers')
          .update({
            full_name: cleanName,
            ...(cleanPhone ? { phone_whatsapp: cleanPhone } : {}),
          })
          .eq('id', validCustomer.id)
          .eq('workshop_id', workshopId)
      }
    }

    const { error } = await supabase
      .from('motorcycles')
      .update({
        license_plate: normalizedPlate,
        brand: cleanBrand,
        model: cleanModel,
        year: parsed.data.year ?? null,
        ...(customerId ? { customer_id: customerId } : {}),
      })
      .eq('id', vehicleId)
      .eq('workshop_id', workshopId)

    if (error) {
      console.error('[vehicles] Error updating vehicle:', error.code)
      return { success: false, error: 'No se pudo actualizar el vehículo.' }
    }

    revalidatePath('/dashboard/vehicles')
    revalidatePath('/dashboard/orders')
    return { success: true }
  } catch (err: unknown) {
    console.error('[vehicles] Unexpected error in updateVehicle:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al actualizar el vehículo.',
    }
  }
}

export async function deleteVehicle(vehicleId: string) {
  if (!isValidUUID(vehicleId)) {
    return { success: false, error: 'Identificador de vehículo inválido.' }
  }

  try {
    const { supabase, workshopId } = await getWorkshopContext()

    const { count } = await supabase
      .from('work_orders')
      .select('id', { count: 'exact', head: true })
      .eq('motorcycle_id', vehicleId)
      .eq('workshop_id', workshopId)

    if (count && count > 0) {
      return {
        success: false,
        error: `No se puede eliminar porque tiene ${count} orden(es) de trabajo en su historial clínico.`,
      }
    }

    const { error } = await supabase
      .from('motorcycles')
      .delete()
      .eq('id', vehicleId)
      .eq('workshop_id', workshopId)

    if (error) {
      console.error('[vehicles] Error deleting vehicle:', error.code)
      return { success: false, error: 'No se pudo eliminar el vehículo.' }
    }

    revalidatePath('/dashboard/vehicles')
    return { success: true }
  } catch (err: unknown) {
    console.error('[vehicles] Unexpected error in deleteVehicle:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al eliminar el vehículo.',
    }
  }
}
