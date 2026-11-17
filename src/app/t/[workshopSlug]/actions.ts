'use server'

import { createServerSupabaseClient } from '@/supabase/server'
import { redirect } from 'next/navigation'

export async function searchOrderByPlate(
  workshopId: string,
  plate: string,
  last4Phone: string
) {
  const supabase = createServerSupabaseClient()

  // 1. Buscar la moto por placa en este taller
  const { data: motorcycle, error: motoError } = await supabase
    .from('motorcycles')
    .select(`
      id,
      customers (
        phone
      )
    `)
    .eq('workshop_id', workshopId)
    .eq('plate', plate.toUpperCase().trim())
    .single()

  if (motoError || !motorcycle) {
    return { error: 'No se encontró ninguna orden con esos datos.' }
  }

  // 2. Validar los últimos 4 dígitos del teléfono para privacidad
  const customerPhone = (motorcycle.customers as any)?.phone || ''
  const cleanedPhone = customerPhone.replace(/\D/g, '')
  
  if (!cleanedPhone.endsWith(last4Phone)) {
    return { error: 'No se encontró ninguna orden con esos datos.' }
  }

  // 3. Buscar la orden de trabajo más reciente para esa moto
  const { data: workOrder, error: orderError } = await supabase
    .from('workorders')
    .select('tracking_token')
    .eq('motorcycle_id', motorcycle.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (orderError || !workOrder) {
    return { error: 'No hay órdenes activas para este vehículo.' }
  }

  // 4. Devolver el token para la redirección (la redirección se maneja en el cliente)
  return { success: true, token: workOrder.tracking_token }
}
