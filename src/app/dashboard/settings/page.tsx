import { createServerSupabaseClient } from '@/supabase/server'
import { SettingsForm } from './SettingsForm'
import { redirect } from 'next/navigation'

export default async function SettingsPage() {
  const supabase = createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('workshop_id')
    .eq('id', user.id)
    .single()

  if (profileError || !profile || !profile.workshop_id) {
    console.error('Error fetching profile:', profileError)
    return (
      <div className="p-6">
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl text-sm font-medium">
          Error al cargar el perfil del usuario o taller asociado.
        </div>
      </div>
    )
  }

  const { data: workshop, error: workshopError } = await supabase
    .from('workshops')
    .select('id, name, phone_whatsapp, address, logo_url, primary_color')
    .eq('id', profile.workshop_id)
    .single()

  if (workshopError || !workshop) {
    console.error('Error fetching workshop:', workshopError)
    return (
      <div className="p-6">
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl text-sm font-medium">
          Error al cargar la configuración del taller.
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuración del Taller</h1>
        <p className="text-muted-foreground text-sm">
          Personaliza la identidad y contacto de tu negocio.
        </p>
      </div>

      <SettingsForm workshop={workshop} />
    </div>
  )
}
