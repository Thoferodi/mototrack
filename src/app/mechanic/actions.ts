'use server'

import { createServerSupabaseClient } from '@/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { Constants } from '@/types/database.types'
import { getWorkOrderStatusLabel, isValidUUID, WorkOrderStatus } from '@/lib/workorder-status'
import { validateImageFile, MAX_EVIDENCE_BYTES, validateSafeUrl } from '@/lib/file-validation'
import { sanitizeText } from '@/lib/sanitize'

const ALLOWED_WORKSHOP_ROLES = new Set(['owner', 'admin', 'manager', 'receptionist', 'mechanic'])
const orderStatusSchema = z.enum(Constants.public.Enums.order_status)

async function getMechanicContext() {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado.')

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, workshop_id, role, active')
    .eq('id', user.id)
    .single()

  if (error || !profile || !profile.workshop_id) {
    throw new Error('Perfil de taller no encontrado.')
  }

  if (profile.active === false) {
    throw new Error('Tu cuenta está desactivada.')
  }

  if (!ALLOWED_WORKSHOP_ROLES.has(String(profile.role))) {
    throw new Error('No tienes permisos para acceder al módulo técnico.')
  }

  return { supabase, workshopId: profile.workshop_id, mechanicId: profile.id }
}

function revalidateOrderRoutes(
  orderId: string,
  trackingToken?: string | null,
  workshopSlug?: string | null
) {
  revalidatePath('/mechanic')
  revalidatePath(`/mechanic/order/${orderId}`)
  revalidatePath('/dashboard/orders')
  revalidatePath(`/dashboard/orders/${orderId}`)
  revalidatePath('/dashboard/vehicles')
  if (trackingToken) {
    revalidatePath(`/track/${trackingToken}`)
    if (workshopSlug) {
      revalidatePath(`/t/${workshopSlug}/track/${trackingToken}`)
    }
  }
}

export async function getMechanicOrders() {
  const { supabase, workshopId, mechanicId } = await getMechanicContext()

  if (!isValidUUID(mechanicId) || !isValidUUID(workshopId)) {
    throw new Error('Contexto de taller inválido.')
  }

  const { data, error } = await supabase
    .from('work_orders')
    .select('*, motorcycles(*, customers(full_name))')
    .eq('workshop_id', workshopId)
    .or(`mechanic_id.eq.${mechanicId},mechanic_id.is.null`)
    .not('status', 'in', '("delivered","cancelled")')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[mechanic] Error loading orders:', error.code)
    throw new Error('No se pudieron cargar las órdenes del taller.')
  }
  return data
}

export async function updateMechanicOrderStatus(
  orderId: string,
  status: WorkOrderStatus,
  description?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!isValidUUID(orderId)) {
      return { success: false, error: 'Identificador de orden inválido.' }
    }
    const parsedStatus = orderStatusSchema.safeParse(status)
    if (!parsedStatus.success) {
      return { success: false, error: 'Estado de orden inválido.' }
    }

    const { supabase, workshopId, mechanicId } = await getMechanicContext()
    const nowIso = new Date().toISOString()
    const safeDescription = description ? sanitizeText(description, 1000) : ''

    const { data: updatedOrder, error: updateError } = await supabase
      .from('work_orders')
      .update({
        status: parsedStatus.data,
        mechanic_id: mechanicId,
        updated_at: nowIso,
      })
      .eq('id', orderId)
      .eq('workshop_id', workshopId)
      .select('id, tracking_token, workshops(slug)')
      .single()

    if (updateError || !updatedOrder) {
      console.error('[mechanic] Error updating order status:', updateError?.code)
      return {
        success: false,
        error: 'No se encontró la orden en tu taller o no se pudo actualizar.',
      }
    }

    const statusLabel = getWorkOrderStatusLabel(parsedStatus.data)
    const { error: timelineError } = await supabase
      .from('order_timeline_events')
      .insert({
        work_order_id: orderId,
        workshop_id: workshopId,
        status_snapshot: parsedStatus.data,
        public_comment:
          safeDescription || `El mecánico actualizó el estado a: ${statusLabel}`,
        created_by: mechanicId,
      })

    if (timelineError) {
      console.error('[mechanic] Error logging status timeline:', timelineError.code)
      return {
        success: false,
        error: 'No se pudo registrar el evento en la bitácora.',
      }
    }

    const workshopSlug = (updatedOrder.workshops as { slug?: string } | null)?.slug
    revalidateOrderRoutes(orderId, updatedOrder.tracking_token, workshopSlug)

    return { success: true }
  } catch (err: unknown) {
    console.error('[mechanic] Unexpected error in updateMechanicOrderStatus:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Ocurrió un error al actualizar el estado.',
    }
  }
}

