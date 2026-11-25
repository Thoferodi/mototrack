'use client'

import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, FileWarning, PhoneOff, ShieldCheck, Zap } from 'lucide-react'

const PAINS = [
  {
    title: 'Cuadernos manchados y órdenes perdidas',
    desc: 'Anotaciones a mano imposibles de leer y cero historial cuando la moto regresa meses después.',
  },
  {
    title: 'Reclamos injustos por daños previos',
    desc: 'Sin fotos de ingreso ni firma de conformidad, cualquier rayón previo termina en discusión.',
  },
  {
    title: 'Chats de WhatsApp interminables',
    desc: 'Llamadas cada hora preguntando "¿ya está lista?" y presupuestos aprobados de palabra sin respaldo.',
  },
]

const SOLUTIONS = [
  {
    title: 'Orden digital con trazabilidad por placa',
    desc: 'Cada ingreso queda ligado a la moto y cliente, con tablero Kanban y estados claros en vivo.',
  },
  {
    title: 'Evidencia WebP en 4 ángulos + firma digital',
    desc: 'Respaldo fotográfico liviano y firma de entrega en pantalla desde el primer minuto.',
  },
  {
    title: 'Aprobación interactiva en 1 clic',
    desc: 'Envías el enlace por WhatsApp; el cliente ve las fotos y aprueba o rechaza cada ítem con registro.',
  },
]

export function ProblemSolution() {
  return (
    <section className="relative overflow-x-clip border-y border-white/[0.06] bg-[#0B0D12] py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.45 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-slate-300">
            Del caos a la operación profesional
          </span>
          <h2 className="mt-4 bg-gradient-to-br from-white via-slate-100 to-slate-400 bg-clip-text text-3xl font-semibold tracking-tight text-transparent sm:text-5xl">
            Deja atrás el taller en papel.
          </h2>
          <p className="mt-4 text-base text-slate-400 sm:text-lg">
            La diferencia entre apagar incendios todos los días y dirigir un taller rentable y
            predecible.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {/* Columna Dolor */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.45 }}
            className="rounded-2xl border border-rose-500/20 bg-gradient-to-b from-rose-950/20 to-[#0D1017] p-6 sm:p-8"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400">
                <FileWarning className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-rose-400">
                  Taller Tradicional
                </p>
                <h3 className="text-xl font-bold text-white">Desgaste diario y fuga de dinero</h3>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {PAINS.map((item) => (
                <div
                  key={item.title}
                  className="flex gap-3 rounded-xl border border-white/[0.06] bg-black/25 p-4"
                >
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
                  <div>
                    <p className="text-sm font-semibold text-slate-100">{item.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Columna Solución */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.45 }}
            className="relative overflow-hidden rounded-2xl border border-orange-500/30 bg-gradient-to-b from-orange-950/25 via-[#0E1119] to-[#0D1017] p-6 sm:p-8 shadow-[0_0_50px_rgba(249,115,22,0.08)]"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-orange-500/15 blur-3xl"
            />
            <div className="relative flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-orange-500/40 bg-orange-500/15 text-orange-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-orange-400">
                  Con MotoTrack SaaS
                </p>
                <h3 className="text-xl font-bold text-white">Control total y confianza del cliente</h3>
              </div>
            </div>

            <div className="relative mt-6 space-y-4">
              {SOLUTIONS.map((item) => (
                <div
                  key={item.title}
                  className="flex gap-3 rounded-xl border border-orange-500/15 bg-white/[0.03] p-4"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-orange-400" />
                  <div>
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-300">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="relative mt-6 flex flex-wrap items-center gap-4 border-t border-white/10 pt-4 text-xs text-slate-300">
              <span className="inline-flex items-center gap-1.5">
                <PhoneOff className="h-4 w-4 text-sky-400" /> Menos interrupciones en recepción
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-orange-400" /> Aprobaciones 3x más rápidas
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
