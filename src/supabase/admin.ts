import 'server-only'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'
import { createServerSupabaseClient } from './server'

/**
 * Cliente de servidor con Service Role Key para operaciones que requieren
 * bypassear RLS: tracking público, aprobaciones sin login, cron jobs, superadmin.
 * 
 * SEGURIDAD: Importar 'server-only' garantiza error en tiempo de compilación
 * si este módulo se importa desde un Client Component ("use client").
 * La Service Role Key NUNCA debe llegar al bundle del navegador.
 */
export function createAdminSupabaseClient(): SupabaseClient<Database> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    // En producción, esto indica una configuración rota — fallback al cliente normal
    // para no crashear, pero las operaciones admin fallarán con error RLS.
    console.error('[admin] Missing SUPABASE_SERVICE_ROLE_KEY — falling back to anon client')
    return createServerSupabaseClient()
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
