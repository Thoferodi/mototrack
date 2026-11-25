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

  if (!profile || !profile.workshop_id) {
    redirect('/login')
  }

  const [{ data: vehicles, error: vehiclesError }, { data: customers }] = await Promise.all([
    supabase
      .from('motorcycles')
      .select(`
        id,
        workshop_id,
        customer_id,
        license_plate,
        brand,
        model,
        year,
        customers (id, full_name, phone_whatsapp),
        work_orders (
          id,
          order_number,
          status,
          mileage_in,
          customer_notes,
          created_at,
          order_items (quantity, unit_price, approved)
        )
      `)
      .eq('workshop_id', profile.workshop_id)
      .order('license_plate', { ascending: true }),
    supabase
      .from('customers')
      .select('id, full_name, phone_whatsapp')
      .eq('workshop_id', profile.workshop_id)
      .order('full_name', { ascending: true }),
  ])

  if (vehiclesError) {
    console.error('Error fetching vehicles:', vehiclesError)
    return (
      <div className="p-6">
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-200 p-4 rounded-xl text-sm font-medium">
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
