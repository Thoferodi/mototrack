import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Wrench, Smartphone, MessageCircle, ClipboardList, CheckCircle2, Search, Star, ShieldCheck, MapPin } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 font-sans selection:bg-orange-200">
      
      {/* Navegación Superior Estilo Navbar */}
      <nav className="sticky top-0 z-50 w-full border-b border-slate-200/50 bg-white/80 backdrop-blur-xl">
        <div className="flex h-16 max-w-7xl mx-auto items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-600 text-white font-bold">
              M
            </div>
            <span className="text-xl font-bold tracking-tight">MotoTrack</span>
          </div>
          
          <div className="hidden md:flex gap-8 text-sm font-medium text-slate-600">
            <Link href="#funciones" className="hover:text-orange-600 transition-colors">Funciones</Link>
            <Link href="#como-funciona" className="hover:text-orange-600 transition-colors">Cómo funciona</Link>
            <Link href="#talleres" className="hover:text-orange-600 transition-colors">Talleres</Link>
            <Link href="#precio" className="hover:text-orange-600 transition-colors">Precio</Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 hidden sm:block">
              Iniciar Sesión
            </Link>
            <Button asChild className="bg-orange-600 hover:bg-orange-700 text-white rounded-md px-5 shadow-sm">
              <Link href="/login">Prueba Gratis</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* 1. Hero Section (Asimétrico con Mockup) */}
      <section className="relative overflow-hidden pt-16 md:pt-24 pb-16 lg:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          <div className="max-w-2xl">
            <div className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-600 uppercase tracking-wider mb-6">
              Software #1 para talleres en Colombia
            </div>
            <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 leading-[1.1]">
              Tu taller, <br/>
              <span className="text-orange-600">en otro nivel.</span>
            </h1>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed max-w-lg">
              Órdenes digitales, WhatsApp automático y un portal donde tus clientes siguen todo en tiempo real. Sin papel, sin llamadas.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="bg-orange-600 hover:bg-orange-700 text-white rounded-md text-base h-12 px-8 shadow-md transition-transform hover:-translate-y-0.5">
                <Link href="/dashboard">
                  Comenzar Gratis <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-md text-base h-12 px-8 border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors">
                <Link href="/track">
                  <Search className="mr-2 h-4 w-4 text-slate-500" /> Consultar Mi Moto
                </Link>
              </Button>
            </div>
            
            <div className="flex items-center gap-6 mt-6 text-sm text-slate-500 font-medium">
              <span className="flex items-center"><CheckCircle2 className="h-4 w-4 text-green-500 mr-2"/> Gratis para empezar</span>
              <span className="flex items-center"><CheckCircle2 className="h-4 w-4 text-green-500 mr-2"/> Sin tarjeta de crédito</span>
            </div>
          </div>

          {/* Mockup Visual Simulando la App */}
          <div className="relative mx-auto w-full max-w-[500px] lg:max-w-none">
            <div className="absolute inset-0 bg-gradient-to-tr from-orange-100 to-orange-50 rounded-3xl transform rotate-3 scale-105 opacity-50"></div>
            <div className="relative rounded-2xl bg-[#0F172A] border border-slate-700 shadow-2xl overflow-hidden aspect-[4/3] flex flex-col">
              {/* Barra superior Mac */}
              <div className="h-8 bg-[#1E293B] border-b border-slate-700 flex items-center px-4 gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                <div className="mx-auto bg-slate-800/50 rounded text-[10px] text-slate-400 px-4 py-0.5">app.mototrack.com</div>
              </div>
              {/* Contenido Mockup */}
              <div className="p-6 grid grid-cols-2 gap-4">
                <div className="bg-[#1E293B] p-4 rounded-xl border border-slate-700/50">
                  <p className="text-xs text-slate-400 font-medium mb-1">Órdenes Hoy</p>
                  <p className="text-2xl font-bold text-white">12</p>
                  <p className="text-xs text-green-400 mt-1">+21%</p>
                </div>
                <div className="bg-[#1E293B] p-4 rounded-xl border border-slate-700/50">
                  <p className="text-xs text-slate-400 font-medium mb-1">Ingresos</p>
                  <p className="text-2xl font-bold text-white">$2.4M</p>
                  <p className="text-xs text-green-400 mt-1">+18%</p>
                </div>
                
                {/* Simulacion de Notificacion Flotante */}
                <div className="absolute -left-6 top-1/2 bg-[#1E293B] border border-slate-700 shadow-xl rounded-xl p-3 w-64 flex gap-3 transform -translate-y-1/2 z-10 animate-bounce" style={{animationDuration: '3s'}}>
                  <div className="bg-green-500/20 p-2 rounded-full h-fit">
                    <MessageCircle className="w-4 h-4 text-green-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white mb-0.5">WhatsApp Automático</p>
                    <p className="text-[10px] text-slate-300 leading-tight">Tu Yamaha FZ está lista para recoger en MotoSpeed Express.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Barra de Estadísticas */}
      <section className="border-y border-slate-200 bg-white py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-slate-100">
            <div>
              <p className="text-3xl font-extrabold text-slate-900">500+</p>
              <p className="text-sm font-medium text-slate-500 mt-1">Talleres activos</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-slate-900">15K+</p>
              <p className="text-sm font-medium text-slate-500 mt-1">Órdenes creadas</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-slate-900">8K+</p>
              <p className="text-sm font-medium text-slate-500 mt-1">Motos registradas</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-slate-900">98%</p>
              <p className="text-sm font-medium text-slate-500 mt-1">Satisfacción</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Sección de Funcionalidades (Grilla de Cards) */}
      <section id="funciones" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-4 border border-blue-100">
            Funcionalidades
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Todo lo que necesita tu taller</h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-lg">
            Herramientas pensadas para el día a día de tu taller. Simples, rápidas y poderosas.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1 bg-white">
            <CardContent className="p-6">
              <div className="h-10 w-10 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center mb-5">
                <ClipboardList className="h-5 w-5 text-orange-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Clientes y Motos</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Registra clientes con sus motos, placas, marca, modelo y kilometraje. Todo en un solo lugar.
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1 bg-white">
            <CardContent className="p-6">
              <div className="h-10 w-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center mb-5">
                <Wrench className="h-5 w-5 text-blue-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Órdenes Digitales</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Crea órdenes con servicios, repuestos y costos. Flujo de estados en tiempo real.
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1 bg-white">
            <CardContent className="p-6">
              <div className="h-10 w-10 rounded-lg bg-green-50 border border-green-100 flex items-center justify-center mb-5">
                <MessageCircle className="h-5 w-5 text-green-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">WhatsApp Automático</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Tu cliente recibe un mensaje cuando su moto está lista. Sin hacer nada manualmente.
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1 bg-white">
            <CardContent className="p-6">
              <div className="h-10 w-10 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center mb-5">
                <Smartphone className="h-5 w-5 text-purple-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Portal del Cliente</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Tus clientes consultan el historial clínico y estado de su moto desde el celular.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 4. Sección Cómo Funciona (Línea de Tiempo Simple) */}
      <section id="como-funciona" className="py-24 bg-white px-4 sm:px-6 lg:px-8 border-t border-slate-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
             <span className="inline-block rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-600 uppercase tracking-wider mb-4 border border-orange-100">
              3 Pasos Simples
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Cómo funciona</h2>
            <p className="text-slate-600 text-lg">Empieza en minutos. Sin instalaciones, sin complicaciones.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Linea conectora oculta en movil */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-slate-100 z-0"></div>
            
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center mb-6 relative">
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold text-sm border-4 border-white">1</div>
                <ShieldCheck className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Registra tu taller</h3>
              <p className="text-slate-600 text-sm px-4">Crea tu cuenta gratis en 2 minutos. Agrega el nombre de tu taller y listo.</p>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center mb-6 relative">
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold text-sm border-4 border-white">2</div>
                <ClipboardList className="w-10 h-10 text-orange-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Crea tus órdenes</h3>
              <p className="text-slate-600 text-sm px-4">Agrega clientes, motos y crea órdenes de trabajo digitales al instante.</p>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center mb-6 relative">
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold text-sm border-4 border-white">3</div>
                <Star className="w-10 h-10 text-yellow-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Fideliza clientes</h3>
              <p className="text-slate-600 text-sm px-4">Tus clientes reciben notificaciones y consultan todo desde su celular.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Sección de Precio (CTA Fuerte) */}
      <section id="precio" className="py-24 px-4 sm:px-6 lg:px-8 bg-[#FAFAFA]">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-600 uppercase tracking-wider mb-6 border border-orange-100">
            Precio Simple
          </span>
          <h2 className="text-5xl md:text-6xl font-extrabold text-slate-900 mb-4 tracking-tight">
            Menos de <span className="text-orange-600">$4.500</span> al día.
          </h2>
          <h3 className="text-2xl md:text-3xl font-bold text-slate-700 mb-6">
            Menos que un cambio de aceite.
          </h3>
          <p className="text-lg text-slate-600 mb-10 max-w-xl mx-auto">
            Planes desde <strong className="text-slate-900">$80.000 COP/mes</strong>. Prueba gratis con tus primeros clientes sin compromisos.
          </p>
          
          <Button asChild size="lg" className="bg-orange-600 hover:bg-orange-700 text-white rounded-md text-lg h-14 px-10 shadow-lg">
            <Link href="/login">
              Comenzar Gratis <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>

          <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-3 mt-8 text-sm text-slate-500 font-medium">
            <span className="flex items-center"><CheckCircle2 className="h-4 w-4 text-green-500 mr-2"/> Sin tarjeta</span>
            <span className="flex items-center"><CheckCircle2 className="h-4 w-4 text-green-500 mr-2"/> Cancela cuando quieras</span>
            <span className="flex items-center"><CheckCircle2 className="h-4 w-4 text-green-500 mr-2"/> Soporte por WhatsApp</span>
          </div>
        </div>
      </section>

      {/* 6. Footer Oscuro Minimalista */}
      <footer className="bg-[#0F172A] text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-orange-600 text-white font-bold text-xs">
              M
            </div>
            <span className="text-white font-bold tracking-tight">MotoTrack</span>
          </div>
          
          <div className="flex gap-6 text-sm">
            <Link href="#funciones" className="hover:text-white transition-colors">Funciones</Link>
            <Link href="#como-funciona" className="hover:text-white transition-colors">Cómo funciona</Link>
            <Link href="#precio" className="hover:text-white transition-colors">Precio</Link>
          </div>
          
          <div className="text-xs">
             Desarrollado en Bogotá, Colombia | {new Date().getFullYear()}
          </div>
        </div>
      </footer>
    </div>
  );
}