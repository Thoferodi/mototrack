'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/supabase/server'

async function getWorkshopContext() {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('workshop_id')
    .eq('id', user.id)
    .single()

  if (error || !profile) throw new Error('Perfil de taller no encontrado')
  return { workshopId: profile.workshop_id, userId: user.id }
}

export async function searchMotorcycleByPlate(plate: string) {
  const supabase = createServerSupabaseClient()
  const { workshopId } = await getWorkshopContext()

  const normalizedPlate = plate.trim().toUpperCase()
  if (!normalizedPlate) return null

  const { data, error } = await supabase
    .from('motorcycles')
    .select('*, customers(*)')
    .eq('workshop_id', workshopId)
    .eq('plate', normalizedPlate)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}

export async function uploadEvidence(formData: FormData) {
  const supabase = createServerSupabaseClient()
  const { workshopId } = await getWorkshopContext()

  const file = formData.get('file') as File | null
  const pathSuffix = formData.get('path') as string | null

  if (!file || !pathSuffix) {
    throw new Error('Archivo o ruta de evidencia inválidos')
  }

  const storagePath = `${workshopId}/${pathSuffix}`
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const { data, error } = await supabase.storage
    .from('evidences')
    .upload(storagePath, buffer, {
      contentType: file.type || 'image/webp',
      upsert: true,
    })

  if (error) throw new Error(`Error al subir imagen: ${error.message}`)

  const {
    data: { publicUrl },
  } = supabase.storage.from('evidences').getPublicUrl(data.path)

  return publicUrl
}

export async function uploadSignatureDataUrl(dataUrl: string, fileName: string) {
  const supabase = createServerSupabaseClient()
  const { workshopId } = await getWorkshopContext()

  const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '')
  const buffer = Buffer.from(base64Data, 'base64')
  const storagePath = `${workshopId}/signatures/${fileName}`

  const { data, error } = await supabase.storage
    .from('evidences')
    .upload(storagePath, buffer, {
      contentType: 'image/png',
      upsert: true,
    })

  if (error) throw new Error(`Error al guardar firma: ${error.message}`)

  const {
    data: { publicUrl },
  } = supabase.storage.from('evidences').getPublicUrl(data.path)

  return publicUrl
}

export async function ensureCustomer(customer: {
  id?: string
  full_name: string
  phone: string
}) {
  const supabase = createServerSupabaseClient()
  const { workshopId } = await getWorkshopContext()

  const cleanName = customer.full_name.trim()
  const cleanPhone = customer.phone.trim()

  if (customer.id) {
    const { data: existing } = await supabase
      .from('customers')
      .select('id')
      .eq('id', customer.id)
      .eq('workshop_id', workshopId)
      .maybeSingle()

    if (existing) {
      await supabase
        .from('customers')
        .update({ full_name: cleanName, phone: cleanPhone })
        .eq('id', existing.id)
        .eq('workshop_id', workshopId)
      return existing.id
    }
  }

  if (cleanPhone) {
    const { data: byPhone } = await supabase
      .from('customers')
      .select('id')
      .eq('workshop_id', workshopId)
      .eq('phone', cleanPhone)
      .maybeSingle()

    if (byPhone) {
      await supabase
        .from('customers')
        .update({ full_name: cleanName })
        .eq('id', byPhone.id)
        .eq('workshop_id', workshopId)
      return byPhone.id
    }
  }

  const { data, error } = await supabase
    .from('customers')
    .insert({
      full_name: cleanName,
      phone: cleanPhone,
      workshop_id: workshopId,
    })
    .select('id')
    .single()

  if (error) throw new Error(`Error al registrar cliente: ${error.message}`)
  return data.id
}

