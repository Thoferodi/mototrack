'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Check, Sparkles } from 'lucide-react'
import { GlowButton } from './GlowButton'
import { formatCOP, PRICING_PLANS } from './pricing-data'

export function PricingSection() {
  const [annual, setAnnual] = React.useState(true)

  return (
    <section
      id="precios"
      className="relative overflow-x-clip border-t border-white/[0.06] bg-[#08090C] py-20 lg:py-28"
    >
      {/* Glow ambiental naranja/azul superior */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-[360px] w-[760px] -translate-x-1/2 rounded-full opacity-25 blur-[110px]"
        style={{
          background:
            'radial-gradient(ellipse at 50% 30%, rgba(249,115,22,0.38), rgba(56,189,248,0.16) 55%, transparent 80%)',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.45 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-orange-300">
            Planes Claros para Colombia y LATAM
          </span>
          <h2 className="mt-4 bg-gradient-to-br from-white via-slate-100 to-orange-200 bg-clip-text text-3xl font-semibold tracking-tight text-transparent sm:text-5xl">
            Menos que un cambio de aceite al mes.
          </h2>
          <p className="mt-4 text-base text-slate-400 sm:text-lg">
            Empieza gratis y escala cuando tu taller crezca. Sin contratos forzosos ni costos
            ocultos.
          </p>

          {/* Toggle Mensual / Anual animado */}
          <div className="mt-8 inline-flex items-center rounded-full border border-white/15 bg-[#0E1118] p-1">
            <button
              type="button"
              onClick={() => setAnnual(false)}
              className={`relative rounded-full px-4 py-2 text-xs font-bold transition-colors ${
                !annual ? 'text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {!annual && (
                <motion.span
                  layoutId="billing-toggle"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className="absolute inset-0 rounded-full bg-white/15"
                />
              )}
              <span className="relative z-10">Pago Mensual</span>
            </button>

            <button
              type="button"
              onClick={() => setAnnual(true)}
              className={`relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-colors ${
                annual ? 'text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {annual && (
                <motion.span
                  layoutId="billing-toggle"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className="absolute inset-0 rounded-full border border-orange-500/40 bg-orange-500/20"
                />
              )}
              <span className="relative z-10">Pago Anual</span>
              <span className="relative z-10 rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-extrabold text-slate-950">
                Ahorra 30%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Grid de 3 planes */}
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {PRICING_PLANS.map((plan, index) => {
            const price = annual ? plan.annualMonthlyPriceCOP : plan.monthlyPriceCOP
            const usdApprox = annual ? plan.usdApproxAnnual : plan.usdApproxMonthly
            const isPopular = Boolean(plan.popular)

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                className={`relative flex flex-col justify-between rounded-2xl p-6 sm:p-8 ${
                  isPopular
                    ? 'border border-orange-500/60 bg-gradient-to-b from-orange-950/30 via-[#0E1118] to-[#0B0D12] shadow-[0_0_55px_rgba(249,115,22,0.18)]'
                    : 'border border-white/10 bg-[#0C0E14]'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3.5 right-6 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-400 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-slate-950 shadow-lg">
                    <Sparkles className="h-3 w-3" />
                    {plan.badge}
                  </div>
                )}

                <div>
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  <p className="mt-2 min-h-[42px] text-sm text-slate-400">{plan.tagline}</p>

                  <div className="mt-6 border-b border-white/10 pb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-extrabold tracking-tight text-white">
                        {formatCOP(price)}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">COP / mes</span>
                    </div>
                    <p className="mt-1 text-xs font-medium text-orange-300/90">
                      {usdApprox} · {annual ? 'Facturado anualmente' : 'Facturación mensual'}
                    </p>
                  </div>

                  {/* Límites operativos */}
                  <div className="mt-5 space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Capacidad y límites
                    </p>
                    <ul className="space-y-2 text-xs text-slate-200">
                      {plan.limits.map((limit) => (
                        <li key={limit} className="flex items-start gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
                          <span>{limit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Funcionalidades */}
                  <div className="mt-5 space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Incluye
                    </p>
                    <ul className="space-y-2.5 text-sm text-slate-300">
                      {plan.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-2.5">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-8 pt-2">
                  <GlowButton
                    href={plan.ctaHref}
                    external={plan.external}
                    variant={isPopular ? 'primary' : 'secondary'}
                    size="lg"
                    className="w-full"
                  >
                    {plan.ctaLabel} <ArrowRight className="h-4 w-4" />
                  </GlowButton>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
