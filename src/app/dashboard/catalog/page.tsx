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

  if (!profile) {
    redirect('/login')
  }

  const { data: workshop, error } = await supabase
    .from('workshops')
    .select('settings')
    .eq('id', profile.workshop_id)
    .single()

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

  const catalogItems: CatalogItem[] = Array.isArray((workshop?.settings as any)?.catalog)
    ? (workshop?.settings as any).catalog
    : []

  return (
    <div className="p-4 md:p-6">
      <CatalogManager initialItems={catalogItems} />
    </div>
  )
}
