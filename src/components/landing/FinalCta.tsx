'use client'

import { motion } from 'framer-motion'
import { ArrowRight, ExternalLink, Wrench } from 'lucide-react'
import { GlowButton } from './GlowButton'

export function FinalCta() {
  return (
    <section className="relative overflow-x-clip border-t border-white/[0.06] bg-[#08090C] py-24 lg:py-32">
      {/* Resplandor volumétrico dual estilo Huly (naranja cálido + azul acero) */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute left-1/2 top-1/2 h-[380px] w-[760px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-45 blur-[110px]"
          style={{
            background:
              'radial-gradient(ellipse at 35% 50%, rgba(249,115,22,0.42), transparent 55%), radial-gradient(ellipse at 68% 50%, rgba(56,189,248,0.28), transparent 55%)',
          }}
        />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center"
        >
          {/* Emblema circular luminoso estilo dial de reloj Huly */}
          <div className="relative mb-8 flex h-24 w-24 items-center justify-center rounded-full border border-white/20 bg-[#0D1017] shadow-[0_0_50px_rgba(249,115,22,0.35)]">
            <div
              aria-hidden="true"
              className="absolute -inset-2 rounded-full opacity-60 blur-md"
              style={{
                background:
                  'conic-gradient(from 40deg, rgba(249,115,22,0.7), rgba(56,189,248,0.5), rgba(249,115,22,0.1), rgba(249,115,22,0.7))',
              }}
            />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-[#0A0C11]">
              <Wrench className="h-8 w-8 text-orange-400" />
            </div>
          </div>

          <h2 className="bg-gradient-to-br from-white from-30% via-slate-100 to-orange-200 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-6xl">
            Lleva tu taller al siguiente nivel hoy.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
            Crea tu cuenta en menos de 2 minutos, registra tu primera motocicleta con fotos WebP y
            envía tu primer presupuesto interactivo.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
            <GlowButton href="/login" size="lg">
              Crear Cuenta Gratis <ArrowRight className="h-4 w-4" />
            </GlowButton>
            <GlowButton href="/t/taller-demo" variant="secondary" size="lg">
              Explorar Taller Demo <ExternalLink className="h-3.5 w-3.5 text-sky-400" />
            </GlowButton>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
