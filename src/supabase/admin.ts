import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from './server'

/**
 * Cliente de servidor para operaciones públicas validadas (tracking_token, buscador por placa + teléfono,
 * aprobación de presupuesto sin login). Usa Service Role Key si está disponible para operar bajo RLS estricto.
 */
export function createAdminSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (supabaseUrl && serviceRoleKey) {
    return createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  }

  return createServerSupabaseClient()
}
