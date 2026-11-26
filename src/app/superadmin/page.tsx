import { notFound, redirect } from 'next/navigation'
import { createAdminSupabaseClient } from '@/supabase/admin'
import { getAuthenticatedSuperAdmin } from './auth'
import { SuperadminWorkshopRow } from './actions'
import { OnboardingManager } from './OnboardingManager'

export const dynamic = 'force-dynamic'

export default async function SuperadminPage() {
  const auth = await getAuthenticatedSuperAdmin()

  if (auth.status === 'unauthenticated') {
    redirect('/login')
  }

  if (auth.status === 'forbidden') {
    notFound()
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return (
      <div className="min-h-screen bg-[#08090C] text-slate-100 p-6 flex items-center justify-center">
        <div className="max-w-lg w-full rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-sm text-rose-200">
          Falta configurar <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code> en el
          entorno del servidor para operar el panel de superadministrador.
        </div>
      </div>
    )
  }

  const adminClient = createAdminSupabaseClient()

  const [workshopsRes, profilesRes, ordersRes] = await Promise.all([
    adminClient
      .from('workshops')
      .select('id, name, slug, plan_type, phone_whatsapp, address, primary_color, created_at')
      .order('created_at', { ascending: false }),
    adminClient.from('profiles').select('workshop_id, active'),
    adminClient.from('work_orders').select('workshop_id'),
  ])

  if (workshopsRes.error) {
    console.error('Error loading workshops for superadmin:', workshopsRes.error)
    return (
      <div className="min-h-screen bg-[#08090C] text-slate-100 p-6 flex items-center justify-center">
        <div className="max-w-lg w-full rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-sm text-rose-200">
          Error al cargar el listado de talleres. Intenta recargar la página.
        </div>
      </div>
    )
  }

  const activeUsersByWorkshop = new Map<string, number>()
  for (const profile of profilesRes.data || []) {
    if (!profile.workshop_id || profile.active === false) continue
    activeUsersByWorkshop.set(
      profile.workshop_id,
      (activeUsersByWorkshop.get(profile.workshop_id) || 0) + 1
    )
  }

  const ordersByWorkshop = new Map<string, number>()
  for (const order of ordersRes.data || []) {
    if (!order.workshop_id) continue
    ordersByWorkshop.set(order.workshop_id, (ordersByWorkshop.get(order.workshop_id) || 0) + 1)
  }

  const workshops: SuperadminWorkshopRow[] = (workshopsRes.data || []).map((w) => ({
    id: w.id,
    name: w.name,
    slug: w.slug,
    plan_type: w.plan_type || 'free',
    phone_whatsapp: w.phone_whatsapp,
    address: w.address,
    primary_color: w.primary_color,
    created_at: w.created_at,
    activeUsersCount: activeUsersByWorkshop.get(w.id) || 0,
    ordersCount: ordersByWorkshop.get(w.id) || 0,
  }))

  return (
    <OnboardingManager
      initialWorkshops={workshops}
      superadminEmail={auth.user.email || ''}
    />
  )
}
