import type { Metadata } from 'next'
import { Navbar } from '@/components/landing/Navbar'
import { HeroSection } from '@/components/landing/HeroSection'
import { ProblemSolution } from '@/components/landing/ProblemSolution'
import { BentoFeatures } from '@/components/landing/BentoFeatures'
import { ClientPortalShowcase } from '@/components/landing/ClientPortalShowcase'
import { PricingSection } from '@/components/landing/PricingSection'
import { FaqSection } from '@/components/landing/FaqSection'
import { FinalCta } from '@/components/landing/FinalCta'
import { Footer } from '@/components/landing/Footer'

export const metadata: Metadata = {
  title: 'MotoTrack SaaS | Software para Talleres de Motos, Kanban y Live Tracker',
  description:
    'Digitaliza tu taller de motocicletas en Colombia y LATAM: recepción con fotos WebP y firma electrónica, tablero Kanban, Modo Mecánico Manos Sucias, micrositio propio y aprobación de presupuestos por WhatsApp.',
  keywords: [
    'software taller de motos',
    'gestión taller motocicletas',
    'órdenes de trabajo motos',
    'live tracker taller',
    'presupuesto interactivo whatsapp taller',
    'MotoTrack Colombia',
  ],
  openGraph: {
    title: 'MotoTrack SaaS | Control total para tu taller de motocicletas',
    description:
      'Recepción fotográfica WebP, tablero Kanban, app táctil para mecánicos y portal en tiempo real sin descargas para tus clientes.',
    type: 'website',
    locale: 'es_CO',
    siteName: 'MotoTrack SaaS',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MotoTrack SaaS | Software para Talleres de Motos',
    description:
      'Cero llamadas repetitivas y aprobaciones de presupuesto al instante por WhatsApp.',
  },
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#08090C] text-slate-100 selection:bg-orange-500/30 selection:text-orange-100">
      <Navbar />
      <main>
        <HeroSection />
        <ProblemSolution />
        <BentoFeatures />
        <ClientPortalShowcase />
        <PricingSection />
        <FaqSection />
        <FinalCta />
      </main>
      <Footer />
    </div>
  )
}
