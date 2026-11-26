import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/supabase/server'
import { DashboardShell } from './DashboardShell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('workshop_id, full_name, role, active')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  if (profile.active === false) {
    redirect('/login?error=account_disabled')
  }

  if (profile.role === 'mechanic') {
    redirect('/mechanic')
  }

  if (!profile.workshop_id) {
    redirect('/login')
  }

  const { data: workshop } = await supabase
    .from('workshops')
    .select('id, name, slug, logo_url, primary_color')
    .eq('id', profile.workshop_id)
    .single()

  const primaryColor = workshop?.primary_color || '#EA580C'

  return (
    <DashboardShell
      workshop={{
        name: workshop?.name || 'Mi Taller',
        slug: workshop?.slug || '',
        logoUrl: workshop?.logo_url || null,
        primaryColor,
      }}
      user={{
        name: profile.full_name || user.email || 'Usuario',
        role: profile.role,
      }}
    >
      {children}
    </DashboardShell>
  )
}
