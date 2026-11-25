'use server'

import { createServerSupabaseClient } from '@/supabase/server'
import { revalidatePath } from 'next/cache'
import { getWorkOrderStatusLabel, WorkOrderStatus } from '@/lib/workorder-status'

async function getMechanicContext() {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, workshop_id')
    .eq('id', user.id)
    .single()

  if (error || !profile || !profile.workshop_id) {
    throw new Error('Perfil de taller no encontrado')
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

  const { data, error } = await supabase
    .from('workorders')
    .select('*, motorcycles(*), customers(full_name)')
    .eq('workshop_id', workshopId)
    .or(`technician_id.eq.${mechanicId},technician_id.is.null`)
    .neq('status', 'delivered')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function updateMechanicOrderStatus(
  orderId: string,
  status: WorkOrderStatus,
  description?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { supabase, workshopId, mechanicId } = await getMechanicContext()
    const nowIso = new Date().toISOString()

    const { data: updatedOrder, error: updateError } = await supabase
      .from('workorders')
      .update({
        status,
        technician_id: mechanicId,
        updated_at: nowIso,
      })
      .eq('id', orderId)
      .eq('workshop_id', workshopId)
      .select('id, tracking_token, workshops(slug)')
      .single()

    if (updateError || !updatedOrder) {
      return {
        success: false,
        error: updateError?.message || 'No se encontró la orden en tu taller.',
      }
    }

    const statusLabel = getWorkOrderStatusLabel(status)
    const { error: timelineError } = await supabase
      .from('order_timeline_events')
      .insert({
        workorder_id: orderId,
        workshop_id: workshopId,
        status,
        description: description?.trim() || `El mecánico actualizó el estado a: ${statusLabel}`,
        created_by: mechanicId,
      })

    if (timelineError) {
      return {
        success: false,
        error: timelineError.message || 'No se pudo registrar el evento en la bitácora.',
      }
    }

    const workshopSlug = (updatedOrder.workshops as { slug?: string } | null)?.slug
    revalidateOrderRoutes(orderId, updatedOrder.tracking_token, workshopSlug)

    return { success: true }
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Ocurrió un error al actualizar el estado.',
    }
  }
}

export async function uploadAndSaveEvidence(
  formData: FormData
): Promise<{ success: boolean; mediaUrl?: string; error?: string }> {
  try {
    const { supabase, workshopId, mechanicId } = await getMechanicContext()

    const orderId = (formData.get('orderId') as string | null)?.trim()
    const description = (formData.get('description') as string | null)?.trim()
    const file = formData.get('file') as File | null

    if (!orderId) {
      return { success: false, error: 'Identificador de orden inválido.' }
    }
    if (!description) {
      return { success: false, error: 'Describe el hallazgo antes de registrar la evidencia.' }
    }
    if (!file || file.size === 0) {
      return { success: false, error: 'Debes capturar o seleccionar una fotografía.' }
    }

    // Validar que la orden pertenece al taller del mecánico
    const { data: order, error: orderError } = await supabase
      .from('workorders')
      .select('id, status, tracking_token, workshops(slug)')
      .eq('id', orderId)
      .eq('workshop_id', workshopId)
      .single()

    if (orderError || !order) {
      return { success: false, error: 'La orden no existe o no pertenece a tu taller.' }
    }

    const storagePath = `${workshopId}/orders/${orderId}/${Date.now()}.webp`
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('evidences')
      .upload(storagePath, buffer, {
        contentType: file.type || 'image/webp',
        upsert: true,
      })

    if (uploadError || !uploadData) {
      return {
        success: false,
        error: `Error al subir fotografía: ${uploadError?.message || 'Storage error'}`,
      }
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('evidences').getPublicUrl(uploadData.path)

    const { error: timelineError } = await supabase
      .from('order_timeline_events')
      .insert({
        workorder_id: orderId,
        workshop_id: workshopId,
        status: order.status,
        description,
        media_urls: [publicUrl],
        created_by: mechanicId,
      })

    if (timelineError) {
      return {
        success: false,
        error: `Error al guardar la evidencia en la bitácora: ${timelineError.message}`,
      }
    }

    await supabase
      .from('workorders')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .eq('workshop_id', workshopId)

    const workshopSlug = (order.workshops as { slug?: string } | null)?.slug
    revalidateOrderRoutes(orderId, order.tracking_token, workshopSlug)

    return { success: true, mediaUrl: publicUrl }
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Error inesperado al registrar evidencia.',
    }
  }
}

export async function saveEvidence(
  orderId: string,
  mediaUrls: string[],
  description: string
) {
  const { supabase, workshopId, mechanicId } = await getMechanicContext()

  const { data: order, error: orderError } = await supabase
    .from('workorders')
    .select('id, status, tracking_token, workshops(slug)')
    .eq('id', orderId)
    .eq('workshop_id', workshopId)
    .single()

  if (orderError || !order) {
    throw new Error('Orden no encontrada en tu taller')
  }

  const { error } = await supabase.from('order_timeline_events').insert({
    workorder_id: orderId,
    workshop_id: workshopId,
    status: order.status,
    description: description.trim(),
    media_urls: mediaUrls,
    created_by: mechanicId,
  })

  if (error) throw error

  await supabase
    .from('workorders')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .eq('workshop_id', workshopId)

  const workshopSlug = (order.workshops as { slug?: string } | null)?.slug
  revalidateOrderRoutes(orderId, order.tracking_token, workshopSlug)
}
