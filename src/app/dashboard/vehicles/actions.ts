'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/supabase/server'

const vehicleSchema = z.object({
  plate: z.string().trim().min(1, 'La placa es requerida'),
  make: z.string().trim().min(1, 'La marca es requerida'),
  model: z.string().trim().min(1, 'El modelo es requerido'),
  year: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : Number(val)),
    z.number().int('Año inválido').min(1950).max(2100).optional()
  ),
  color: z.string().trim().optional(),
  vin: z.string().trim().optional(),
  engine_number: z.string().trim().optional(),
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

  if (!profile) throw new Error('Perfil no encontrado')
  return { supabase, workshopId: profile.workshop_id }
}

export async function createVehicle(input: {
  plate: string
  make: string
  model: string
  year?: number | string
  color?: string
  vin?: string
  engine_number?: string
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
    const normalizedPlate = parsed.data.plate.toUpperCase()

    // Verificar placa duplicada en el taller
    const { data: existingPlate } = await supabase
      .from('motorcycles')
      .select('id')
      .eq('workshop_id', workshopId)
      .eq('plate', normalizedPlate)
      .maybeSingle()

    if (existingPlate) {
      return { success: false, error: `Ya existe un vehículo registrado con la placa ${normalizedPlate}.` }
    }

    let customerId = parsed.data.customer_id?.trim()
    if (!customerId) {
      if (!parsed.data.customer_name) {
        return { success: false, error: 'Selecciona un cliente o ingresa el nombre del propietario.' }
      }
      const { data: newCustomer, error: custError } = await supabase
        .from('customers')
        .insert({
          workshop_id: workshopId,
          full_name: parsed.data.customer_name,
          phone: parsed.data.customer_phone || null,
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
      plate: normalizedPlate,
      make: parsed.data.make,
      model: parsed.data.model,
      year: parsed.data.year ?? null,
      color: parsed.data.color || null,
      vin: parsed.data.vin || null,
      engine_number: parsed.data.engine_number || null,
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
    plate: string
    make: string
    model: string
    year?: number | string
    color?: string
    vin?: string
    engine_number?: string
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
    const normalizedPlate = parsed.data.plate.toUpperCase()

    const { data: duplicate } = await supabase
      .from('motorcycles')
      .select('id')
      .eq('workshop_id', workshopId)
      .eq('plate', normalizedPlate)
      .neq('id', vehicleId)
      .maybeSingle()

    if (duplicate) {
      return { success: false, error: `Otro vehículo ya tiene la placa ${normalizedPlate}.` }
    }

    let customerId = parsed.data.customer_id?.trim()
    if (customerId && parsed.data.customer_name) {
      await supabase
        .from('customers')
        .update({
          full_name: parsed.data.customer_name,
          phone: parsed.data.customer_phone || null,
        })
        .eq('id', customerId)
        .eq('workshop_id', workshopId)
    }

    const { error } = await supabase
      .from('motorcycles')
      .update({
        plate: normalizedPlate,
        make: parsed.data.make,
        model: parsed.data.model,
        year: parsed.data.year ?? null,
        color: parsed.data.color || null,
        vin: parsed.data.vin || null,
        engine_number: parsed.data.engine_number || null,
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
      .from('workorders')
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
