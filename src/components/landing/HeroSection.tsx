'use client'

import * as React from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  ExternalLink,
  Kanban,
  Search,
  Smartphone,
  Sparkles,
  Wrench,
} from 'lucide-react'
import { GlowButton } from './GlowButton'
import { FREE_TRIAL_WHATSAPP_URL } from './pricing-data'

type PreviewTab = 'kanban' | 'mechanic' | 'tracker'

const PREVIEW_TABS: Array<{
  id: PreviewTab
  label: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  { id: 'kanban', label: 'Tablero Kanban', icon: Kanban },
  { id: 'mechanic', label: 'Modo Mecánico', icon: Wrench },
  { id: 'tracker', label: 'Live Tracker', icon: Smartphone },
]

export function HeroSection() {
  const [activeTab, setActiveTab] = React.useState<PreviewTab>('kanban')

  return (
    <section className="relative overflow-x-clip bg-[#08090C] pb-20 pt-14 sm:pt-20 lg:pb-28 lg:pt-24">
      {/* Fondo atmosférico y haz de luz volumétrico estilo Huly (naranja MotoTrack + azul acero) */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Glow radial ambiental superior */}
        <div
          className="absolute left-1/2 top-[-140px] h-[540px] w-[960px] -translate-x-1/2 rounded-full opacity-45 blur-[110px]"
          style={{
            background:
              'radial-gradient(ellipse at 50% 45%, rgba(249,115,22,0.34) 0%, rgba(56,189,248,0.22) 48%, rgba(8,9,12,0) 76%)',
          }}
        />
        {/* Haz de luz vertical volumétrico */}
        <div
          className="absolute left-1/2 top-0 h-[720px] w-[360px] -translate-x-1/2 opacity-50 blur-[42px] sm:w-[540px]"
          style={{
            background:
              'linear-gradient(180deg, rgba(56,189,248,0.16) 0%, rgba(249,115,22,0.28) 52%, rgba(251,146,60,0.42) 78%, rgba(8,9,12,0) 100%)',
          }}
        />
        {/* Núcleo láser del haz */}
        <div
          className="absolute left-1/2 top-16 h-[420px] w-[2px] -translate-x-1/2 opacity-55"
          style={{
            background:
              'linear-gradient(180deg, rgba(56,189,248,0) 0%, rgba(224,242,254,0.8) 45%, rgba(253,186,116,0.95) 85%, rgba(249,115,22,0) 100%)',
          }}
        />
        {/* Sutil retícula técnica */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Bloque de copy centrado */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="mx-auto max-w-4xl text-center"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3.5 py-1.5 text-xs font-semibold text-orange-300 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-orange-400" />
            <span>Plataforma SaaS Multi-Taller para Motocicletas</span>
          </div>

          <h1 className="bg-gradient-to-br from-white from-35% via-slate-100 via-70% to-orange-200 bg-clip-text text-4xl font-semibold leading-[1.02] tracking-[-0.035em] text-transparent sm:text-6xl lg:text-[72px]">
            Control total de tu taller.
            <br />
            Cero llamadas repetitivas.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
            Digitaliza la recepción con fotos WebP y firma, organiza a tus mecánicos desde el
            celular y logra aprobaciones de presupuesto al instante por WhatsApp con seguimiento en
            tiempo real.
          </p>

          {/* Botones CTA */}
          <div className="mt-9 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
            <GlowButton href={FREE_TRIAL_WHATSAPP_URL} external size="lg">
              Probar Gratis <ArrowRight className="h-4 w-4" />
            </GlowButton>

            <GlowButton href="/t/taller-demo" variant="secondary" size="lg">
              Ver Micrositio Demo <ExternalLink className="h-3.5 w-3.5 text-sky-400" />
            </GlowButton>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-orange-400" /> Sin tarjeta de crédito
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-orange-400" /> Configuras tu taller en 2 min
            </span>
            <Link
              href="/track"
              className="inline-flex items-center gap-1.5 text-sky-300 transition-colors hover:text-sky-200"
            >
              <Search className="h-3.5 w-3.5" /> ¿Eres motociclista? Consulta tu moto aquí
            </Link>
          </div>
        </motion.div>

        {/* Mockup interactivo emergiendo del haz de luz */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.12, ease: 'easeOut' }}
          className="relative mx-auto mt-14 max-w-5xl"
        >
          {/* Flare horizontal en el borde superior del mockup */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-6 left-1/2 h-14 w-[82%] -translate-x-1/2 rounded-full blur-2xl"
            style={{
              background:
                'linear-gradient(90deg, rgba(56,189,248,0.22) 0%, rgba(249,115,22,0.62) 50%, rgba(56,189,248,0.22) 100%)',
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-12 -top-px h-px bg-gradient-to-r from-transparent via-orange-300/90 to-transparent"
          />

          <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-[#0C0E14]/95 shadow-[0_30px_90px_rgba(0,0,0,0.85)] backdrop-blur-xl">
            {/* Barra superior de ventana + selector de pestañas animado */}
            <div className="flex flex-col gap-3 border-b border-white/10 bg-[#10131C]/90 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                </div>
                <span className="ml-2 rounded-md border border-white/10 bg-black/40 px-2.5 py-0.5 text-[11px] font-mono text-slate-400">
                  mototrack.app/dashboard
                </span>
              </div>

              {/* Pestañas animadas con layoutId */}
              <div className="flex flex-wrap items-center gap-1 rounded-xl border border-white/10 bg-black/40 p-1">
                {PREVIEW_TABS.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                        isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="hero-preview-tab"
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                          className="absolute inset-0 rounded-lg border border-orange-500/40 bg-gradient-to-r from-orange-500/25 to-sky-500/15"
                        />
                      )}
                      <Icon className="relative z-10 h-3.5 w-3.5 text-orange-400" />
                      <span className="relative z-10">{tab.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Contenido interactivo del mockup */}
            <div className="min-h-[340px] p-4 sm:p-6">
              <AnimatePresence mode="wait">
                {activeTab === 'kanban' && (
                  <motion.div
                    key="kanban"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.22 }}
                    className="grid gap-3 md:grid-cols-3"
                  >
                    {[
                      {
                        col: 'Esperando Aprobación',
                        dot: 'bg-amber-400',
                        badge: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
                        items: [
                          {
                            plate: 'KLM-48F',
                            bike: 'Yamaha MT-03',
                            owner: 'Carlos Méndez',
                            total: '$345.000',
                            note: '3 ítems por aprobar',
                          },
                          {
                            plate: 'JPR-20E',
                            bike: 'Bajaj Pulsar NS 200',
                            owner: 'Andrea Rojas',
                            total: '$185.000',
                            note: 'Link enviado por WhatsApp',
                          },
                        ],
                      },
                      {
                        col: 'En Reparación',
                        dot: 'bg-orange-500',
                        badge: 'border-orange-500/30 bg-orange-500/10 text-orange-300',
                        items: [
                          {
                            plate: 'XYZ-91G',
                            bike: 'Kawasaki Z400',
                            owner: 'Mateo Silva',
                            total: '$520.000',
                            note: 'Presupuesto aprobado · 2 fotos',
                          },
                          {
                            plate: 'FHT-14C',
                            bike: 'Suzuki Gixxer 250',
                            owner: 'Luisa Gómez',
                            total: '$210.000',
                            note: 'Mecánico: Julián R.',
                          },
                        ],
                      },
                      {
                        col: 'Listas para Entrega',
                        dot: 'bg-emerald-400',
                        badge: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
                        items: [
                          {
                            plate: 'RKT-74F',
                            bike: 'BMW G 310 GS',
                            owner: 'Felipe Torres',
                            total: '$460.000',
                            note: 'Control calidad OK',
                          },
                        ],
                      },
                    ].map((column) => (
                      <div
                        key={column.col}
                        className="rounded-xl border border-white/10 bg-[#12151F] p-3"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${column.dot}`} />
                            <span className="text-xs font-semibold text-slate-200">
                              {column.col}
                            </span>
                          </div>
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${column.badge}`}
                          >
                            {column.items.length}
                          </span>
                        </div>
                        <div className="space-y-2.5">
                          {column.items.map((card) => (
                            <div
                              key={card.plate}
                              className="rounded-lg border border-white/[0.08] bg-[#0B0D13] p-3 text-left transition-colors hover:border-orange-500/35"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[11px] font-bold text-white">
                                  {card.plate}
                                </span>
                                <span className="text-xs font-bold text-orange-400">
                                  {card.total}
                                </span>
                              </div>
                              <p className="mt-1.5 text-xs font-semibold text-slate-100">
                                {card.bike}
                              </p>
                              <p className="text-[11px] text-slate-400">{card.owner}</p>
                              <p className="mt-2 text-[10px] font-medium text-sky-300/90">
                                {card.note}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}

                {activeTab === 'mechanic' && (
                  <motion.div
                    key="mechanic"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.22 }}
                    className="grid items-center gap-6 md:grid-cols-2"
                  >
                    <div className="mx-auto w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-4 text-left shadow-xl">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div>
                          <p className="text-xs font-black italic tracking-tight text-white">
                            MANOS SUCIAS
                          </p>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-orange-400">
                            Orden #104 · XYZ-91G
                          </p>
                        </div>
                        <span className="rounded-full bg-orange-500/20 px-2.5 py-1 text-[10px] font-bold text-orange-300">
                          En Reparación
                        </span>
                      </div>

                      <div className="mt-3 space-y-2.5">
                        <div className="rounded-xl border border-slate-700/80 bg-slate-800/80 p-3">
                          <p className="text-[11px] font-semibold text-slate-300">
                            Hallazgo técnico listo para el cliente
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            &ldquo;Disco de freno delantero con desgaste al límite. Foto
                            comprimida a 194 KB WebP.&rdquo;
                          </p>
                        </div>

                        <div className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-orange-500 px-4 text-sm font-black uppercase tracking-wide text-slate-950 shadow-lg">
                          <Camera className="h-5 w-5" />
                          Subir Evidencia WebP (56px)
                        </div>
                        <div className="flex h-14 items-center justify-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/15 px-4 text-sm font-bold text-emerald-300">
                          <CheckCircle2 className="h-5 w-5" />
                          Pasar a Control de Calidad
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 text-left">
                      <span className="inline-flex rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-[11px] font-semibold text-orange-300">
                        UX de Taller Real
                      </span>
                      <h3 className="text-xl font-bold text-white sm:text-2xl">
                        Diseñado para usar con guantes y manos con grasa.
                      </h3>
                      <p className="text-sm leading-relaxed text-slate-300">
                        Botones táctiles de 56px de altura mínima, acceso aislado solo a las órdenes
                        del taller y compresión automática a WebP (~250 KB) para subir fotos en
                        segundos incluso con señal móvil 3G.
                      </p>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'tracker' && (
                  <motion.div
                    key="tracker"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.22 }}
                    className="grid items-center gap-6 md:grid-cols-2"
                  >
                    <div className="mx-auto w-full max-w-sm rounded-2xl border border-white/15 bg-white p-4 text-left text-slate-900 shadow-2xl">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-orange-600">
                            Live Tracker · Sin Login
                          </p>
                          <p className="text-sm font-extrabold text-slate-900">
                            Yamaha MT-03 · KLM-48F
                          </p>
                        </div>
                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                          Por aprobar
                        </span>
                      </div>
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
                          <span className="font-semibold text-slate-700">
                            Kit de arrastre reforzado
                          </span>
                          <span className="font-bold text-emerald-700">✓ Aprobado</span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
                          <span className="font-semibold text-slate-700">
                            Cambio de aceite sintético
                          </span>
                          <span className="font-bold text-slate-900">$95.000</span>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                        <span className="text-xs font-semibold text-slate-500">Total Activo</span>
                        <span className="text-base font-black text-slate-900">$280.000 COP</span>
                      </div>
                    </div>

                    <div className="space-y-3 text-left">
                      <span className="inline-flex rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-[11px] font-semibold text-sky-300">
                        Magic Link Seguro
                      </span>
                      <h3 className="text-xl font-bold text-white sm:text-2xl">
                        Tu cliente aprueba repuestos en un clic desde WhatsApp.
                      </h3>
                      <p className="text-sm leading-relaxed text-slate-300">
                        Sin descargar apps ni recordar contraseñas. Ve fotos reales del hallazgo,
                        aprueba o rechaza ítems del presupuesto y recibe el cálculo transparente en
                        tiempo real.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
