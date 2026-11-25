'use server'

import { createServerSupabaseClient } from '@/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateWorkshopSettings(
  workshopId: string,
  data: {
    name: string
    phone: string
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

  const { data: existingWorkshop } = await supabase
    .from('workshops')
    .select('settings')
    .eq('id', workshopId)
    .single()

  const existingSettings =
    existingWorkshop?.settings &&
    typeof existingWorkshop.settings === 'object' &&
    !Array.isArray(existingWorkshop.settings)
      ? (existingWorkshop.settings as Record<string, any>)
      : {}

  const { error } = await supabase
    .from('workshops')
    .update({
      name: data.name.trim(),
      phone: data.phone.trim(),
      address: data.address.trim(),
      logo_url: data.logo_url,
      settings: {
        ...existingSettings,
        primary_color: data.primary_color,
      },
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
