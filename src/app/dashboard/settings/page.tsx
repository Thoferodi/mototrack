import { createServerSupabaseClient } from '@/supabase/server'
import { SettingsForm } from './SettingsForm'
import { redirect } from 'next/navigation'

export default async function SettingsPage() {
  const supabase = createServerSupabaseClient()

  // 1. Obtener sesión
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    redirect('/login')
  }

  // 2. Obtener perfil para sacar el workshop_id
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('workshop_id')
    .eq('id', session.user.id)
    .single()

  if (profileError || !profile) {
    console.error('Error fetching profile:', profileError)
    return <div>Error al cargar el perfil del usuario.</div>
  }

  // 3. Obtener datos del taller
  const { data: workshop, error: workshopError } = await supabase
    .from('workshops')
    .select('*')
    .eq('id', profile.workshop_id)
    .single()

  if (workshopError || !workshop) {
    console.error('Error fetching workshop:', workshopError)
    return <div>Error al cargar la configuración del taller.</div>
  }

  return (
    <div className="p-4 md:p-6 space-y-6 bg-slate-50/50 min-h-screen">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuración del Taller</h1>
        <p className="text-muted-foreground">Personaliza la identidad y contacto de tu negocio.</p>
      </div>

      <SettingsForm workshop={workshop} />
    </div>
  )
}
