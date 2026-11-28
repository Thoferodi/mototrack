'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/supabase/server'
import { createAdminSupabaseClient } from '@/supabase/admin'
import { Database } from '@/types/database.types'

export type UserRole = Database['public']['Enums']['user_role']
export type AssignableRole = 'mechanic' | 'receptionist' | 'manager' | 'admin'

export interface TeamMember {
  id: string
  full_name: string
  email: string | null
  role: UserRole
  active: boolean
  created_at: string | null
}

const TEAM_ADMIN_ROLES = new Set<UserRole>(['owner', 'admin', 'manager'])
const PRIVILEGED_ASSIGNABLE_ROLES = new Set<AssignableRole>(['admin', 'manager'])

const createMemberSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'El nombre completo debe tener al menos 2 caracteres.')
    .max(100, 'El nombre completo es demasiado largo.'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Ingresa un correo electrónico válido.'),
  password: z
    .string()
    .min(8, 'La contraseña temporal debe tener al menos 8 caracteres.')
    .max(72, 'La contraseña no puede superar los 72 caracteres.'),
  role: z.enum(['mechanic', 'receptionist', 'manager', 'admin']),
})

const updateRoleSchema = z.object({
  memberId: z.string().uuid('Identificador de miembro inválido.'),
  role: z.enum(['mechanic', 'receptionist', 'manager', 'admin']),
})

const toggleActiveSchema = z.object({
  memberId: z.string().uuid('Identificador de miembro inválido.'),
  active: z.boolean(),
})

interface AuthorizedTeamContext {
  callerId: string
  callerRole: UserRole
  workshopId: string
  adminClient: ReturnType<typeof createAdminSupabaseClient>
}

async function requireTeamAdmin(): Promise<
  { ok: true; ctx: AuthorizedTeamContext } | { ok: false; error: string }
> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      ok: false,
      error:
        'Falta configurar SUPABASE_SERVICE_ROLE_KEY en el servidor para administrar cuentas de equipo.',
    }
  }

  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, error: 'Tu sesión ha expirado. Inicia sesión nuevamente.' }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, workshop_id, role, active')
    .eq('id', user.id)
    .single()

  if (profileError || !profile || !profile.workshop_id) {
    return { ok: false, error: 'No se encontró un perfil de taller válido.' }
  }

  if (profile.active === false) {
    return {
      ok: false,
      error: 'Tu cuenta está desactivada. Contacta al administrador de tu taller.',
    }
  }

  if (!TEAM_ADMIN_ROLES.has(profile.role)) {
    return { ok: false, error: 'No tienes permisos para administrar el equipo.' }
  }

  return {
    ok: true,
    ctx: {
      callerId: user.id,
      callerRole: profile.role,
      workshopId: profile.workshop_id,
      adminClient: createAdminSupabaseClient(),
    },
  }
}

async function countActiveAdmins(
  adminClient: ReturnType<typeof createAdminSupabaseClient>,
  workshopId: string
): Promise<number> {
  const { data, error } = await adminClient
    .from('profiles')
    .select('id, active')
    .eq('workshop_id', workshopId)
    .in('role', ['owner', 'admin', 'manager'])

  if (error || !data) return 0
  return data.filter((row) => row.active !== false).length
}

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

  console.error('[team] Auth create error:', code || 'unknown')
  return 'No se pudo crear la cuenta del miembro. Verifica los datos e intenta de nuevo.'
}

function revalidateTeamPaths() {
  revalidatePath('/dashboard/team')
  revalidatePath('/dashboard', 'layout')
  revalidatePath('/dashboard/orders')
  revalidatePath('/dashboard/orders/new')
}

export async function createTeamMember(input: {
  fullName: string
  email: string
  password: string
  role: AssignableRole
}): Promise<{ success: boolean; member?: TeamMember; error?: string }> {
  const parsed = createMemberSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || 'Datos del formulario inválidos.',
    }
  }

  const auth = await requireTeamAdmin()
  if (!auth.ok) {
    return { success: false, error: auth.error }
  }

  const { ctx } = auth
  const { fullName, email, password, role } = parsed.data

  if (PRIVILEGED_ASSIGNABLE_ROLES.has(role) && ctx.callerRole !== 'owner') {
    return {
      success: false,
      error: 'Solo el propietario del taller puede asignar roles de Administrador o Gerente.',
    }
  }

  try {
    const { data: createdAuth, error: createError } =
      await ctx.adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          workshop_id: ctx.workshopId,
        },
        app_metadata: {
          role,
        },
      })

    if (createError || !createdAuth?.user) {
      return {
        success: false,
        error: mapAuthCreateError(createError || {}),
      }
    }

    const userId = createdAuth.user.id

    const { data: profileData, error: profileError } = await ctx.adminClient
      .from('profiles')
      .upsert(
        {
          id: userId,
          workshop_id: ctx.workshopId,
          full_name: fullName,
          role,
          active: true,
        },
        { onConflict: 'id' }
      )
      .select('id, full_name, role, active, created_at')
      .single()

    if (profileError || !profileData) {
      await ctx.adminClient.auth.admin.deleteUser(userId)
      return {
        success: false,
        error: 'No se pudo registrar el perfil del miembro en el taller.',
      }
    }

    revalidateTeamPaths()

    return {
      success: true,
      member: {
        id: profileData.id,
        full_name: profileData.full_name,
        email: createdAuth.user.email ?? email,
        role: profileData.role,
        active: profileData.active !== false,
        created_at: profileData.created_at,
      },
    }
  } catch (err: unknown) {
    console.error('[team] Error creating team member:', err)
    return {
      success: false,
      error: 'Error inesperado al crear el miembro del equipo.',
    }
  }
}

