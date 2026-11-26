'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createAdminSupabaseClient } from '@/supabase/admin'
import { Constants, Database } from '@/types/database.types'
import { getAuthenticatedSuperAdmin } from './auth'

export type WorkshopPlan = Database['public']['Enums']['workshop_plan']

export interface SuperadminWorkshopRow {
  id: string
  name: string
  slug: string
  plan_type: WorkshopPlan
  phone_whatsapp: string | null
  address: string | null
  primary_color: string | null
  created_at: string | null
  activeUsersCount: number
  ordersCount: number
}

export interface OnboardingDeliveryCredentials {
  workshopName: string
  slug: string
  planType: WorkshopPlan
  phoneWhatsapp: string
  ownerName: string
  ownerEmail: string
  tempPassword: string
  loginPath: string
  publicSitePath: string
}

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/

const createWorkshopSchema = z.object({
  workshopName: z
    .string()
    .trim()
    .min(2, 'El nombre del taller debe tener al menos 2 caracteres.')
    .max(100, 'El nombre del taller no puede superar los 100 caracteres.'),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'El slug debe tener al menos 3 caracteres.')
    .max(60, 'El slug no puede superar los 60 caracteres.')
    .regex(
      SLUG_REGEX,
      'El slug solo puede contener letras minúsculas, números y guiones medios (sin espacios ni guiones al inicio o final).'
    ),
  phoneWhatsapp: z
    .string()
    .trim()
    .min(7, 'Ingresa un número de WhatsApp válido.')
    .max(25, 'El número de WhatsApp es demasiado largo.'),
  address: z
    .string()
    .trim()
    .max(200, 'La dirección no puede superar los 200 caracteres.')
    .optional()
    .or(z.literal('')),
  primaryColor: z
    .string()
    .trim()
    .regex(HEX_COLOR_REGEX, 'El color corporativo debe tener formato hexadecimal (#RRGGBB).'),
  planType: z.enum(Constants.public.Enums.workshop_plan),
  ownerFullName: z
    .string()
    .trim()
    .min(2, 'El nombre del propietario debe tener al menos 2 caracteres.')
    .max(100, 'El nombre del propietario es demasiado largo.'),
  ownerEmail: z
    .string()
    .trim()
    .toLowerCase()
    .email('Ingresa un correo electrónico válido para el propietario.'),
  ownerPassword: z
    .string()
    .min(8, 'La contraseña temporal debe tener al menos 8 caracteres.')
    .max(72, 'La contraseña temporal no puede superar los 72 caracteres.'),
})

function mapAuthCreateError(error: { message?: string; code?: string }): string {
  const code = error.code?.toLowerCase() || ''
  const msg = error.message?.toLowerCase() || ''

  if (
    code === 'email_exists' ||
    code === 'user_already_exists' ||
    msg.includes('already been registered') ||
    msg.includes('already exists')
  ) {
    return 'Ya existe una cuenta registrada con ese correo electrónico.'
  }

  if (code === 'weak_password' || msg.includes('password')) {
    return 'La contraseña temporal no cumple los requisitos mínimos (mínimo 8 caracteres).'
  }

  if (msg.includes('email')) {
    return 'El correo electrónico proporcionado no es válido.'
  }

  return error.message || 'No se pudo crear la cuenta del propietario en autenticación.'
}

async function isEmailOccupiedInAuth(
  adminClient: ReturnType<typeof createAdminSupabaseClient>,
  targetEmail: string
): Promise<{ occupied: boolean; error?: string }> {
  const normalized = targetEmail.trim().toLowerCase()
  const perPage = 200

  for (let page = 1; page <= 25; page++) {
    const { data, error } = await adminClient.auth.admin.listUsers({
      page,
      perPage,
    })

    if (error) {
      return {
        occupied: false,
        error: 'No se pudo verificar la disponibilidad del correo electrónico.',
      }
    }

    const users = data?.users || []
    if (users.some((u) => (u.email || '').trim().toLowerCase() === normalized)) {
      return { occupied: true }
    }

    if (users.length < perPage) {
      break
    }
  }

  return { occupied: false }
}

