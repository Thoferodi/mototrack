'use server'

import { createServerSupabaseClient } from '@/supabase/server'
import { revalidatePath } from 'next/cache'
import { Database } from '@/types/database.types'

type WorkshopUpdate = Database['public']['Tables']['workshops']['Update']

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

  // Verificar sesión y permisos (opcionalmente podrías verificar que el usuario pertenece a este workshop)
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    throw new Error('No autorizado')
  }

  const { error } = await supabase
    .from('workshops')
    .update({
      name: data.name,
      phone: data.phone,
      address: data.address,
      logo_url: data.logo_url,
      settings: {
        primary_color: data.primary_color
      }
    })
    .eq('id', workshopId)

  if (error) {
    console.error('Error updating workshop:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/', 'layout')
  revalidatePath('/dashboard/settings')
  
  return { success: true }
}
