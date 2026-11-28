'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  Bike,
  Hash,
  Loader2,
  Phone,
  Search,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { globalSearchOrder } from '@/app/track/actions'

interface EmbeddedTrackerProps {
  workshopId: string
  workshopName: string
}

export function EmbeddedTracker({ workshopId, workshopName }: EmbeddedTrackerProps) {
  const router = useRouter()
  const [searchType, setSearchType] = React.useState<'plate' | 'token'>('plate')
  const [query, setQuery] = React.useState('')
  const [last4, setLast4] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleTabChange = (nextType: 'plate' | 'token') => {
    setSearchType(nextType)
    setError(null)
    setQuery('')
    if (nextType === 'token') {
      setLast4('')
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (isSubmitting) return

    const cleanQuery =
      searchType === 'plate'
        ? query.replace(/\s+/g, '').toUpperCase()
        : query.trim()
    const cleanLast4 = last4.replace(/\D/g, '')

    if (!cleanQuery) {
      setError(
        searchType === 'plate'
          ? 'Ingresa la placa de tu motocicleta.'
          : 'Ingresa el código de seguimiento.'
      )
      return
    }

    if (searchType === 'plate' && !/^\d{4}$/.test(cleanLast4)) {
      setError('Ingresa los últimos 4 dígitos numéricos de tu celular.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await globalSearchOrder(
        cleanQuery,
        searchType === 'plate' ? cleanLast4 : undefined,
        searchType,
        workshopId
      )

      if (result.success && result.token) {
        router.push(`/track/${result.token}`)
        return
      }

      setError(result.error || 'No se encontró ninguna orden con los datos ingresados.')
    } catch {
      setError('Ocurrió un error de conexión al consultar tu orden. Intenta nuevamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section
      id="consultar-moto"
      className="relative overflow-x-clip border-y border-white/[0.06] bg-[#090B10] py-16 sm:py-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
          {/* Explicación lateral */}
          <div className="min-w-0 lg:col-span-5 space-y-4">
            <span
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-widest"
              style={{
                borderColor: 'rgba(var(--brand-glow-rgb), 0.35)',
                backgroundColor: 'rgba(var(--brand-glow-rgb), 0.1)',
                color: 'var(--brand-text)',
              }}
            >
              <Search className="h-3.5 w-3.5" />
              Consulta en Vivo
            </span>

            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              ¿Tu moto ya está en {workshopName}?
            </h2>

            <p className="text-sm sm:text-base leading-relaxed text-slate-400">
              Consulta el avance en tiempo real usando tu placa y los últimos 4 dígitos de tu
              celular, o pega el código de seguimiento que recibiste por WhatsApp.
            </p>

            <div className="rounded-xl border border-white/[0.08] bg-[#101218] p-4 space-y-2 text-xs text-slate-300">
              <p className="flex items-center gap-2 font-semibold text-white">
                <ShieldCheck className="h-4 w-4 shrink-0" style={{ color: 'var(--brand-text)' }} />
                Acceso privado y verificado
              </p>
              <p className="text-slate-400 leading-relaxed">
                Nunca publicamos placas activas ni datos personales. Solo tú accedes a tus fotos,
                avances y presupuesto con tus credenciales de verificación.
              </p>
            </div>
          </div>

          {/* Tarjeta destacada #101218 con borde luminoso sutil */}
          <div className="min-w-0 lg:col-span-7">
            <div className="relative mx-auto max-w-xl">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-px rounded-2xl opacity-60 blur-[1px]"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(var(--brand-glow-rgb), 0.45) 0%, rgba(255,255,255,0.08) 45%, rgba(var(--brand-glow-rgb), 0.25) 100%)',
                }}
              />
              <div className="relative rounded-2xl border border-white/10 bg-[#101218] p-5 sm:p-7 shadow-[0_24px_70px_rgba(0,0,0,0.75)]">
                {/* Pestañas animadas Por Placa / Por Código */}
                <div className="mb-5 flex gap-1.5 rounded-xl border border-white/10 bg-[#08090C] p-1">
                  {[
                    { id: 'plate' as const, label: 'Por Placa' },
                    { id: 'token' as const, label: 'Por Código' },
                  ].map((tab) => {
                    const isActive = searchType === tab.id
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleTabChange(tab.id)}
                        className={`relative flex-1 rounded-lg py-2.5 text-xs font-bold transition-colors ${
                          isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {isActive && (
                          <motion.span
                            layoutId="workshop-tracker-tab"
                            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                            className="absolute inset-0 rounded-lg border"
                            style={{
                              borderColor: 'rgba(var(--brand-glow-rgb), 0.45)',
                              backgroundColor: 'rgba(var(--brand-glow-rgb), 0.16)',
                            }}
                          />
                        )}
                        <span className="relative z-10">{tab.label}</span>
                      </button>
                    )
                  })}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div
                    className={
                      searchType === 'plate' ? 'grid grid-cols-1 gap-4 sm:grid-cols-2' : 'space-y-2'
                    }
                  >
                    <div className="space-y-2">
                      <Label
                        htmlFor="workshop-track-query"
                        className="text-xs font-semibold text-slate-300"
                      >
                        {searchType === 'plate' ? 'Placa de tu moto' : 'Código de seguimiento (UUID)'}
                      </Label>
                      <div className="relative">
                        {searchType === 'plate' ? (
                          <Bike className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                        ) : (
                          <Hash className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                        )}
                        <Input
                          id="workshop-track-query"
                          name="query"
                          value={query}
                          onChange={(e) =>
                            setQuery(
                              searchType === 'plate'
                                ? e.target.value.replace(/\s+/g, '').toUpperCase()
                                : e.target.value
                            )
                          }
                          placeholder={
                            searchType === 'plate'
                              ? 'Ej. ABC-123'
                              : 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
                          }
                          disabled={isSubmitting}
                          autoCapitalize={searchType === 'plate' ? 'characters' : 'none'}
                          autoComplete="off"
                          className={`h-11 pl-10 rounded-xl border-white/10 bg-[#08090C] font-mono text-white placeholder:text-slate-500 focus-visible:border-white/30 focus-visible:ring-1 focus-visible:ring-white/25 focus-visible:ring-offset-0 [color-scheme:dark] ${
                            searchType === 'plate' ? 'uppercase' : ''
                          }`}
                          required
                        />
                      </div>
                    </div>

                    {searchType === 'plate' && (
                      <div className="space-y-2">
                        <Label
                          htmlFor="workshop-track-last4"
                          className="text-xs font-semibold text-slate-300"
                        >
                          Últimos 4 dígitos del celular
                        </Label>
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                          <Input
                            id="workshop-track-last4"
                            name="last4"
                            value={last4}
                            onChange={(e) =>
                              setLast4(e.target.value.replace(/\D/g, '').slice(0, 4))
                            }
                            placeholder="Ej. 4567"
                            inputMode="numeric"
                            maxLength={4}
                            pattern="\d{4}"
                            disabled={isSubmitting}
                            className="h-11 pl-10 rounded-xl border-white/10 bg-[#08090C] font-mono text-white placeholder:text-slate-500 focus-visible:border-white/30 focus-visible:ring-1 focus-visible:ring-white/25 focus-visible:ring-offset-0 [color-scheme:dark]"
                            required
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {error && (
                    <div
                      role="alert"
                      className="flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs sm:text-sm font-medium text-rose-200"
                    >
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                      <span>{error}</span>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-12 w-full rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-transform duration-150 hover:scale-[1.01] active:scale-[0.99]"
                    style={{
                      backgroundColor: 'var(--brand-hex)',
                      color: 'var(--brand-fg)',
                      boxShadow: '0 0 24px rgba(var(--brand-glow-rgb), 0.28)',
                    }}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Consultando estado...
                      </span>
                    ) : (
                      'Ver Estado de Mi Moto'
                    )}
                  </Button>

                  <p className="text-center text-[11px] text-slate-500">
                    Consulta sujeta a nuestra{' '}
                    <Link
                      href="/legal/privacidad"
                      className="underline decoration-white/15 underline-offset-4 hover:text-slate-300"
                    >
                      Política de Privacidad
                    </Link>
                    .
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
