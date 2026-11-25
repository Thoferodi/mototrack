import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/supabase/server'
import { CatalogManager } from './CatalogManager'
import { CatalogItem } from './actions'

export const dynamic = 'force-dynamic'

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

  const { data: catalogRows, error: catalogError } = await supabase
    .from('catalog_items')
    .select('id, name, type, default_price, sku, notes')
    .eq('workshop_id', profile.workshop_id)
    .order('created_at', { ascending: false })

  let catalogItems: CatalogItem[] = []

  if (!catalogError) {
    catalogItems = (catalogRows || []).map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      default_price: Number(row.default_price ?? 0),
      sku: row.sku || undefined,
      notes: row.notes || undefined,
    }))
  } else {
    // Fallback seguro si la tabla catalog_items aún no ha sido creada en Supabase
    const isMissingTable =
      catalogError.code === '42P01' ||
      catalogError.code === 'PGRST205' ||
      Boolean(catalogError.message?.toLowerCase().includes('catalog_items'))

    if (!isMissingTable) {
      console.error('Error fetching catalog:', catalogError)
      return (
        <div className="p-6">
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-200 p-4 rounded-xl text-sm font-medium">
            Error al cargar el catálogo del taller.
          </div>
        </div>
      )
    }

    const { data: orderItems } = await supabase
      .from('order_items')
      .select('id, description, type, unit_price')
      .eq('workshop_id', profile.workshop_id)
      .order('description', { ascending: true })

    const seen = new Set<string>()
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
  }

  return (
    <div className="p-4 md:p-6">
      <CatalogManager initialItems={catalogItems} />
    </div>
  )
}
