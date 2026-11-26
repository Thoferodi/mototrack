import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/supabase/server'
import { createAdminSupabaseClient } from '@/supabase/admin'
import { TeamMember } from './actions'
import { TeamManager } from './TeamManager'

export const dynamic = 'force-dynamic'

const TEAM_ALLOWED_ROLES = new Set(['owner', 'admin', 'manager'])

async function fetchEmailsByIds(userIds: string[]): Promise<Map<string, string | null>> {
  const emailMap = new Map<string, string | null>()
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || userIds.length === 0) {
    return emailMap
  }

  const adminClient = createAdminSupabaseClient()
  const chunkSize = 15

  for (let i = 0; i < userIds.length; i += chunkSize) {
    const chunk = userIds.slice(i, i + chunkSize)
    const results = await Promise.all(
      chunk.map(async (id) => {
        try {
          const { data, error } = await adminClient.auth.admin.getUserById(id)
          if (error || !data?.user) return [id, null] as const
          return [id, data.user.email ?? null] as const
        } catch {
          return [id, null] as const
        }
      })
    )
    for (const [id, email] of results) {
      emailMap.set(id, email)
    }
  }

  return emailMap
}

export default async function TeamPage() {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('id, workshop_id, role, active')
    .eq('id', user.id)
    .single()

  if (!currentProfile || !currentProfile.workshop_id) {
    redirect('/login')
  }

  if (currentProfile.active === false) {
    redirect('/login?error=account_disabled')
  }

  if (currentProfile.role === 'mechanic') {
    redirect('/mechanic')
  }

  if (!TEAM_ALLOWED_ROLES.has(currentProfile.role)) {
    redirect('/dashboard/orders')
  }

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, role, active, created_at')
    .eq('workshop_id', currentProfile.workshop_id)
    .order('created_at', { ascending: true })

  if (profilesError) {
    console.error('Error fetching workshop team:', profilesError)
    return (
      <div className="p-6">
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-200 p-4 rounded-xl text-sm font-medium">
          Error al cargar los miembros del equipo. Intenta recargar la página.
        </div>
      </div>
    )
  }

  const rows = profiles || []
  const emailMap = await fetchEmailsByIds(rows.map((p) => p.id))

  const members: TeamMember[] = rows.map((row) => ({
    id: row.id,
    full_name: row.full_name,
    email: emailMap.get(row.id) ?? null,
    role: row.role,
    active: row.active !== false,
    created_at: row.created_at,
  }))

  return (
    <div className="p-4 md:p-6">
      <TeamManager
        initialMembers={members}
        currentUserId={user.id}
        currentUserRole={currentProfile.role}
      />
    </div>
  )
}
