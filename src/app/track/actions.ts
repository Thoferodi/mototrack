'use server'

import { createAdminSupabaseClient } from '@/supabase/admin'
import { isValidUUID, normalizePlate } from '@/lib/workorder-status'
import { sanitizePostgrestSearch } from '@/lib/sanitize'
import { headers } from 'next/headers'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

// Rate limiting para búsquedas públicas: máx 15 por minuto por IP
const SEARCH_WINDOW_MS = 60 * 1000
const SEARCH_MAX_REQUESTS = 15

export async function globalSearchOrder(
  searchQuery: string,
  last4Phone?: string,
  searchType?: 'plate' | 'token',
  workshopId?: string
): Promise<{ success?: boolean; token?: string; error?: string }> {
  // Rate limiting por IP
  const headersList = headers()
  const clientIp = getClientIp(headersList as unknown as Headers)
  const rateLimitCheck = checkRateLimit({
    action: 'search_order',
    identifier: clientIp,
    limit: SEARCH_MAX_REQUESTS,
    windowMs: SEARCH_WINDOW_MS,
  })

  if (!rateLimitCheck.allowed) {
    return { error: 'Demasiadas búsquedas. Por favor espera un momento antes de intentar de nuevo.' }
  }

  if (workshopId && !isValidUUID(workshopId)) {
    return { error: 'Identificador de taller inválido.' }
  }

  const cleanQuery = sanitizePostgrestSearch(searchQuery)
  if (!cleanQuery) {
    return { error: 'Ingresa una placa o código de seguimiento.' }
  }

  const supabase = createAdminSupabaseClient()

  // 1. Búsqueda por código de seguimiento (UUID)
  if (searchType === 'token' || isValidUUID(cleanQuery)) {
    if (!isValidUUID(cleanQuery)) {
      return {
        error: 'El código de seguimiento no es válido. Debe tener el formato UUID enviado por tu taller.',
      }
    }

    let tokenQuery = supabase
      .from('work_orders')
      .select('tracking_token')
      .eq('tracking_token', cleanQuery)

    if (workshopId) {
      tokenQuery = tokenQuery.eq('workshop_id', workshopId)
    }

    const { data: workOrder, error } = await tokenQuery.maybeSingle()

    if (!error && workOrder?.tracking_token) {
      return { success: true, token: workOrder.tracking_token }
    }

    return {
      error: 'No se encontró ninguna orden con ese código de seguimiento.',
    }
  }

  // 2. Búsqueda por placa + últimos 4 dígitos del celular
  const cleanLast4 = (last4Phone || '').replace(/\D/g, '')
  if (!/^\d{4}$/.test(cleanLast4)) {
    return {
      error: 'Si buscas por placa, debes ingresar los últimos 4 dígitos de tu celular.',
    }
  }

  const normalizedPlate = normalizePlate(cleanQuery)
  if (!normalizedPlate) {
    return { error: 'Ingresa una placa válida.' }
  }

  const plateVariants = Array.from(
    new Set([normalizedPlate, cleanQuery.toUpperCase()])
  )

  let motoQuery = supabase
    .from('motorcycles')
    .select(`
      id,
      workshop_id,
      customers (
        phone_whatsapp
      )
    `)
    .in('license_plate', plateVariants)

  if (workshopId && isValidUUID(workshopId)) {
    motoQuery = motoQuery.eq('workshop_id', workshopId)
  }

  const { data: motorcycles, error: motoError } = await motoQuery

  if (motoError || !motorcycles || motorcycles.length === 0) {
    return { error: 'No se encontró ninguna orden con esa placa y teléfono.' }
  }

  for (const moto of motorcycles) {
    const customerPhone =
      (moto.customers as { phone_whatsapp?: string | null } | null)?.phone_whatsapp || ''
    const cleanedPhone = customerPhone.replace(/\D/g, '')

    if (cleanedPhone.endsWith(cleanLast4)) {
      const { data: workOrder } = await supabase
        .from('work_orders')
        .select('tracking_token')
        .eq('motorcycle_id', moto.id)
        .eq('workshop_id', moto.workshop_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (workOrder?.tracking_token) {
        return { success: true, token: workOrder.tracking_token }
      }
    }
  }

  return {
    error: 'No encontramos ninguna orden que coincida con esa placa y los últimos 4 dígitos de tu celular.',
  }
}