export async function ensureMotorcycle(motorcycle: {
  id?: string
  customer_id: string
  plate: string
  make: string
  model: string
  year?: number
}) {
  const supabase = createServerSupabaseClient()
  const { workshopId } = await getWorkshopContext()

  const normalizedPlate = motorcycle.plate.trim().toUpperCase()

  if (motorcycle.id) {
    const { data: existing } = await supabase
      .from('motorcycles')
      .select('id')
      .eq('id', motorcycle.id)
      .eq('workshop_id', workshopId)
      .maybeSingle()

    if (existing) {
      await supabase
        .from('motorcycles')
        .update({
          customer_id: motorcycle.customer_id,
          plate: normalizedPlate,
          make: motorcycle.make.trim(),
          model: motorcycle.model.trim(),
          year: motorcycle.year ?? null,
        })
        .eq('id', existing.id)
        .eq('workshop_id', workshopId)
      return existing.id
    }
  }

  const { data: byPlate } = await supabase
    .from('motorcycles')
    .select('id')
    .eq('workshop_id', workshopId)
    .eq('plate', normalizedPlate)
    .maybeSingle()

  if (byPlate) {
    await supabase
      .from('motorcycles')
      .update({
        customer_id: motorcycle.customer_id,
        make: motorcycle.make.trim(),
        model: motorcycle.model.trim(),
        year: motorcycle.year ?? null,
      })
      .eq('id', byPlate.id)
      .eq('workshop_id', workshopId)
    return byPlate.id
  }

  const { data, error } = await supabase
    .from('motorcycles')
    .insert({
      customer_id: motorcycle.customer_id,
      plate: normalizedPlate,
      make: motorcycle.make.trim(),
      model: motorcycle.model.trim(),
      year: motorcycle.year ?? null,
      workshop_id: workshopId,
    })
    .select('id')
    .single()

  if (error) throw new Error(`Error al registrar motocicleta: ${error.message}`)
  return data.id
}

const FUEL_LABELS: Record<string, string> = {
  empty: 'Vacío',
  low: '1/4',
  half: '1/2',
  high: '3/4',
  full: 'Lleno',
}

export async function createWorkOrder(payload: {
  customer_id: string
  motorcycle_id: string
  mileage: number
  description?: string
  fuel_level: string
  media_urls: string[]
  signature_url?: string | null
}) {
  const supabase = createServerSupabaseClient()
  const { workshopId, userId } = await getWorkshopContext()

  const fuelLabel = FUEL_LABELS[payload.fuel_level] || payload.fuel_level
  const trimmedDesc = payload.description?.trim() || ''
  const fullDescription = [
    `Combustible al ingreso: ${fuelLabel}`,
    trimmedDesc ? trimmedDesc : null,
  ]
    .filter(Boolean)
    .join('\n')

  const { data: order, error } = await supabase
    .from('workorders')
    .insert({
      workshop_id: workshopId,
      customer_id: payload.customer_id,
      motorcycle_id: payload.motorcycle_id,
      mileage: payload.mileage,
      description: fullDescription,
      status: 'received',
      total_amount: 0,
    })
    .select()
    .single()

  if (error || !order) {
    throw new Error(`Error al crear la orden: ${error?.message || 'Desconocido'}`)
  }

  const allMedia = [
    ...(payload.media_urls || []),
    ...(payload.signature_url ? [payload.signature_url] : []),
  ]

  const timelineDesc = [
    `Ingreso registrado (Combustible: ${fuelLabel}).`,
    payload.signature_url ? 'Firma digital de conformidad guardada.' : null,
    trimmedDesc ? `Notas: ${trimmedDesc}` : null,
  ]
    .filter(Boolean)
    .join(' ')

  const { error: timelineError } = await supabase
    .from('order_timeline_events')
    .insert({
      workorder_id: order.id,
      workshop_id: workshopId,
      status: 'received',
      description: timelineDesc,
      media_urls: allMedia.length > 0 ? allMedia : null,
      created_by: userId,
    })

  if (timelineError) {
    console.error('Error creating initial timeline event:', timelineError)
  }

  revalidatePath('/dashboard/orders')
  revalidatePath('/dashboard/vehicles')
  revalidatePath('/mechanic')

  return order
}
