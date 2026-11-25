'use server'

import { createServerSupabaseClient } from '@/supabase/server'

export async function globalSearchOrder(
  searchQuery: string,
  last4Phone?: string
) {
  const supabase = createServerSupabaseClient()
  const cleanQuery = searchQuery.trim()

  // 1. Intentar buscar por Tracking Token (UUID)
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanQuery)
  
  if (isUUID) {
    const { data: workOrder, error } = await supabase
      .from('workorders')
      .select('tracking_token')
      .eq('tracking_token', cleanQuery)
      .single()

    if (workOrder) {
      return { success: true, token: workOrder.tracking_token }
    }
  }

  // 2. Si no es UUID o no se encontró, buscar por Placa
  // Para buscar por placa globalmente, necesitamos los últimos 4 dígitos del teléfono por seguridad
  if (!last4Phone || last4Phone.length !== 4) {
    return { error: 'Si buscas por placa, debes ingresar los últimos 4 dígitos de tu celular.' }
  }

  // Buscar motos con esa placa
  const { data: motorcycles, error: motoError } = await supabase
    .from('motorcycles')
    .select(`
      id,
      customers (
        phone
      )
    `)
    .eq('plate', cleanQuery.toUpperCase())
    .order('created_at', { ascending: false })

  if (motoError || !motorcycles || motorcycles.length === 0) {
    return { error: 'No se encontró ninguna orden con esos datos.' }
  }

  // Validar teléfono en las coincidencias (podría haber la misma placa en diferentes talleres, aunque raro)
  let foundToken: string | null = null

  for (const moto of motorcycles) {
    const customerPhone = (moto.customers as any)?.phone || ''
    const cleanedPhone = customerPhone.replace(/\D/g, '')
    
    if (cleanedPhone.endsWith(last4Phone)) {
      // Buscar la orden más reciente para esta moto
      const { data: workOrder } = await supabase
        .from('workorders')
        .select('tracking_token')
        .eq('motorcycle_id', moto.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (workOrder) {
        foundToken = workOrder.tracking_token
        break
      }
    }
  }

  if (foundToken) {
    return { success: true, token: foundToken }
  }

  return { error: 'No se encontró ninguna orden que coincida con los datos proporcionados.' }
}
