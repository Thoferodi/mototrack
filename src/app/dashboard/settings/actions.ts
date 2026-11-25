'use server'

import { createServerSupabaseClient } from '@/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateWorkshopSettings(
  workshopId: string,
  data: {
    name: string
    phone_whatsapp: string
    address: string
    logo_url: string | null
    primary_color: string
  }
) {
  const supabase = createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autorizado' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('workshop_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.workshop_id !== workshopId) {
    return { success: false, error: 'No tienes permisos para modificar este taller' }
  }

  const { error } = await supabase
    .from('workshops')
    .update({
      name: data.name.trim(),
      phone_whatsapp: data.phone_whatsapp.trim() || null,
      address: data.address.trim() || null,
      logo_url: data.logo_url,
      primary_color: data.primary_color,
    })
    .eq('id', workshopId)

  if (error) {
    console.error('Error updating workshop:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/', 'layout')
  revalidatePath('/dashboard', 'layout')
  revalidatePath('/dashboard/settings')

  return { success: true }
}
