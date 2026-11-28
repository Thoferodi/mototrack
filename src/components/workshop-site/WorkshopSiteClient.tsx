'use client'

import * as React from 'react'
import { getWorkshopTheme } from '@/lib/workshop-theme'
import { DemoBanner } from './DemoBanner'
import { WorkshopNavbar } from './WorkshopNavbar'
import { WorkshopHero } from './WorkshopHero'
import { EmbeddedTracker } from './EmbeddedTracker'
import { ServicesCatalog } from './ServicesCatalog'
import { TransparencyBento } from './TransparencyBento'
import { WhatsAppQuoteSection } from './WhatsAppQuoteSection'
import { WorkshopFooter } from './WorkshopFooter'
import type { PublicServiceItem, PublicWorkshopData } from './types'

interface WorkshopSiteClientProps {
  workshop: PublicWorkshopData
  services: PublicServiceItem[]
  hasRealCatalog: boolean
  orderCount: number
}

export function WorkshopSiteClient({
  workshop,
  services,
  hasRealCatalog,
  orderCount,
}: WorkshopSiteClientProps) {
  const theme = React.useMemo(
    () => getWorkshopTheme(workshop.primary_color),
    [workshop.primary_color]
  )

  const [selectedService, setSelectedService] = React.useState<string>(
    services[0]?.name || ''
  )

  const handleSelectService = React.useCallback((serviceName: string) => {
    setSelectedService(serviceName)
    const target = document.getElementById('agendar')
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  const isDemo = workshop.slug === 'taller-demo'

  return (
    <div
      style={theme.cssVars}
      className="min-h-screen overflow-x-clip bg-[#08090C] text-slate-100 [color-scheme:dark] selection:bg-white/20 selection:text-white"
    >
      {isDemo && <DemoBanner />}

      <WorkshopNavbar
        workshopName={workshop.name}
        logoUrl={workshop.logo_url}
        phoneWhatsapp={workshop.phone_whatsapp}
      />

      <main>
        <WorkshopHero
          workshopName={workshop.name}
          address={workshop.address}
          orderCount={orderCount}
        />

        <EmbeddedTracker
          workshopId={workshop.id}
          workshopName={workshop.name}
        />

        <ServicesCatalog
          workshopName={workshop.name}
          services={services}
          hasRealCatalog={hasRealCatalog}
          onSelectService={handleSelectService}
        />

        <TransparencyBento workshopName={workshop.name} />

        <WhatsAppQuoteSection
          workshopName={workshop.name}
          address={workshop.address}
          phoneWhatsapp={workshop.phone_whatsapp}
          services={services}
          selectedService={selectedService}
          onSelectedServiceChange={setSelectedService}
        />
      </main>

      <WorkshopFooter
        workshopName={workshop.name}
        logoUrl={workshop.logo_url}
      />
    </div>
  )
}
