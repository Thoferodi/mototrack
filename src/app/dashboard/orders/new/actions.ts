'use server'

import createServerSupabaseClient() from '@/supabase/server'
import { Database } from '@/types/database.types'

export async function getWorkshop() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('workshop_id')
    .eq('id', user.id)
    .single()

  return profile?.workshop_id || null
}

export async function searchMotorcycleByPlate(plate: string) {
  const supabase = createClient()
  const workshopId = await getWorkshop()
  if (!workshopId) throw new Error('No workshop found')

  const { data, error } = await supabase
    .from('motorcycles')
    .select('*, customers(*)')
    .eq('workshop_id', workshopId)
    .eq('plate', plate.toUpperCase())
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function uploadEvidence(file: File, path: string) {
  const supabase = createClient()
  const { data, error } = await supabase.storage
    .from('evidences')
    .upload(path, file)

  if (error) throw error
  
  const { data: { publicUrl } } = supabase.storage
    .from('evidences')
    .getPublicUrl(data.path)

  return publicUrl
}

export async function createWorkOrder(payload: any) {
  const supabase = createClient()
  const workshopId = await getWorkshop()
  if (!workshopId) throw new Error('No workshop found')

  const { data, error } = await supabase
    .from('workorders')
    .insert({
      ...payload,
      workshop_id: workshopId,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function ensureCustomer(customer: any) {
  const supabase = createClient()
  const workshopId = await getWorkshop()
  if (!workshopId) throw new Error('No workshop found')

  if (customer.id) return customer.id

  const { data, error } = await supabase
    .from('customers')
    .insert({
      ...customer,
      workshop_id: workshopId,
    })
    .select()
    .single()

  if (error) throw error
  return data.id
}

export async function ensureMotorcycle(motorcycle: any) {
  const supabase = createClient()
  const workshopId = await getWorkshop()
  if (!workshopId) throw new Error('No workshop found')

  if (motorcycle.id) return motorcycle.id

  const { data, error } = await supabase
    .from('motorcycles')
    .insert({
      ...motorcycle,
      workshop_id: workshopId,
    })
    .select()
    .single()

  if (error) throw error
  return data.id
}