export async function updateMemberRole(input: {
  memberId: string
  role: AssignableRole
}): Promise<{ success: boolean; error?: string }> {
  const parsed = updateRoleSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || 'Datos inválidos.',
    }
  }

  const auth = await requireTeamAdmin()
  if (!auth.ok) {
    return { success: false, error: auth.error }
  }

  const { ctx } = auth
  const { memberId, role: newRole } = parsed.data

  const { data: target, error: targetError } = await ctx.adminClient
    .from('profiles')
    .select('id, role, active, workshop_id')
    .eq('id', memberId)
    .eq('workshop_id', ctx.workshopId)
    .maybeSingle()

  if (targetError || !target) {
    return { success: false, error: 'Miembro no encontrado en tu taller.' }
  }

  if (target.role === 'owner') {
    return {
      success: false,
      error: 'El rol del propietario del taller no puede modificarse.',
    }
  }

  if (
    ctx.callerRole !== 'owner' &&
    (PRIVILEGED_ASSIGNABLE_ROLES.has(newRole) ||
      target.role === 'admin' ||
      target.role === 'manager')
  ) {
    return {
      success: false,
      error:
        'Solo el propietario del taller puede asignar o modificar roles de Administrador o Gerente.',
    }
  }

  if (target.role === newRole) {
    return { success: true }
  }

  const isTargetCurrentlyActiveAdmin =
    target.active !== false && TEAM_ADMIN_ROLES.has(target.role)
  const isNewRoleAdmin = TEAM_ADMIN_ROLES.has(newRole)

  if (isTargetCurrentlyActiveAdmin && !isNewRoleAdmin) {
    const activeAdmins = await countActiveAdmins(ctx.adminClient, ctx.workshopId)
    if (activeAdmins <= 1) {
      return {
        success: false,
        error:
          memberId === ctx.callerId
            ? 'No puedes rebajar tu propio rol porque eres el único administrador activo del taller.'
            : 'Debe permanecer al menos un administrador activo en el taller.',
      }
    }
  }

  const { error: updateProfileError } = await ctx.adminClient
    .from('profiles')
    .update({ role: newRole })
    .eq('id', memberId)
    .eq('workshop_id', ctx.workshopId)

  if (updateProfileError) {
    return { success: false, error: 'No se pudo actualizar el rol en el perfil.' }
  }

  const { data: existingAuthUser } = await ctx.adminClient.auth.admin.getUserById(memberId)
  const { error: updateAuthError } = await ctx.adminClient.auth.admin.updateUserById(
    memberId,
    {
      app_metadata: {
        ...(existingAuthUser?.user?.app_metadata ?? {}),
        role: newRole,
      },
    }
  )

  if (updateAuthError) {
    // Revertimos el rol en profiles para mantener consistencia estricta con Auth
    await ctx.adminClient
      .from('profiles')
      .update({ role: target.role })
      .eq('id', memberId)
      .eq('workshop_id', ctx.workshopId)

    return {
      success: false,
      error: 'No se pudo sincronizar el rol con el sistema de autenticación.',
    }
  }

  revalidateTeamPaths()
  return { success: true }
}

export async function toggleMemberActive(input: {
  memberId: string
  active: boolean
}): Promise<{ success: boolean; error?: string }> {
  const parsed = toggleActiveSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || 'Datos inválidos.',
    }
  }

  const auth = await requireTeamAdmin()
  if (!auth.ok) {
    return { success: false, error: auth.error }
  }

  const { ctx } = auth
  const { memberId, active: nextActive } = parsed.data

  if (memberId === ctx.callerId && !nextActive) {
    return {
      success: false,
      error: 'No puedes desactivar tu propia cuenta.',
    }
  }

  const { data: target, error: targetError } = await ctx.adminClient
    .from('profiles')
    .select('id, role, active, workshop_id')
    .eq('id', memberId)
    .eq('workshop_id', ctx.workshopId)
    .maybeSingle()

  if (targetError || !target) {
    return { success: false, error: 'Miembro no encontrado en tu taller.' }
  }

  if (target.role === 'owner') {
    return {
      success: false,
      error: 'No es posible desactivar la cuenta del propietario del taller.',
    }
  }

  if (
    ctx.callerRole !== 'owner' &&
    (target.role === 'admin' || target.role === 'manager')
  ) {
    return {
      success: false,
      error:
        'Solo el propietario del taller puede activar o desactivar administradores o gerentes.',
    }
  }

  const currentActive = target.active !== false
  if (currentActive === nextActive) {
    return { success: true }
  }

  if (!nextActive && TEAM_ADMIN_ROLES.has(target.role)) {
    const activeAdmins = await countActiveAdmins(ctx.adminClient, ctx.workshopId)
    if (activeAdmins <= 1) {
      return {
        success: false,
        error: 'Debe permanecer al menos un administrador activo en el taller.',
      }
    }
  }

  const { error: updateProfileError } = await ctx.adminClient
    .from('profiles')
    .update({ active: nextActive })
    .eq('id', memberId)
    .eq('workshop_id', ctx.workshopId)

  if (updateProfileError) {
    return {
      success: false,
      error: 'No se pudo actualizar el estado del miembro en la base de datos.',
    }
  }

  const { error: banError } = await ctx.adminClient.auth.admin.updateUserById(
    memberId,
    {
      ban_duration: nextActive ? 'none' : '876000h',
    }
  )

  if (banError) {
    await ctx.adminClient
      .from('profiles')
      .update({ active: target.active })
      .eq('id', memberId)
      .eq('workshop_id', ctx.workshopId)

    return {
      success: false,
      error: 'No se pudo sincronizar el bloqueo de sesión en autenticación.',
    }
  }

  revalidateTeamPaths()
  return { success: true }
}
