'use server'

import { createAdminSupabaseClient } from '@/supabase/admin'
import { normalizePlate } from '@/lib/workorder-status'
import { sanitizePostgrestSearch } from '@/lib/sanitize'
import { headers } from 'next/headers'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { isValidUUID } from '@/lib/workorder-status'

// Rate limiting para búsquedas públicas del micrositio
const SEARCH_WINDOW_MS = 60 * 1000
const SEARCH_MAX_REQUESTS = 15

export async function searchOrderByPlate(
  workshopId: string,
  plate: string,
  last4Phone: string
): Promise<{ success?: boolean; token?: string; error?: string }> {
  // Rate limiting por IP
  const headersList = headers()
  const clientIp = getClientIp(headersList as unknown as Headers)
  const rateLimitCheck = checkRateLimit({
    action: 'search_plate',
    identifier: clientIp,
    limit: SEARCH_MAX_REQUESTS,
    windowMs: SEARCH_WINDOW_MS,
  })

  if (!rateLimitCheck.allowed) {
    return { error: 'Demasiadas búsquedas. Por favor espera un momento antes de intentar de nuevo.' }
  }

  if (!workshopId || !isValidUUID(workshopId)) {
    return { error: 'Taller no especificado.' }
  }

  const sanitizedPlate = sanitizePostgrestSearch(plate)
  const normalizedPlate = normalizePlate(sanitizedPlate)
  const cleanLast4 = last4Phone.replace(/\D/g, '')

  if (!normalizedPlate) {
    return { error: 'Ingresa la placa de tu motocicleta.' }
  }
  if (!/^\d{4}$/.test(cleanLast4)) {
    return { error: 'Ingresa exactamente los últimos 4 dígitos de tu celular.' }
  }

  const supabase = createAdminSupabaseClient()
  const plateVariants = Array.from(
    new Set([normalizedPlate, sanitizedPlate.toUpperCase()])
  )

  const { data: motorcycles, error: motoError } = await supabase
    .from('motorcycles')
    .select(`
      id,
      customers (
        phone_whatsapp
      )
    `)
    .eq('workshop_id', workshopId)
    .in('license_plate', plateVariants)

  if (motoError || !motorcycles || motorcycles.length === 0) {
    return {
      error: 'No encontramos ninguna motocicleta con esa placa y los últimos 4 dígitos ingresados.',
    }
  }

  for (const motorcycle of motorcycles) {
    const customerPhone =
      (motorcycle.customers as { phone_whatsapp?: string | null } | null)?.phone_whatsapp || ''
    const cleanedPhone = customerPhone.replace(/\D/g, '')

    if (cleanedPhone.endsWith(cleanLast4)) {
      const { data: workOrder, error: orderError } = await supabase
        .from('work_orders')
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
