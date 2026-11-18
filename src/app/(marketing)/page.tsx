import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Wrench, Smartphone, MessageCircle, ClipboardList } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 selection:bg-orange-200">
      {/* Navegación Minimalista */}
      <nav className="w-full flex items-center justify-between p-6 max-w-7xl mx-auto">
        <div className="font-bold text-xl tracking-tighter text-slate-900">
          MotoTrack <span className="text-orange-600">SaaS</span>
        </div>
        <Button asChild variant="ghost" className="font-medium">
          <Link href="/login">Iniciar Sesión</Link>
        </Button>
      </nav>

      {/* Hero Section */}
      <main className="flex-col flex items-center justify-center px-4 text-center max-w-5xl mx-auto mt-16 md:mt-24">
        <div className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-sm font-medium text-orange-800 mb-8 shadow-sm">
          🚀 MotoTrack SaaS v1.0.0-beta
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 leading-[1.1]">
          Control total para tu <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">
            taller de motos
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mb-10 leading-relaxed">
          Optimiza la recepción, mantén el historial clínico de cada vehículo y mejora la confianza del cliente con seguimiento en tiempo real vía WhatsApp.
        </p>
        
        {/* Botones Corregidos con asChild y Link */}
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Button asChild size="lg" className="bg-orange-600 hover:bg-orange-700 text-white rounded-full text-lg h-14 px-8 shadow-lg shadow-orange-600/20 transition-transform hover:scale-105">
            <Link href="/dashboard">
              Ir al Dashboard <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          
          <Button asChild variant="outline" size="lg" className="rounded-full text-lg h-14 px-8 border-slate-300 text-slate-700 hover:bg-slate-100 transition-transform hover:scale-105">
            <Link href="/mechanic">
              Modo Mecánico <Wrench className="ml-2 h-5 w-5 text-slate-500" />
            </Link>
          </Button>
        </div>
      </main>

      {/* Grid de Características Moderno */}
      <section className="max-w-7xl mx-auto px-4 py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard 
            icon={<ClipboardList className="h-8 w-8 text-orange-500" />}
            title="Recepción Rápida"
            description="Captura daños, fotos y requerimientos del cliente en segundos desde cualquier dispositivo."
          />
          <FeatureCard 
            icon={<Smartphone className="h-8 w-8 text-blue-500" />}
            title="Live Tracking"
            description="Tus clientes ven el progreso de su moto en tiempo real sin tener que llamarte."
          />
          <FeatureCard 
            icon={<MessageCircle className="h-8 w-8 text-green-500" />}
            title="WhatsApp Integrado"
            description="Notificaciones automáticas con los estados de reparación y presupuestos listos."
          />
          <FeatureCard 
            icon={<Wrench className="h-8 w-8 text-purple-500" />}
            title="Catálogo Clínico"
            description="Gestión unificada de repuestos, mano de obra y el historial de cada vehículo."
          />
        </div>
      </section>
    </div>
  );
}

// Componente auxiliar para las tarjetas de características
function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="bg-slate-50 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600 leading-relaxed text-sm">
        {description}
      </p>
    </div>
  );
}