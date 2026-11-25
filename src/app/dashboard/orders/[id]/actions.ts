'use server'

import { createServerSupabaseClient } from '@/supabase/server'
import { revalidatePath } from 'next/cache'
import { Database } from '@/types/database.types'
import { getWorkOrderStatusLabel } from '@/lib/workorder-status'

type WorkOrderStatus = Database['public']['Enums']['order_status']
type ItemType = Database['public']['Enums']['item_type']

async function getWorkshopId() {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data: profile } = await supabase
    .from('profiles')
    .select('workshop_id')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.workshop_id) throw new Error('Perfil no encontrado')
  return { workshopId: profile.workshop_id, userId: user.id }
}

async function touchOrderUpdatedAt(orderId: string, workshopId: string) {
  const supabase = createServerSupabaseClient()
  await supabase
    .from('work_orders')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .eq('workshop_id', workshopId)
}

export async function updateOrderStatus(
  orderId: string,
  status: WorkOrderStatus,
  description?: string
) {
  const supabase = createServerSupabaseClient()
  const { workshopId, userId } = await getWorkshopId()

  const { data: updatedOrder, error: updateError } = await supabase
    .from('work_orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .eq('workshop_id', workshopId)
    .select('tracking_token')
    .single()

  if (updateError) throw new Error(updateError.message)

  const statusLabel = getWorkOrderStatusLabel(status)
  const { error: timelineError } = await supabase
    .from('order_timeline_events')
    .insert({
      work_order_id: orderId,
      workshop_id: workshopId,
      status_snapshot: status,
      public_comment: description || `Estado actualizado a: ${statusLabel}`,
      created_by: userId,
    })

  if (timelineError) throw new Error(timelineError.message)

  revalidatePath(`/dashboard/orders/${orderId}`)
  revalidatePath('/dashboard/orders')
  revalidatePath('/dashboard/vehicles')
  revalidatePath('/mechanic')
  if (updatedOrder?.tracking_token) {
    revalidatePath(`/track/${updatedOrder.tracking_token}`)
  }
}

export async function addOrderItem(
  orderId: string,
  payload: {
    type: ItemType
    description: string
    quantity: number
    unit_price: number
  }
) {
  const supabase = createServerSupabaseClient()
  const { workshopId } = await getWorkshopId()

  const { data: order } = await supabase
    .from('work_orders')
    .select('tracking_token')
    .eq('id', orderId)
    .eq('workshop_id', workshopId)
    .single()

  if (!order) throw new Error('Orden no encontrada')

  const { error } = await supabase.from('order_items').insert({
    type: payload.type,
    description: payload.description.trim(),
    quantity: payload.quantity,
    unit_price: payload.unit_price,
    work_order_id: orderId,
    workshop_id: workshopId,
    approved: null,
  })

  if (error) throw new Error(error.message)

  await touchOrderUpdatedAt(orderId, workshopId)

  revalidatePath(`/dashboard/orders/${orderId}`)
  revalidatePath('/dashboard/orders')
  revalidatePath('/dashboard/catalog')
  if (order.tracking_token) {
    revalidatePath(`/track/${order.tracking_token}`)
  }
}

export async function deleteOrderItem(itemId: string, orderId: string) {
  const supabase = createServerSupabaseClient()
  const { workshopId } = await getWorkshopId()

  const { data: order } = await supabase
    .from('work_orders')
    .select('tracking_token')
    .eq('id', orderId)
    .eq('workshop_id', workshopId)
    .single()

  const { error } = await supabase
    .from('order_items')
    .delete()
    .eq('id', itemId)
    .eq('work_order_id', orderId)
    .eq('workshop_id', workshopId)

  if (error) throw new Error(error.message)

  await touchOrderUpdatedAt(orderId, workshopId)

  revalidatePath(`/dashboard/orders/${orderId}`)
  revalidatePath('/dashboard/orders')
  if (order?.tracking_token) {
    revalidatePath(`/track/${order.tracking_token}`)
  }
}
