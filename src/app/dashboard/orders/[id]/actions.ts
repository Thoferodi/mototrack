'use server'

import { createServerSupabaseClient } from '@/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { Constants, Database } from '@/types/database.types'
import { getWorkOrderStatusLabel, isValidUUID } from '@/lib/workorder-status'
import { sanitizeText } from '@/lib/sanitize'

type WorkOrderStatus = Database['public']['Enums']['order_status']
type ItemType = Database['public']['Enums']['item_type']

const STAFF_ORDER_ROLES = new Set(['owner', 'admin', 'manager', 'receptionist'])

const orderItemSchema = z.object({
  type: z.enum(['spare_part', 'labor']),
  description: z
    .string()
    .trim()
    .min(1, 'La descripción es requerida.')
    .max(250, 'La descripción no puede superar los 250 caracteres.'),
  quantity: z.coerce
    .number()
    .min(1, 'La cantidad mínima es 1.')
    .max(10000, 'La cantidad es demasiado alta.'),
  unit_price: z.coerce
    .number()
    .min(0, 'El precio no puede ser negativo.')
    .max(999_999_999, 'El precio es demasiado alto.'),
})

const orderStatusSchema = z.enum(Constants.public.Enums.order_status)

async function getAuthorizedOrderStaffContext() {
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

  if (!STAFF_ORDER_ROLES.has(String(profile.role))) {
    throw new Error('No tienes permisos para realizar esta operación.')
  }

  return { supabase, workshopId: profile.workshop_id, userId: user.id }
}

async function touchOrderUpdatedAt(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  orderId: string,
  workshopId: string
) {
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
  if (!isValidUUID(orderId)) throw new Error('Identificador de orden inválido.')
  const parsedStatus = orderStatusSchema.safeParse(status)
  if (!parsedStatus.success) throw new Error('Estado de orden inválido.')

  const { supabase, workshopId, userId } = await getAuthorizedOrderStaffContext()
  const safeDescription = description ? sanitizeText(description, 1000) : ''

  const { data: updatedOrder, error: updateError } = await supabase
    .from('work_orders')
    .update({ status: parsedStatus.data, updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .eq('workshop_id', workshopId)
    .select('tracking_token')
    .single()

  if (updateError || !updatedOrder) {
    console.error('[orders/id] Error updating status:', updateError?.code)
    throw new Error('No se pudo actualizar el estado de la orden.')
  }

  const statusLabel = getWorkOrderStatusLabel(parsedStatus.data)
  const { error: timelineError } = await supabase
    .from('order_timeline_events')
    .insert({
      work_order_id: orderId,
      workshop_id: workshopId,
      status_snapshot: parsedStatus.data,
      public_comment: safeDescription || `Estado actualizado a: ${statusLabel}`,
      created_by: userId,
    })

  if (timelineError) {
    console.error('[orders/id] Error inserting timeline event:', timelineError.code)
    throw new Error('Se cambió el estado, pero no se pudo registrar el evento en la bitácora.')
  }

  revalidatePath(`/dashboard/orders/${orderId}`)
  revalidatePath('/dashboard/orders')
  revalidatePath('/dashboard/vehicles')
  revalidatePath('/dashboard/performance')
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
  if (!isValidUUID(orderId)) throw new Error('Identificador de orden inválido.')
  const parsed = orderItemSchema.safeParse(payload)
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || 'Datos del ítem inválidos.')
  }

  const { supabase, workshopId } = await getAuthorizedOrderStaffContext()

  const { data: order } = await supabase
    .from('work_orders')
    .select('tracking_token')
    .eq('id', orderId)
    .eq('workshop_id', workshopId)
    .single()

  if (!order) throw new Error('Orden no encontrada en tu taller.')

  const cleanDescription = sanitizeText(parsed.data.description, 250)
  if (!cleanDescription) throw new Error('La descripción del ítem es requerida.')

  const { error } = await supabase.from('order_items').insert({
    type: parsed.data.type,
    description: cleanDescription,
    quantity: parsed.data.quantity,
    unit_price: parsed.data.unit_price,
    work_order_id: orderId,
    workshop_id: workshopId,
    approved: null,
  })

  if (error) {
    console.error('[orders/id] Error adding order item:', error.code)
    throw new Error('No se pudo agregar el ítem al presupuesto.')
  }

  await touchOrderUpdatedAt(supabase, orderId, workshopId)

  revalidatePath(`/dashboard/orders/${orderId}`)
  revalidatePath('/dashboard/orders')
  revalidatePath('/dashboard/catalog')
  revalidatePath('/dashboard/performance')
  if (order.tracking_token) {
    revalidatePath(`/track/${order.tracking_token}`)
  }
}

