import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/supabase/server'
import { sortMechanicsFirst, WorkshopMechanicOption } from '@/lib/team'
import { NewOrderForm } from './NewOrderForm'

export const dynamic = 'force-dynamic'

export default async function NewOrderPage() {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('workshop_id, role, active')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.workshop_id) {
    redirect('/login')
  }

  if (profile.active === false) {
    redirect('/login?error=account_disabled')
  }

  if (profile.role === 'mechanic') {
    redirect('/mechanic')
  }

  const { data: members } = await supabase
    .from('profiles')
    .select('id, full_name, role, active')
    .eq('workshop_id', profile.workshop_id)
    .neq('active', false)

  const teamMembers: WorkshopMechanicOption[] = sortMechanicsFirst(
    (members || []).map((m) => ({
      id: m.id,
      full_name: m.full_name,
      role: m.role,
      active: m.active !== false,
    }))
  )

  return <NewOrderForm teamMembers={teamMembers} />
}
