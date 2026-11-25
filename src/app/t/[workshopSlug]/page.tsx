import { createAdminSupabaseClient } from '@/supabase/admin'
import { notFound } from 'next/navigation'
import { BuscadorPlaca } from './BuscadorPlaca'
import { MapPin, Phone, MessageSquare, CheckCircle2, Clock, ShieldCheck, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

interface WorkshopPageProps {
  params: {
    workshopSlug: string
  }
}

export default async function WorkshopPublicPage({ params }: WorkshopPageProps) {
  const supabase = createAdminSupabaseClient()

  // Obtener datos públicos del taller por slug
  const { data: workshop, error } = await supabase
    .from('workshops')
    .select('id, name, slug, logo_url, address, phone_whatsapp, primary_color')
    .eq('slug', params.workshopSlug)
    .single()

  if (error || !workshop) {
    notFound()
  }

  const primaryColor = workshop.primary_color || '#EA580C'
  const cleanWorkshopPhone = workshop.phone_whatsapp?.replace(/\D/g, '') || ''

  const SERVICES = [
    { name: 'Mantenimiento Preventivo', icon: CheckCircle2 },
    { name: 'Reparación de Motores', icon: Settings },
    { name: 'Diagnóstico Computarizado', icon: Clock },
    { name: 'Venta de Repuestos', icon: ShieldCheck },
  ]

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header / Branding */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {workshop.logo_url ? (
              <img src={workshop.logo_url} alt={workshop.name} className="w-10 h-10 object-contain rounded-lg" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <Settings className="w-6 h-6 text-slate-400" />
              </div>
            )}
            <h1 className="text-xl font-bold tracking-tight text-slate-800">{workshop.name}</h1>
          </div>
          {cleanWorkshopPhone && (
            <Button asChild variant="outline" size="sm" className="hidden md:flex">
              <a
                href={`https://wa.me/${cleanWorkshopPhone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="gap-2"
              >
                <MessageSquare className="w-4 h-4" /> Contactar
              </a>
            </Button>
          )}
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 space-y-12">
        {/* Hero Section with Search */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
                Cuidamos tu moto como si fuera <span style={{ color: primaryColor }}>nuestra.</span>
              </h2>
              <p className="text-lg text-slate-600 max-w-prose">
                Expertos en mecánica especializada. Transparencia total en cada reparación con seguimiento en vivo para nuestros clientes.
              </p>
            </div>

            {cleanWorkshopPhone && (
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  size="lg"
                  className="h-14 px-8 text-lg font-bold shadow-lg shadow-blue-500/20 text-white"
                  style={{ backgroundColor: primaryColor }}
                  asChild
                >
                  <a
                    href={`https://wa.me/${cleanWorkshopPhone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Agendar Cita por WhatsApp
                  </a>
                </Button>
              </div>
            )}
          </div>

          <div className="relative">
            <BuscadorPlaca
              workshopId={workshop.id}
              workshopSlug={workshop.slug}
              primaryColor={primaryColor}
            />
          </div>
        </section>

        {/* Services */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold">Nuestros Servicios</h3>
            <p className="text-slate-500">Todo lo que tu motocicleta necesita en un solo lugar.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SERVICES.map((service) => (
              <Card key={service.name} className="border-none shadow-sm ring-1 ring-slate-100 hover:ring-2 hover:ring-blue-100 transition-all">
                <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                  <div className="p-3 rounded-full bg-slate-50" style={{ color: primaryColor }}>
                    <service.icon className="w-6 h-6" />
                  </div>
                  <h4 className="font-semibold text-slate-800">{service.name}</h4>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Location & Info */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t">
          <div className="space-y-6">
            <h3 className="text-2xl font-bold">Ubicación y Contacto</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-slate-100">
                  <MapPin className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Dirección</p>
                  <p className="text-slate-600">{workshop.address || 'Consultar dirección por WhatsApp'}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-slate-100">
                  <Phone className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">WhatsApp</p>
                  <p className="text-slate-600">{workshop.phone_whatsapp || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="h-64 md:h-full min-h-[300px] bg-slate-200 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center relative">
            <div className="absolute inset-0 bg-slate-100 flex items-center justify-center flex-col p-8 text-center space-y-4">
              <MapPin className="w-12 h-12 text-slate-300" />
              <p className="text-slate-400 font-medium">Mapa interactivo próximamente</p>
              {workshop.address && (
                <Button variant="secondary" asChild>
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(workshop.address)}`} target="_blank" rel="noopener noreferrer">
                    Ver en Google Maps
                  </a>
                </Button>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t py-12 mt-12">
        <div className="container mx-auto px-4 text-center space-y-4">
          <div className="flex items-center justify-center gap-2 grayscale opacity-60">
            {workshop.logo_url && <img src={workshop.logo_url} alt="" className="w-6 h-6 object-contain" />}
            <span className="font-bold">{workshop.name}</span>
          </div>
          <p className="text-slate-400 text-sm">
            Powered by <span className="text-slate-600 font-semibold">MotoTrack SaaS</span> - La plataforma para talleres de motocicletas.
          </p>
        </div>
      </footer>
    </div>
  )
}
