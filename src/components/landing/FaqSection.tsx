'use client'

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

const FAQS = [
  {
    q: '¿Mis clientes tienen que descargar alguna aplicación o crear contraseña?',
    a: 'No. Cada orden genera un enlace mágico privado y el dueño también puede consultar su moto desde tu micrositio o en /track ingresando su placa y los últimos 4 dígitos de su WhatsApp.',
  },
  {
    q: '¿Funciona si el internet o los datos móviles en el taller son lentos?',
    a: 'Sí. MotoTrack comprime automáticamente todas las fotografías en el dispositivo del mecánico a formato WebP (~250 KB) antes de subirlas, por lo que cargan rápido incluso en redes 3G.',
  },
  {
    q: '¿Mis mecánicos podrán usarlo con las manos sucias o con guantes?',
    a: 'Sí. Incluimos el Modo "Manos Sucias" diseñado para celular con botones táctiles grandes de al menos 56px de altura, pasos claros y subida directa de hallazgos sin menús complejos.',
  },
  {
    q: '¿Cómo me protege MotoTrack contra reclamos por rayones previos?',
    a: 'En la recepción digital registras 4 fotos obligatorias de la moto, kilometraje, nivel de combustible y la firma de conformidad del cliente en pantalla, todo sellado con fecha y hora.',
  },
  {
    q: '¿Qué pasa si un cliente rechaza un repuesto desde el presupuesto en vivo?',
    a: 'El sistema marca el ítem como rechazado, lo descuenta automáticamente del Total Activo y, una vez confirmado el presupuesto, bloquea los botones en modo lectura para evitar cambios posteriores.',
  },
  {
    q: '¿Puedo mostrar la marca de mi propio taller a mis clientes?',
    a: 'Sí. Cada taller cuenta con su propio micrositio público (/t/tu-taller) con su logo, color corporativo, enlace directo a WhatsApp y buscador de placa personalizado.',
  },
]

export function FaqSection() {
  const [openIndex, setOpenIndex] = React.useState<number | null>(0)

  return (
    <section
      id="faq"
      className="relative overflow-x-clip border-t border-white/[0.06] bg-[#0B0D12] py-20 lg:py-24"
    >
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.45 }}
          className="text-center"
        >
          <span className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-slate-300">
            Preguntas Frecuentes
          </span>
          <h2 className="mt-4 bg-gradient-to-br from-white via-slate-100 to-slate-400 bg-clip-text text-3xl font-semibold tracking-tight text-transparent sm:text-5xl">
            Respuestas directas, sin letra pequeña.
          </h2>
        </motion.div>

        <div className="mt-12 space-y-3">
          {FAQS.map((item, idx) => {
            const isOpen = openIndex === idx
            return (
              <div
                key={item.q}
                className={`overflow-hidden rounded-2xl border transition-colors ${
                  isOpen
                    ? 'border-orange-500/35 bg-[#10131C]'
                    : 'border-white/10 bg-[#0D1017] hover:border-white/20'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6 sm:py-5"
                >
                  <span className="text-sm font-semibold text-white sm:text-base">{item.q}</span>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="shrink-0 text-orange-400"
                  >
                    <ChevronDown className="h-5 w-5" />
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.24, ease: 'easeOut' }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-white/[0.07] px-5 pb-5 pt-3 text-sm leading-relaxed text-slate-300 sm:px-6">
                        {item.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
