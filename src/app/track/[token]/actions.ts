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
      .from('workorders')
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

    // 3. Actualizar el estado del ítem validando workorder_id y workshop_id
    const { data: updatedItem, error: updateError } = await supabase
      .from('order_items')
      .update({ status })
      .eq('id', itemId)
      .eq('workorder_id', order.id)
      .eq('workshop_id', order.workshop_id)
      .select('id')
      .maybeSingle()

    if (updateError || !updatedItem) {
      return {
        success: false,
        error: 'No se pudo actualizar el estado del ítem en el presupuesto.',
      }
    }

    // 4. Recalcular workorders.total_amount excluyendo ítems rechazados (en línea con Bloque A)
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('quantity, unit_price, status')
      .eq('workorder_id', order.id)
      .eq('workshop_id', order.workshop_id)

    if (itemsError) {
      return {
        success: false,
        error: 'Se guardó tu respuesta, pero hubo un problema al recalcular el total.',
      }
    }

    const total = (items || []).reduce((acc, item) => {
      if (item.status === 'rejected') return acc
      return acc + item.quantity * item.unit_price
    }, 0)

    const { error: totalError } = await supabase
      .from('workorders')
      .update({
        total_amount: total,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id)
      .eq('workshop_id', order.workshop_id)

    if (totalError) {
      return {
        success: false,
        error: 'Se actualizó el ítem, pero no se pudo actualizar el total de la orden.',
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
