import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createAdminSupabaseClient } from '@/supabase/admin'
import { validateSafeUrl } from '@/lib/sanitize'
import { WorkshopSiteClient } from '@/components/workshop-site/WorkshopSiteClient'
import {
  CURATED_FALLBACK_SERVICES,
  inferServiceCategory,
} from '@/components/workshop-site/fallback-services'
import type {
  PublicServiceItem,
  PublicWorkshopData,
} from '@/components/workshop-site/types'

export const dynamic = 'force-dynamic'

interface WorkshopPageProps {
  params: {
    workshopSlug: string
  }
}

async function fetchPublicWorkshop(
  workshopSlug: string
): Promise<PublicWorkshopData | null> {
  const supabase = createAdminSupabaseClient()
  const { data, error } = await supabase
    .from('workshops')
    .select('id, name, slug, logo_url, address, phone_whatsapp, primary_color')
    .eq('slug', workshopSlug)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  return {
    ...data,
    logo_url: data.logo_url && validateSafeUrl(data.logo_url) ? data.logo_url : null,
  }
}

export async function generateMetadata({
  params,
}: WorkshopPageProps): Promise<Metadata> {
  const workshop = await fetchPublicWorkshop(params.workshopSlug)

  if (!workshop) {
    return {
      title: 'Taller no encontrado | MotoTrack',
      description: 'El micrositio del taller solicitado no existe o no está disponible.',
    }
  }

  const locationSuffix = workshop.address ? ` en ${workshop.address}` : ''
  const title = `${workshop.name} | Taller de Motos y Seguimiento en Vivo`
  const description = `Consulta el estado de tu motocicleta en tiempo real, revisa nuestros servicios especializados y agenda tu cita por WhatsApp con ${workshop.name}${locationSuffix}.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'es_CO',
      siteName: workshop.name,
      ...(workshop.logo_url ? { images: [{ url: workshop.logo_url, alt: workshop.name }] } : {}),
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  }
}

export default async function WorkshopPublicPage({ params }: WorkshopPageProps) {
  const workshop = await fetchPublicWorkshop(params.workshopSlug)

  if (!workshop) {
    notFound()
  }

  const supabase = createAdminSupabaseClient()

  // Consultas estrictamente filtradas por workshop_id; sin exponer PII, placas ni costos internos
  const [catalogResult, ordersCountResult] = await Promise.all([
    supabase
      .from('catalog_items')
      .select('id, name, notes, default_price, sku')
      .eq('workshop_id', workshop.id)
      .eq('type', 'labor')
      .order('created_at', { ascending: true })
      .limit(8),
    supabase
      .from('work_orders')
      .select('id', { count: 'exact', head: true })
      .eq('workshop_id', workshop.id),
  ])

  const catalogRows = catalogResult.data || []
  const hasRealCatalog = catalogRows.length > 0

  const services: PublicServiceItem[] = hasRealCatalog
    ? catalogRows.map((row) => ({
        id: row.id,
        name: row.name,
        description:
          row.notes?.trim() ||
          'Servicio técnico especializado con diagnóstico previo y seguimiento en línea.',
        default_price: Number.isFinite(Number(row.default_price))
          ? Number(row.default_price)
          : null,
        sku: row.sku || null,
        isFallback: false,
        categoryKey: inferServiceCategory(row.name),
      }))
    : CURATED_FALLBACK_SERVICES

  const orderCount = typeof ordersCountResult.count === 'number' ? ordersCountResult.count : 0

  return (
    <WorkshopSiteClient
      workshop={workshop}
      services={services}
      hasRealCatalog={hasRealCatalog}
      orderCount={orderCount}
    />
  )
}
