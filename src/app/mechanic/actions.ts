'use server'

import { createServerSupabaseClient } from '@/supabase/server'
import { revalidatePath } from 'next/cache'
import { Database } from '@/types/database.types'

type Status = Database['public']['Enums']['workorder_status']

async function getMechanicContext() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data: profile } = await supabase
    .from('profiles')
    .select('workshop_id, id')
    .eq('id', user.id)
    .single()

  if (!profile) throw new Error('Perfil no encontrado')
  return { workshopId: profile.workshop_id, mechanicId: profile.id }
}

export async function getMechanicOrders() {
  const supabase = createServerSupabaseClient()
  const { workshopId, mechanicId } = await getMechanicContext()

  const { data, error } = await supabase
    .from('workorders')
    .select('*, motorcycles(*), customers(full_name)')
    .eq('workshop_id', workshopId)
    .or(`technician_id.eq.${mechanicId},technician_id.is.null`)
    .neq('status', 'delivered') // No mostrar las entregadas por defecto
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function updateMechanicOrderStatus(
  orderId: string,
  status: Status,
  description?: string
) {
  const supabase = createServerSupabaseClient()
  const { workshopId, mechanicId } = await getMechanicContext()

  // Actualizar estado y asignar técnico si no tenía uno
  const { error: updateError } = await supabase
    .from('workorders')
    .update({ 
      status,
      technician_id: mechanicId // El mecánico que lo mueve se asigna la orden
    })
    .eq('id', orderId)
    .eq('workshop_id', workshopId)

  if (updateError) throw updateError

  // Registrar en bitácora
  const { error: timelineError } = await supabase
    .from('order_timeline_events')
    .insert({
      workorder_id: orderId,
      workshop_id: workshopId,
      status,
      description: description || `El mecánico actualizó el estado a ${status}`,
      created_by: mechanicId
    })

  if (timelineError) throw timelineError

  revalidatePath('/mechanic')
  revalidatePath(`/mechanic/order/${orderId}`)
}

export async function saveEvidence(
  orderId: string,
  mediaUrls: string[],
  description: string
) {
  const supabase = createServerSupabaseClient()
  const { workshopId, mechanicId } = await getMechanicContext()

  const { error } = await supabase
    .from('order_timeline_events')
    .insert({
      workorder_id: orderId,
      workshop_id: workshopId,
      status: 'in_repair', // Por defecto si se sube evidencia suele ser diagnóstico o reparación
      description,
      media_urls: mediaUrls,
      created_by: mechanicId
    })

  if (error) throw error

  revalidatePath(`/mechanic/order/${orderId}`)
}
