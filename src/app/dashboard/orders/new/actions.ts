'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { createServerSupabaseClient } from '@/supabase/server'
import { FUEL_LEVEL_LABELS, isValidUUID, normalizePlate } from '@/lib/workorder-status'
import { formatBogotaDateTime } from '@/lib/format'
import {
  validateImageFile,
  validateSignatureDataUrl,
  validateSafeUrl,
  MAX_EVIDENCE_BYTES,
} from '@/lib/file-validation'
import { sanitizeText } from '@/lib/sanitize'

const STAFF_ROLES = new Set(['owner', 'admin', 'manager', 'receptionist'])

const customerInputSchema = z.object({
  id: z.string().optional(),
  full_name: z
    .string()
    .trim()
    .min(1, 'El nombre del cliente es requerido.')
    .max(120, 'El nombre del cliente es demasiado largo.'),
  phone_whatsapp: z
    .string()
    .trim()
    .min(4, 'El WhatsApp del cliente es requerido.')
    .max(30, 'El número de WhatsApp es demasiado largo.'),
})

const motorcycleInputSchema = z.object({
  id: z.string().optional(),
  customer_id: z.string().uuid('Identificador de cliente inválido.'),
  license_plate: z
    .string()
    .trim()
    .min(1, 'La placa es requerida.')
    .max(20, 'La placa es demasiado larga.'),
  brand: z
    .string()
    .trim()
    .min(1, 'La marca es requerida.')
    .max(80, 'La marca es demasiado larga.'),
  model: z
    .string()
    .trim()
    .min(1, 'El modelo es requerido.')
    .max(80, 'El modelo es demasiado largo.'),
  year: z.number().int().min(1950).max(2100).optional(),
})

const createWorkOrderSchema = z.object({
  motorcycle_id: z.string().uuid('Identificador de motocicleta inválido.'),
  mileage_in: z.coerce.number().min(0, 'Kilometraje inválido.').max(9_999_999),
  customer_notes: z.string().max(1000, 'Las notas son demasiado largas.').optional(),
  fuel_level: z.enum(['empty', 'low', 'half', 'high', 'full']),
  mechanic_id: z.string().nullable().optional(),
  media_urls: z.array(z.string()).max(10),
  signature_url: z.string().nullable().optional(),
  legalConsent: z.literal(true),
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
    throw new Error('No tienes permisos para registrar órdenes en recepción.')
  }

  return { supabase, workshopId: profile.workshop_id, userId: user.id }
}

export async function searchMotorcycleByPlate(plate: string) {
  const { supabase, workshopId } = await getWorkshopContext()

  const normalizedPlate = normalizePlate(sanitizeText(plate, 20))
  if (!normalizedPlate) return null

  const { data, error } = await supabase
    .from('motorcycles')
    .select('*, customers(*)')
    .eq('workshop_id', workshopId)
    .eq('license_plate', normalizedPlate)
    .maybeSingle()

  if (error) {
    console.error('[orders/new] Error searching motorcycle:', error.code)
    throw new Error('No se pudo consultar la placa.')
  }
  return data
}

