'use server'

import { createServerSupabaseClient } from '@/supabase/server'
import { redirect } from 'next/navigation'
import { Database } from '@/types/database.types'

type UserRole = Database['public']['Enums']['user_role']

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'El email y la contraseña son requeridos' }
  }

  const supabase = createServerSupabaseClient()

  const { data, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authError) {
    return { error: 'Credenciales inválidas o error de conexión' }
  }

  // Consulta de perfil para ruteo inteligente
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()

  if (profileError || !profile) {
    // Si no hay perfil, cerramos sesión por seguridad
    await supabase.auth.signOut()
    return { error: 'No se encontró un perfil asociado a esta cuenta' }
  }

  const role = String(profile.role)

  // Ruteo inteligente por rol (soporta admin/owner/manager/receptionist/mechanic)
  if (role === 'mechanic') {
    redirect('/mechanic')
  } else if (
    role === 'admin' ||
    role === 'owner' ||
    role === 'manager' ||
    role === 'receptionist'
  ) {
    redirect('/dashboard/orders')
  }

  return { error: 'Rol no reconocido' }
}

export async function signOut() {
  const supabase = createServerSupabaseClient()
  await supabase.auth.signOut()
  redirect('/login')
}
