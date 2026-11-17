'use server'

import { createServerSupabaseClient } from '@/supabase/server'
import { revalidatePath } from 'next/cache'
import { Database } from '@/types/database.types'

type WorkOrderStatus = Database['public']['Enums']['workorder_status']
type ItemType = Database['public']['Enums']['item_type']

async function getWorkshopId() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data: profile } = await supabase
    .from('profiles')
    .select('workshop_id')
    .eq('id', user.id)
    .single()

  if (!profile) throw new Error('Perfil no encontrado')
  return { workshopId: profile.workshop_id, userId: user.id }
}

export async function updateOrderStatus(
  orderId: string,
  status: WorkOrderStatus,
  description?: string
) {
  const supabase = createServerSupabaseClient()
  const { workshopId, userId } = await getWorkshopId()

  const { error: updateError } = await supabase
    .from('workorders')
    .update({ status })
    .eq('id', orderId)
    .eq('workshop_id', workshopId)

  if (updateError) throw updateError

  const { error: timelineError } = await supabase
    .from('order_timeline_events')
    .insert({
      workorder_id: orderId,
      workshop_id: workshopId,
      status,
      description: description || `El estado cambió a ${status}`,
      created_by: userId
    })

  if (timelineError) throw timelineError

  revalidatePath(`/dashboard/orders/${orderId}`)
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

  const { error } = await supabase
    .from('order_items')
    .insert({
      ...payload,
      workorder_id: orderId,
      workshop_id: workshopId,
      status: 'pending'
    })

  if (error) throw error

  revalidatePath(`/dashboard/orders/${orderId}`)
}

export async function deleteOrderItem(itemId: string, orderId: string) {
  const supabase = createServerSupabaseClient()
  const { workshopId } = await getWorkshopId()

  const { error } = await supabase
    .from('order_items')
    .delete()
    .eq('id', itemId)
    .eq('workshop_id', workshopId)

  if (error) throw error

  revalidatePath(`/dashboard/orders/${orderId}`)
}
