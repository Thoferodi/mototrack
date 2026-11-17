'use server'

import { createServerSupabaseClient } from '@/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateItemApprovalStatus(
  trackingToken: string,
  itemId: string,
  status: 'approved' | 'rejected'
) {
  const supabase = createServerSupabaseClient()

  // 1. Buscar la orden usando el tracking token para verificar su estado actual
  const { data: order, error: orderError } = await supabase
    .from('workorders')
    .select('id, status')
    .eq('tracking_token', trackingToken)
    .single()

  if (orderError || !order) {
    throw new Error('Orden no encontrada.')
  }

  // 2. Seguridad Backend: Verificar estrictamente que la orden siga en estado waiting_approval
  if (order.status !== 'waiting_approval') {
    throw new Error('El presupuesto ya ha sido cerrado o la orden ha avanzado de estado. No se pueden modificar los ítems.')
  }

  // 3. Actualizar el estado del ítem en la base de datos
  const { error: updateError } = await supabase
    .from('order_items')
    .update({ status })
    .eq('id', itemId)
    .eq('workorder_id', order.id)

  if (updateError) {
    throw new Error('Error al actualizar el estado del ítem.')
  }

  revalidatePath(`/track/${trackingToken}`)
  return { success: true }
}
