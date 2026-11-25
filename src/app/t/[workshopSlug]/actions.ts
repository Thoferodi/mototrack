'use server'

import { createAdminSupabaseClient } from '@/supabase/admin'
import { normalizePlate } from '@/lib/workorder-status'

export async function searchOrderByPlate(
  workshopId: string,
  plate: string,
  last4Phone: string
): Promise<{ success?: boolean; token?: string; error?: string }> {
  const trimmedPlate = plate.trim()
  const normalizedPlate = normalizePlate(plate)
  const cleanLast4 = last4Phone.replace(/\D/g, '')

  if (!workshopId) {
    return { error: 'Taller no especificado.' }
  }
  if (!normalizedPlate) {
    return { error: 'Ingresa la placa de tu motocicleta.' }
  }
  if (!/^\d{4}$/.test(cleanLast4)) {
    return { error: 'Ingresa exactamente los últimos 4 dígitos de tu celular.' }
  }

  const supabase = createAdminSupabaseClient()
  const plateVariants = Array.from(
    new Set([normalizedPlate, trimmedPlate.toUpperCase()])
  )

  const { data: motorcycles, error: motoError } = await supabase
    .from('motorcycles')
    .select(`
      id,
      customers (
        phone
      )
    `)
    .eq('workshop_id', workshopId)
    .in('plate', plateVariants)

  if (motoError || !motorcycles || motorcycles.length === 0) {
    return {
      error: 'No encontramos ninguna motocicleta con esa placa y los últimos 4 dígitos ingresados.',
    }
  }

  for (const motorcycle of motorcycles) {
    const customerPhone = (motorcycle.customers as { phone?: string | null } | null)?.phone || ''
    const cleanedPhone = customerPhone.replace(/\D/g, '')

    if (cleanedPhone.endsWith(cleanLast4)) {
      const { data: workOrder, error: orderError } = await supabase
        .from('workorders')
        .select('tracking_token')
        .eq('workshop_id', workshopId)
        .eq('motorcycle_id', motorcycle.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!orderError && workOrder?.tracking_token) {
        return { success: true, token: workOrder.tracking_token }
      }

      return { error: 'Tu vehículo está registrado, pero aún no tiene órdenes de trabajo.' }
    }
  }

  return {
    error: 'No encontramos ninguna orden que coincida con esa placa y los últimos 4 dígitos de tu celular.',
  }
}