export async function uploadAndSaveEvidence(
  formData: FormData
): Promise<{ success: boolean; mediaUrl?: string; error?: string }> {
  try {
    const { supabase, workshopId, mechanicId } = await getMechanicContext()

    const orderId = (formData.get('orderId') as string | null)?.trim()
    const rawDescription = (formData.get('description') as string | null) || ''
    const description = sanitizeText(rawDescription, 1000)
    const file = formData.get('file') as File | null

    if (!orderId || !isValidUUID(orderId)) {
      return { success: false, error: 'Identificador de orden inválido.' }
    }
    if (!description) {
      return { success: false, error: 'Describe el hallazgo antes de registrar la evidencia.' }
    }
    if (!file || typeof file.arrayBuffer !== 'function' || file.size === 0) {
      return { success: false, error: 'Debes capturar o seleccionar una fotografía.' }
    }

    // Validación estricta de magic bytes, tipo permitido y límite 5 MB
    const fileValidation = await validateImageFile(file, { maxSizeBytes: MAX_EVIDENCE_BYTES })
    if (!fileValidation.valid || !fileValidation.safeName || !fileValidation.detectedType) {
      return { success: false, error: fileValidation.error || 'Archivo inválido.' }
    }

    const { data: order, error: orderError } = await supabase
      .from('work_orders')
      .select('id, status, tracking_token, workshops(slug)')
      .eq('id', orderId)
      .eq('workshop_id', workshopId)
      .single()

    if (orderError || !order) {
      return { success: false, error: 'La orden no existe o no pertenece a tu taller.' }
    }

    const storagePath = `${workshopId}/orders/${orderId}/${fileValidation.safeName}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('evidences')
      .upload(storagePath, buffer, {
        contentType: fileValidation.detectedType,
        upsert: true,
      })

    if (uploadError || !uploadData) {
      console.error('[mechanic] Storage upload error:', uploadError?.message)
      return {
        success: false,
        error: 'No se pudo subir la fotografía de evidencia. Intenta de nuevo.',
      }
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('evidences').getPublicUrl(uploadData.path)

    const { error: timelineError } = await supabase
      .from('order_timeline_events')
      .insert({
        work_order_id: orderId,
        workshop_id: workshopId,
        status_snapshot: order.status || 'received',
        public_comment: description,
        media_urls: [publicUrl],
        created_by: mechanicId,
      })

    if (timelineError) {
      console.error('[mechanic] Error saving evidence timeline:', timelineError.code)
      return {
        success: false,
        error: 'No se pudo guardar la evidencia en la bitácora.',
      }
    }

    await supabase
      .from('work_orders')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .eq('workshop_id', workshopId)

    const workshopSlug = (order.workshops as { slug?: string } | null)?.slug
    revalidateOrderRoutes(orderId, order.tracking_token, workshopSlug)

    return { success: true, mediaUrl: publicUrl }
  } catch (err: unknown) {
    console.error('[mechanic] Unexpected error in uploadAndSaveEvidence:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error inesperado al registrar evidencia.',
    }
  }
}

export async function saveEvidence(
  orderId: string,
  mediaUrls: string[],
  description: string
) {
  if (!isValidUUID(orderId)) {
    throw new Error('Identificador de orden inválido.')
  }

  const safeUrls = (mediaUrls || []).filter(
    (u) => typeof u === 'string' && u.length > 0 && validateSafeUrl(u)
  )
  if (safeUrls.length !== (mediaUrls || []).length) {
    throw new Error('Una o más URLs multimedia tienen un protocolo no permitido.')
  }

  const cleanDescription = sanitizeText(description, 1000)
  if (!cleanDescription) {
    throw new Error('La descripción es requerida.')
  }

  const { supabase, workshopId, mechanicId } = await getMechanicContext()

  const { data: order, error: orderError } = await supabase
    .from('work_orders')
    .select('id, status, tracking_token, workshops(slug)')
    .eq('id', orderId)
    .eq('workshop_id', workshopId)
    .single()

  if (orderError || !order) {
    throw new Error('Orden no encontrada en tu taller.')
  }

  const { error } = await supabase.from('order_timeline_events').insert({
    work_order_id: orderId,
    workshop_id: workshopId,
    status_snapshot: order.status || 'received',
    public_comment: cleanDescription,
    media_urls: safeUrls,
    created_by: mechanicId,
  })

  if (error) {
    console.error('[mechanic] Error in saveEvidence:', error.code)
    throw new Error('No se pudo guardar la evidencia.')
  }

  await supabase
    .from('work_orders')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .eq('workshop_id', workshopId)

  const workshopSlug = (order.workshops as { slug?: string } | null)?.slug
  revalidateOrderRoutes(orderId, order.tracking_token, workshopSlug)
}
