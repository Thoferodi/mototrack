'use server'

import { revalidatePath } from 'next/cache'
import { createAdminSupabaseClient } from '@/supabase/admin'
import { isValidUUID } from '@/lib/workorder-status'

export async function updateItemApprovalStatus(
  trackingToken: string,
  itemId: string,
  status: 'approved' | 'rejected'
): Promise<{ success: boolean; totalAmount?: number; error?: string }> {
  if (!isValidUUID(trackingToken)) {
    return { success: false, error: 'Enlace de seguimiento inválido.' }
  }
  if (!itemId) {
    return { success: false, error: 'Ítem de presupuesto inválido.' }
  }
  if (status !== 'approved' && status !== 'rejected') {
    return { success: false, error: 'Estado de aprobación inválido.' }
  }

  try {
    const supabase = createAdminSupabaseClient()

    // 1. Buscar la orden por tracking_token para verificar estado y tenant
    const { data: order, error: orderError } = await supabase
      .from('work_orders')
      .select('id, status, workshop_id, workshops(slug)')
      .eq('tracking_token', trackingToken)
      .maybeSingle()

    if (orderError || !order) {
      return { success: false, error: 'Orden no encontrada.' }
    }

    // 2. Seguridad Backend: Verificar estrictamente que la orden siga en waiting_approval
    if (order.status !== 'waiting_approval') {
      return {
        success: false,
        error:
          'El presupuesto ya ha sido cerrado o la orden avanzó de estado. No se pueden modificar los ítems.',
      }
    }

    // 3. Actualizar la aprobación del ítem validando work_order_id y workshop_id
    const approvedValue = status === 'approved'
    const { data: updatedItem, error: updateError } = await supabase
      .from('order_items')
      .update({ approved: approvedValue })
      .eq('id', itemId)
      .eq('work_order_id', order.id)
      .eq('workshop_id', order.workshop_id)
      .select('id')
      .maybeSingle()

    if (updateError || !updatedItem) {
      return {
        success: false,
        error: 'No se pudo actualizar el estado del ítem en el presupuesto.',
      }
    }

    // 4. Recalcular el total activo excluyendo ítems rechazados (approved === false)
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('quantity, unit_price, approved')
      .eq('work_order_id', order.id)
      .eq('workshop_id', order.workshop_id)

    if (itemsError) {
      return {
        success: false,
        error: 'Se guardó tu respuesta, pero hubo un problema al recalcular el total.',
      }
    }

    const total = (items || []).reduce((acc, item) => {
      if (item.approved === false) return acc
      return acc + Number(item.quantity ?? 1) * Number(item.unit_price ?? 0)
    }, 0)

    const { error: touchError } = await supabase
      .from('work_orders')
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id)
      .eq('workshop_id', order.workshop_id)

    if (touchError) {
      return {
        success: false,
        error: 'Se actualizó el ítem, pero no se pudo actualizar la fecha de la orden.',
      }
    }

    // 5. Revalidar todas las rutas afectadas (portal cliente, panel admin, mecánico)
    const workshopSlug = (order.workshops as { slug?: string } | null)?.slug
    revalidatePath(`/track/${trackingToken}`)
    if (workshopSlug) {
      revalidatePath(`/t/${workshopSlug}/track/${trackingToken}`)
    }
    revalidatePath('/dashboard/orders')
    revalidatePath(`/dashboard/orders/${order.id}`)
    revalidatePath('/dashboard/vehicles')
    revalidatePath('/mechanic')
    revalidatePath(`/mechanic/order/${order.id}`)

    return { success: true, totalAmount: total }
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Error inesperado al actualizar el ítem.',
    }
  }
}
