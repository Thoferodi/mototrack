'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/supabase/server'
import { normalizePlate } from '@/lib/workorder-status'

const vehicleSchema = z.object({
  license_plate: z.string().trim().min(1, 'La placa es requerida'),
  brand: z.string().trim().min(1, 'La marca es requerida'),
  model: z.string().trim().min(1, 'El modelo es requerido'),
  year: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : Number(val)),
    z.number().int('Año inválido').min(1950).max(2100).optional()
  ),
  customer_id: z.string().optional(),
  customer_name: z.string().trim().optional(),
  customer_phone: z.string().trim().optional(),
})

async function getWorkshopContext() {
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

  if (!profile || !profile.workshop_id) throw new Error('Perfil de taller no encontrado')
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
    const normalizedPlate = normalizePlate(parsed.data.license_plate)

    // Verificar placa duplicada en el taller
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
    if (!customerId) {
      if (!parsed.data.customer_name) {
        return {
          success: false,
          error: 'Selecciona un cliente o ingresa el nombre del propietario.',
        }
      }
      if (!parsed.data.customer_phone) {
        return {
          success: false,
          error: 'El número de WhatsApp del propietario es requerido.',
        }
      }
      const { data: newCustomer, error: custError } = await supabase
        .from('customers')
        .insert({
          workshop_id: workshopId,
          full_name: parsed.data.customer_name,
          phone_whatsapp: parsed.data.customer_phone,
        })
        .select('id')
        .single()

      if (custError || !newCustomer) {
        return { success: false, error: custError?.message || 'Error al registrar cliente.' }
      }
      customerId = newCustomer.id
    }

    const { error } = await supabase.from('motorcycles').insert({
      workshop_id: workshopId,
      customer_id: customerId,
      license_plate: normalizedPlate,
      brand: parsed.data.brand,
      model: parsed.data.model,
      year: parsed.data.year ?? null,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/vehicles')
    revalidatePath('/dashboard/orders')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error al registrar el vehículo.' }
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
  const parsed = vehicleSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Datos inválidos' }
  }

  try {
    const { supabase, workshopId } = await getWorkshopContext()
    const normalizedPlate = normalizePlate(parsed.data.license_plate)

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
    if (customerId && parsed.data.customer_name) {
      await supabase
        .from('customers')
        .update({
          full_name: parsed.data.customer_name,
          ...(parsed.data.customer_phone ? { phone_whatsapp: parsed.data.customer_phone } : {}),
        })
        .eq('id', customerId)
        .eq('workshop_id', workshopId)
    }

    const { error } = await supabase
      .from('motorcycles')
      .update({
        license_plate: normalizedPlate,
        brand: parsed.data.brand,
        model: parsed.data.model,
        year: parsed.data.year ?? null,
        ...(customerId ? { customer_id: customerId } : {}),
      })
      .eq('id', vehicleId)
      .eq('workshop_id', workshopId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/vehicles')
    revalidatePath('/dashboard/orders')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error al actualizar el vehículo.' }
  }
}

export async function deleteVehicle(vehicleId: string) {
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
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/vehicles')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error al eliminar el vehículo.' }
  }
}
