'use server'

import { createServerSupabaseClient } from '@/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { Database } from '@/types/database.types'
import { isSuperAdminEmail } from '@/app/superadmin/auth'
import { checkRateLimit, clearRateLimit, getClientIp } from '@/lib/rate-limit'
import { normalizeEmail } from '@/lib/sanitize'

type UserRole = Database['public']['Enums']['user_role']

// Límites de rate limiting para login
const LOGIN_WINDOW_MS = 15 * 60 * 1000  // 15 minutos
const LOGIN_MAX_ATTEMPTS = 5             // 5 intentos fallidos por ventana

export async function signIn(formData: FormData) {
  const rawEmail = formData.get('email') as string
  const password = formData.get('password') as string

  if (!rawEmail || !password) {
    return { error: 'El email y la contraseña son requeridos' }
  }

  const email = normalizeEmail(rawEmail)

  // Rate limiting por IP antes de validar formato de correo (frena spam automatizado)
  const headersList = headers()
  const clientIp = getClientIp(headersList as unknown as Headers)

  const ipCheck = checkRateLimit({
    action: 'login_ip',
    identifier: clientIp,
    limit: LOGIN_MAX_ATTEMPTS,
    windowMs: LOGIN_WINDOW_MS,
  })

  if (!ipCheck.allowed) {
    const retryMin = Math.ceil(ipCheck.retryAfterMs / 60000)
    return {
      error: `Demasiados intentos fallidos. Por favor espera ${retryMin} minuto(s) antes de intentar de nuevo.`,
    }
  }

  // Validación básica de formato email
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Credenciales inválidas o error de conexión' }
  }

  const emailCheck = checkRateLimit({
    action: 'login_email',
    identifier: email,
    limit: LOGIN_MAX_ATTEMPTS,
    windowMs: LOGIN_WINDOW_MS,
  })

  if (!emailCheck.allowed) {
    const retryMin = Math.ceil(emailCheck.retryAfterMs / 60000)
    return {
      error: `Demasiados intentos fallidos. Por favor espera ${retryMin} minuto(s) antes de intentar de nuevo.`,
    }
  }

  const supabase = createServerSupabaseClient()

  const { data, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authError) {
    // No revelar si el correo existe: mensaje siempre genérico
    const msg = authError.message?.toLowerCase() || ''
    if (authError.code === 'user_banned' || msg.includes('banned')) {
      // La cuenta está baneada en Supabase Auth: esto ocurre DESPUÉS de credenciales válidas
      // Limpiar contador de rate limit para no penalizar al usuario desactivado
      clearRateLimit('login_email', email)
      return {
        error: 'Tu cuenta está desactivada. Contacta al administrador de tu taller.',
      }
    }
    // Credenciales inválidas: NO revelar si es email o contraseña
    return { error: 'Credenciales inválidas o error de conexión' }
  }

  // Login exitoso: limpiar rate limit
  clearRateLimit('login_ip', clientIp)
  clearRateLimit('login_email', email)

  // Consulta de perfil para ruteo inteligente y validación de estado activo
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, active')
    .eq('id', data.user.id)
    .single()

  if (profileError || !profile) {
    if (isSuperAdminEmail(data.user.email)) {
      redirect('/superadmin')
    }
    // Si no hay perfil, cerramos sesión por seguridad
    await supabase.auth.signOut()
    return { error: 'No se encontró un perfil asociado a esta cuenta' }
  }

  if (profile.active === false) {
    await supabase.auth.signOut()
    return {
      error: 'Tu cuenta está desactivada. Contacta al administrador de tu taller.',
    }
  }

  const role = String(profile.role)

  // Ruteo inteligente por rol
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