export async function uploadEvidence(formData: FormData) {
  const { supabase, workshopId } = await getWorkshopContext()

  const file = formData.get('file') as File | null
  if (!file || typeof file.arrayBuffer !== 'function') {
    throw new Error('Archivo de evidencia inválido.')
  }

  const fileValidation = await validateImageFile(file, { maxSizeBytes: MAX_EVIDENCE_BYTES })
  if (!fileValidation.valid || !fileValidation.extension || !fileValidation.detectedType) {
    throw new Error(fileValidation.error || 'Tipo de archivo no permitido.')
  }

  const safeSuffix = `intake/${randomUUID()}.${fileValidation.extension}`
  const storagePath = `${workshopId}/${safeSuffix}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { data, error } = await supabase.storage
    .from('evidences')
    .upload(storagePath, buffer, {
      contentType: fileValidation.detectedType,
      upsert: true,
    })

  if (error || !data) {
    console.error('[orders/new] Error uploading evidence:', error?.message)
    throw new Error('No se pudo subir la imagen de evidencia.')
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('evidences').getPublicUrl(data.path)

  return publicUrl
}

export async function uploadSignatureDataUrl(dataUrl: string, _fileName?: string) {
  const { supabase, workshopId } = await getWorkshopContext()

  const sigValidation = validateSignatureDataUrl(dataUrl)
  if (!sigValidation.valid) {
    throw new Error(sigValidation.error || 'Firma electrónica inválida.')
  }

  const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '')
  const buffer = Buffer.from(base64Data, 'base64')
  const safeName = `${randomUUID()}.png`
  const storagePath = `${workshopId}/signatures/${safeName}`

  const { data, error } = await supabase.storage
    .from('evidences')
    .upload(storagePath, buffer, {
      contentType: 'image/png',
      upsert: true,
    })

  if (error || !data) {
    console.error('[orders/new] Error uploading signature:', error?.message)
    throw new Error('No se pudo guardar la firma electrónica.')
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('evidences').getPublicUrl(data.path)

  return publicUrl
}

export async function ensureCustomer(customer: {
  id?: string
  full_name: string
  phone_whatsapp: string
}) {
  const parsed = customerInputSchema.safeParse(customer)
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || 'Datos de cliente inválidos.')
  }

  const { supabase, workshopId } = await getWorkshopContext()

  const cleanName = sanitizeText(parsed.data.full_name, 120)
  const cleanPhone = sanitizeText(parsed.data.phone_whatsapp, 30)

  if (parsed.data.id) {
    if (!isValidUUID(parsed.data.id)) {
      throw new Error('Identificador de cliente inválido.')
    }
    const { data: existing } = await supabase
      .from('customers')
      .select('id')
      .eq('id', parsed.data.id)
      .eq('workshop_id', workshopId)
      .maybeSingle()

    if (existing) {
      await supabase
        .from('customers')
        .update({ full_name: cleanName, phone_whatsapp: cleanPhone })
        .eq('id', existing.id)
        .eq('workshop_id', workshopId)
      return existing.id
    }
  }

  if (cleanPhone) {
    const { data: byPhone } = await supabase
      .from('customers')
      .select('id')
      .eq('workshop_id', workshopId)
      .eq('phone_whatsapp', cleanPhone)
      .maybeSingle()

    if (byPhone) {
      await supabase
        .from('customers')
        .update({ full_name: cleanName })
        .eq('id', byPhone.id)
        .eq('workshop_id', workshopId)
      return byPhone.id
    }
  }

  const { data, error } = await supabase
    .from('customers')
    .insert({
      full_name: cleanName,
      phone_whatsapp: cleanPhone,
      workshop_id: workshopId,
    })
    .select('id')
    .single()

  if (error || !data) {
    console.error('[orders/new] Error creating customer:', error?.code)
    throw new Error('No se pudo registrar al cliente.')
  }
  return data.id
}

export async function ensureMotorcycle(motorcycle: {
  id?: string
  customer_id: string
  license_plate: string
  brand: string
  model: string
  year?: number
}) {
  const parsed = motorcycleInputSchema.safeParse(motorcycle)
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || 'Datos de motocicleta inválidos.')
  }

  const { supabase, workshopId } = await getWorkshopContext()

  // Validar que customer_id pertenezca al mismo taller (defensa en profundidad contra IDOR)
  const { data: ownerCustomer } = await supabase
    .from('customers')
    .select('id')
    .eq('id', parsed.data.customer_id)
    .eq('workshop_id', workshopId)
    .maybeSingle()

  if (!ownerCustomer) {
    throw new Error('El cliente asociado no pertenece a este taller.')
  }

  const normalizedPlate = normalizePlate(sanitizeText(parsed.data.license_plate, 20))
  const cleanBrand = sanitizeText(parsed.data.brand, 80)
  const cleanModel = sanitizeText(parsed.data.model, 80)

  if (parsed.data.id) {
    if (!isValidUUID(parsed.data.id)) {
      throw new Error('Identificador de motocicleta inválido.')
    }
    const { data: existing } = await supabase
      .from('motorcycles')
      .select('id')
      .eq('id', parsed.data.id)
      .eq('workshop_id', workshopId)
      .maybeSingle()

    if (existing) {
      await supabase
        .from('motorcycles')
        .update({
          customer_id: ownerCustomer.id,
          license_plate: normalizedPlate,
          brand: cleanBrand,
          model: cleanModel,
          year: parsed.data.year ?? null,
        })
        .eq('id', existing.id)
        .eq('workshop_id', workshopId)
      return existing.id
    }
  }

  const { data: byPlate } = await supabase
    .from('motorcycles')
    .select('id')
    .eq('workshop_id', workshopId)
    .eq('license_plate', normalizedPlate)
    .maybeSingle()

  if (byPlate) {
    await supabase
      .from('motorcycles')
      .update({
        customer_id: ownerCustomer.id,
        brand: cleanBrand,
        model: cleanModel,
        year: parsed.data.year ?? null,
      })
      .eq('id', byPlate.id)
      .eq('workshop_id', workshopId)
    return byPlate.id
  }

  const { data, error } = await supabase
    .from('motorcycles')
    .insert({
      customer_id: ownerCustomer.id,
      license_plate: normalizedPlate,
      brand: cleanBrand,
      model: cleanModel,
      year: parsed.data.year ?? null,
      workshop_id: workshopId,
    })
    .select('id')
    .single()

  if (error || !data) {
    console.error('[orders/new] Error creating motorcycle:', error?.code)
    throw new Error('No se pudo registrar la motocicleta.')
  }
  return data.id
}

export async function createWorkOrder(payload: {
  motorcycle_id: string
  mileage_in: number
  customer_notes?: string
  fuel_level: string
  mechanic_id?: string | null
  media_urls: string[]
  signature_url?: string | null
  legalConsent: boolean
}) {
  if (payload.legalConsent !== true) {
    throw new Error(
      'Debe confirmar la autorización de ingreso, firma electrónica y tratamiento de datos del cliente.'
    )
  }

  const parsed = createWorkOrderSchema.safeParse(payload)
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || 'Datos de la orden inválidos.')
  }

  const { supabase, workshopId, userId } = await getWorkshopContext()

  // Validar que motorcycle_id pertenezca al mismo taller (anti-IDOR)
  const { data: validMoto } = await supabase
    .from('motorcycles')
    .select('id')
    .eq('id', parsed.data.motorcycle_id)
    .eq('workshop_id', workshopId)
    .maybeSingle()

  if (!validMoto) {
    throw new Error('La motocicleta no pertenece a este taller.')
  }

  let validatedMechanicId: string | null = null
  const requestedMechanicId = parsed.data.mechanic_id?.trim() || ''
  if (requestedMechanicId) {
    if (!isValidUUID(requestedMechanicId)) {
      throw new Error('Identificador de mecánico inválido.')
    }
    const { data: mechanicProfile } = await supabase
      .from('profiles')
      .select('id, active')
      .eq('id', requestedMechanicId)
      .eq('workshop_id', workshopId)
      .maybeSingle()

    if (!mechanicProfile || mechanicProfile.active === false) {
      throw new Error('El mecánico seleccionado no pertenece a este taller o está inactivo.')
    }
    validatedMechanicId = mechanicProfile.id
  }

  // Validar todas las URLs multimedia y de firma (solo HTTPS o rutas seguras)
  const safeMediaUrls = (parsed.data.media_urls || []).filter(
    (u) => typeof u === 'string' && u.length > 0 && validateSafeUrl(u)
  )
  if (safeMediaUrls.length !== (parsed.data.media_urls || []).length) {
    throw new Error('Una o más URLs de evidencia tienen un protocolo no permitido.')
  }

  let safeSignatureUrl: string | null = null
  if (parsed.data.signature_url) {
    if (!validateSafeUrl(parsed.data.signature_url)) {
      throw new Error('La URL de la firma electrónica tiene un protocolo no permitido.')
    }
    safeSignatureUrl = parsed.data.signature_url
  }

  const fuelLabel = FUEL_LEVEL_LABELS[parsed.data.fuel_level] || parsed.data.fuel_level
  const trimmedNotes = sanitizeText(parsed.data.customer_notes || '', 1000)

  const { data: order, error } = await supabase
    .from('work_orders')
    .insert({
      workshop_id: workshopId,
      motorcycle_id: validMoto.id,
      mileage_in: parsed.data.mileage_in,
      fuel_level: parsed.data.fuel_level,
      mechanic_id: validatedMechanicId,
      customer_notes: trimmedNotes || null,
      status: 'received',
    })
    .select()
    .single()

  if (error || !order) {
    console.error('[orders/new] Error creating work order:', error?.code)
    throw new Error('No se pudo crear la orden de trabajo.')
  }

  const allMedia = [
    ...safeMediaUrls,
    ...(safeSignatureUrl ? [safeSignatureUrl] : []),
  ]

  const consentTimestamp = formatBogotaDateTime(new Date().toISOString())
  const timelineComment = [
    `Ingreso registrado (Combustible: ${fuelLabel}).`,
    safeSignatureUrl ? 'Firma electrónica de conformidad guardada.' : null,
    `Autorización de ingreso, firma electrónica y tratamiento de datos registrada (${consentTimestamp}).`,
    trimmedNotes ? `Notas: ${trimmedNotes}` : null,
  ]
    .filter(Boolean)
    .join(' ')

  const { error: timelineError } = await supabase
    .from('order_timeline_events')
    .insert({
      work_order_id: order.id,
      workshop_id: workshopId,
      status_snapshot: 'received',
      public_comment: timelineComment,
      media_urls: allMedia,
      created_by: userId,
    })

  if (timelineError) {
    console.error('[orders/new] Error creating initial timeline event:', timelineError.code)
  }

  revalidatePath('/dashboard/orders')
  revalidatePath('/dashboard/vehicles')
  revalidatePath('/dashboard/performance')
  revalidatePath('/mechanic')

  return order
}
