import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/supabase/server'
import { CatalogManager } from './CatalogManager'
import { CatalogItem } from './actions'

export default async function CatalogPage() {
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

  const { data: orderItems, error } = await supabase
    .from('order_items')
    .select('id, description, type, unit_price')
    .eq('workshop_id', profile.workshop_id)
    .order('description', { ascending: true })

  if (error) {
    console.error('Error fetching catalog:', error)
    return (
      <div className="p-6">
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl text-sm font-medium">
          Error al cargar el catálogo del taller.
        </div>
      </div>
    )
  }

  // Deduplicar ítems históricos por descripción y tipo para mostrarlos como catálogo sugerido
  const seen = new Set<string>()
  const catalogItems: CatalogItem[] = []
  for (const item of orderItems || []) {
    const key = `${item.type}:${item.description.trim().toLowerCase()}`
    if (seen.has(key)) continue
    seen.add(key)
    catalogItems.push({
      id: item.id,
      name: item.description,
      type: item.type,
      default_price: Number(item.unit_price ?? 0),
    })
  }

  return (
    <div className="p-4 md:p-6">
      <CatalogManager initialItems={catalogItems} />
    </div>
  )
}