export async function createWorkshopWithOwner(input: {
  workshopName: string
  slug: string
  phoneWhatsapp: string
  address?: string
  primaryColor: string
  planType: WorkshopPlan
  ownerFullName: string
  ownerEmail: string
  ownerPassword: string
}): Promise<{
  success: boolean
  workshop?: SuperadminWorkshopRow
  credentials?: OnboardingDeliveryCredentials
  error?: string
}> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      success: false,
      error:
        'Falta configurar SUPABASE_SERVICE_ROLE_KEY en el servidor para crear talleres y usuarios.',
    }
  }

  const auth = await getAuthenticatedSuperAdmin()
  if (auth.status !== 'authorized') {
    return {
      success: false,
      error: 'No autorizado. Esta acción requiere permisos de superadministrador.',
    }
  }

  const parsed = createWorkshopSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || 'Datos del formulario inválidos.',
    }
  }

  const {
    workshopName,
    slug,
    phoneWhatsapp,
    address,
    primaryColor,
    planType,
    ownerFullName,
    ownerEmail,
    ownerPassword,
  } = parsed.data

  const adminClient = createAdminSupabaseClient()

  // Paso A: Validar unicidad de slug y correo antes de insertar
  const { data: existingWorkshop, error: slugCheckError } = await adminClient
    .from('workshops')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (slugCheckError) {
    return {
      success: false,
      error: 'No se pudo validar la disponibilidad del slug en la base de datos.',
    }
  }

  if (existingWorkshop) {
    return {
      success: false,
      error: `El slug "${slug}" ya está en uso por otro taller. Elige uno distinto.`,
    }
  }

  const emailCheck = await isEmailOccupiedInAuth(adminClient, ownerEmail)
  if (emailCheck.error) {
    return { success: false, error: emailCheck.error }
  }
  if (emailCheck.occupied) {
    return {
      success: false,
      error: `El correo "${ownerEmail}" ya está registrado en el sistema.`,
    }
  }

  // Paso B: Insertar el taller en public.workshops
  const { data: createdWorkshop, error: workshopInsertError } = await adminClient
    .from('workshops')
    .insert({
      name: workshopName,
      slug,
      phone_whatsapp: phoneWhatsapp,
      address: address ? address : null,
      primary_color: primaryColor.toUpperCase(),
      plan_type: planType,
    })
    .select('id, name, slug, plan_type, phone_whatsapp, address, primary_color, created_at')
    .single()

  if (workshopInsertError || !createdWorkshop) {
    if (workshopInsertError?.code === '23505') {
      return {
        success: false,
        error: `El slug "${slug}" ya fue asignado a otro taller.`,
      }
    }
    return {
      success: false,
      error:
        workshopInsertError?.message ||
        'No se pudo registrar el nuevo taller en la base de datos.',
    }
  }

  // Paso C: Crear usuario owner en Auth y asegurar perfil en public.profiles (con rollback obligatorio)
  let createdAuthUserId: string | null = null

  const rollbackWorkshopAndUser = async () => {
    if (createdAuthUserId) {
      try {
        await adminClient.auth.admin.deleteUser(createdAuthUserId)
      } catch (rollbackAuthErr) {
        console.error('Rollback auth user error:', rollbackAuthErr)
      }
    }

    try {
      await adminClient.from('workshops').delete().eq('id', createdWorkshop.id)
    } catch (rollbackWorkshopErr) {
      console.error('Rollback workshop error:', rollbackWorkshopErr)
    }
  }

  try {
    const { data: createdAuth, error: createUserError } =
      await adminClient.auth.admin.createUser({
        email: ownerEmail,
        password: ownerPassword,
        email_confirm: true,
        user_metadata: {
          full_name: ownerFullName,
          workshop_id: createdWorkshop.id,
        },
        app_metadata: {
          role: 'owner',
        },
      })

    if (createUserError || !createdAuth?.user) {
      await rollbackWorkshopAndUser()
      return {
        success: false,
        error: mapAuthCreateError(createUserError || {}),
      }
    }

    createdAuthUserId = createdAuth.user.id

    const { error: profileError } = await adminClient.from('profiles').upsert(
      {
        id: createdAuthUserId,
        workshop_id: createdWorkshop.id,
        full_name: ownerFullName,
        role: 'owner',
        active: true,
      },
      { onConflict: 'id' }
    )

    if (profileError) {
      await rollbackWorkshopAndUser()
      return {
        success: false,
        error:
          'No se pudo crear el perfil del propietario en el taller. Se revirtió la creación del taller.',
      }
    }
  } catch (err: any) {
    await rollbackWorkshopAndUser()
    console.error('Unexpected error during superadmin onboarding Paso C:', err)
    return {
      success: false,
      error:
        err?.message ||
        'Ocurrió un error inesperado al crear el propietario. Se revirtió la creación del taller.',
    }
  }

  revalidatePath('/superadmin')
  revalidatePath(`/t/${createdWorkshop.slug}`)

  return {
    success: true,
    workshop: {
      id: createdWorkshop.id,
      name: createdWorkshop.name,
      slug: createdWorkshop.slug,
      plan_type: createdWorkshop.plan_type || planType,
      phone_whatsapp: createdWorkshop.phone_whatsapp,
      address: createdWorkshop.address,
      primary_color: createdWorkshop.primary_color,
      created_at: createdWorkshop.created_at,
      activeUsersCount: 1,
      ordersCount: 0,
    },
    credentials: {
      workshopName: createdWorkshop.name,
      slug: createdWorkshop.slug,
      planType: createdWorkshop.plan_type || planType,
      phoneWhatsapp,
      ownerName: ownerFullName,
      ownerEmail: ownerEmail,
      tempPassword: ownerPassword,
      loginPath: '/login',
      publicSitePath: `/t/${createdWorkshop.slug}`,
    },
  }
}
