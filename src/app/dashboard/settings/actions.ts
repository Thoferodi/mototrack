'use server'

import { createServerSupabaseClient } from '@/supabase/server'
import { revalidatePath } from 'next/cache'
import { isValidUUID } from '@/lib/workorder-status'
import { MAX_LOGO_BYTES, validateImageFile, validateSafeUrl } from '@/lib/file-validation'
import { sanitizeText } from '@/lib/sanitize'

const SETTINGS_ADMIN_ROLES = new Set(['owner', 'admin', 'manager'])

async function getAuthorizedSettingsContext(expectedWorkshopId?: string) {
  const supabase = createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false as const, error: 'No autorizado.' }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('workshop_id, role, active')
    .eq('id', user.id)
    .single()

  if (profileError || !profile || !profile.workshop_id) {
    return { ok: false as const, error: 'Perfil de taller no encontrado.' }
  }

  if (expectedWorkshopId && profile.workshop_id !== expectedWorkshopId) {
    return { ok: false as const, error: 'No tienes permisos para modificar este taller.' }
  }

  if (profile.active === false) {
    return { ok: false as const, error: 'Tu cuenta está desactivada.' }
  }

  if (!SETTINGS_ADMIN_ROLES.has(profile.role)) {
    return {
      ok: false as const,
      error: 'No tienes permisos para modificar la configuración del taller.',
    }
  }

  return { ok: true as const, supabase, workshopId: profile.workshop_id }
}

export async function uploadWorkshopLogo(
  formData: FormData
): Promise<{ success: boolean; publicUrl?: string; error?: string }> {
  const file = formData.get('file') as File | null
  if (!file || typeof file.arrayBuffer !== 'function') {
    return { success: false, error: 'Archivo de logo inválido.' }
  }

  const auth = await getAuthorizedSettingsContext()
  if (!auth.ok) {
    return { success: false, error: auth.error }
  }

  const validation = await validateImageFile(file, { maxSizeBytes: MAX_LOGO_BYTES })
  if (!validation.valid || !validation.safeName || !validation.detectedType) {
    return { success: false, error: validation.error || 'Archivo de logo no permitido.' }
  }

  const storagePath = `${auth.workshopId}/${validation.safeName}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { data, error: uploadError } = await auth.supabase.storage
    .from('logos')
    .upload(storagePath, buffer, {
      upsert: true,
      contentType: validation.detectedType,
    })

  if (uploadError || !data) {
    console.error('[settings] Error uploading logo:', uploadError?.message)
    return {
      success: false,
      error: 'No se pudo subir el logo al almacenamiento. Intenta nuevamente.',
    }
  }

  const {
    data: { publicUrl },
  } = auth.supabase.storage.from('logos').getPublicUrl(data.path)

  return { success: true, publicUrl }
}

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
  if (!workshopId || !isValidUUID(workshopId)) {
    return { success: false, error: 'Identificador de taller inválido.' }
  }

  const auth = await getAuthorizedSettingsContext(workshopId)
  if (!auth.ok) {
    return { success: false, error: auth.error }
  }

  const cleanName = sanitizeText(data.name, 100)
  if (!cleanName || cleanName.length < 2) {
    return { success: false, error: 'El nombre del taller es requerido (mínimo 2 caracteres).' }
  }

  if (data.logo_url !== null && !validateSafeUrl(data.logo_url)) {
    return { success: false, error: 'La URL del logo debe usar protocolo HTTPS válido.' }
  }

  if (!/^#[0-9A-Fa-f]{3}([0-9A-Fa-f]{3})?$/.test(data.primary_color)) {
    return { success: false, error: 'El color corporativo tiene un formato inválido.' }
  }

  const { error } = await auth.supabase
    .from('workshops')
    .update({
      name: cleanName,
      phone_whatsapp: sanitizeText(data.phone_whatsapp, 25) || null,
      address: sanitizeText(data.address, 200) || null,
      logo_url: data.logo_url,
      primary_color: data.primary_color.toUpperCase(),
    })
    .eq('id', auth.workshopId)

  if (error) {
    console.error('[settings] Error updating workshop:', error.code)
    return { success: false, error: 'No se pudo actualizar la configuración. Intenta de nuevo.' }
  }

  revalidatePath('/', 'layout')
  revalidatePath('/dashboard', 'layout')
  revalidatePath('/dashboard/settings')

  return { success: true }
}