export async function deleteOrderItem(itemId: string, orderId: string) {
  if (!isValidUUID(itemId)) throw new Error('Identificador de ítem inválido.')
  if (!isValidUUID(orderId)) throw new Error('Identificador de orden inválido.')

  const { supabase, workshopId } = await getAuthorizedOrderStaffContext()

  const { data: order } = await supabase
    .from('work_orders')
    .select('tracking_token')
    .eq('id', orderId)
    .eq('workshop_id', workshopId)
    .single()

  if (!order) throw new Error('Orden no encontrada en tu taller.')

  const { error } = await supabase
    .from('order_items')
    .delete()
    .eq('id', itemId)
    .eq('work_order_id', orderId)
    .eq('workshop_id', workshopId)

  if (error) {
    console.error('[orders/id] Error deleting order item:', error.code)
    throw new Error('No se pudo eliminar el ítem del presupuesto.')
  }

  await touchOrderUpdatedAt(supabase, orderId, workshopId)

  revalidatePath(`/dashboard/orders/${orderId}`)
  revalidatePath('/dashboard/orders')
  revalidatePath('/dashboard/performance')
  if (order?.tracking_token) {
    revalidatePath(`/track/${order.tracking_token}`)
  }
}

export async function assignOrderMechanic(orderId: string, mechanicId: string | null) {
  if (!isValidUUID(orderId)) {
    throw new Error('Identificador de orden inválido.')
  }

  const { supabase, workshopId } = await getAuthorizedOrderStaffContext()

  const { data: order, error: orderError } = await supabase
    .from('work_orders')
    .select('id, tracking_token')
    .eq('id', orderId)
    .eq('workshop_id', workshopId)
    .single()

  if (orderError || !order) {
    throw new Error('Orden de trabajo no encontrada.')
  }

  let validatedMechanicId: string | null = null
  const requestedId = mechanicId?.trim() || ''

  if (requestedId) {
    if (!isValidUUID(requestedId)) {
      throw new Error('Identificador de mecánico inválido.')
    }

    const { data: mechanicProfile } = await supabase
      .from('profiles')
      .select('id, active')
      .eq('id', requestedId)
      .eq('workshop_id', workshopId)
      .maybeSingle()

    if (!mechanicProfile || mechanicProfile.active === false) {
      throw new Error('El mecánico seleccionado no pertenece a este taller o está inactivo.')
    }

    validatedMechanicId = mechanicProfile.id
  }

  const { error: updateError } = await supabase
    .from('work_orders')
    .update({
      mechanic_id: validatedMechanicId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .eq('workshop_id', workshopId)

  if (updateError) {
    console.error('[orders/id] Error assigning mechanic:', updateError.code)
    throw new Error('No se pudo asignar el mecánico a la orden.')
  }

  revalidatePath(`/dashboard/orders/${orderId}`)
  revalidatePath(`/dashboard/orders/${orderId}/receipt`)
  revalidatePath('/dashboard/orders')
  revalidatePath('/dashboard/performance')
  revalidatePath('/mechanic')
  if (order.tracking_token) {
    revalidatePath(`/track/${order.tracking_token}`)
  }

  return { mechanicId: validatedMechanicId }
}
