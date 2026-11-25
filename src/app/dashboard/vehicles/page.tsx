import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/supabase/server'
import { VehiclesManager, VehicleWithHistory, CustomerOption } from './VehiclesManager'

export default async function VehiclesHistoryPage() {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('workshop_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  const [{ data: vehicles, error: vehiclesError }, { data: customers }] = await Promise.all([
    supabase
      .from('motorcycles')
      .select(`
        *,
        customers (id, full_name, phone),
        workorders (id, status, mileage, description, total_amount, created_at)
      `)
      .eq('workshop_id', profile.workshop_id)
      .order('created_at', { ascending: false }),
    supabase
      .from('customers')
      .select('id, full_name, phone')
      .eq('workshop_id', profile.workshop_id)
      .order('full_name', { ascending: true }),
  ])

  if (vehiclesError) {
    console.error('Error fetching vehicles:', vehiclesError)
    return (
      <div className="p-6">
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl text-sm font-medium">
          Error al cargar el listado de vehículos.
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6">
      <VehiclesManager
        vehicles={(vehicles as unknown as VehicleWithHistory[]) || []}
        customers={(customers as CustomerOption[]) || []}
      />
    </div>
  )
}
