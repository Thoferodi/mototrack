'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Search,
  Loader2,
  Bike,
  Phone,
  Hash,
  ArrowLeft,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react'
import { MotoTrackBrand } from '@/components/brand/MotoTrackBrand'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { globalSearchOrder } from './actions'

export default function GlobalTrackPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [searchType, setSearchType] = React.useState<'plate' | 'token'>('plate')
  const [query, setQuery] = React.useState('')
  const [last4, setLast4] = React.useState('')

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
        searchType
      )

      if (result.success && result.token) {
        router.push(`/track/${result.token}`)
        return
      }

      setError(result.error || 'No se encontró ninguna orden con los datos ingresados.')
    } catch (err) {
      setError('Ocurrió un error de conexión al consultar tu orden. Intenta nuevamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#08090C] text-slate-100 [color-scheme:dark] selection:bg-orange-500/30 selection:text-orange-100">
      {/* Fondo atmosférico y haz sutil naranja/azul estilo Huly */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute left-1/2 top-[-120px] h-[520px] w-[820px] -translate-x-1/2 rounded-full opacity-45 blur-[120px]"
          style={{
            background:
              'radial-gradient(ellipse at 45% 45%, rgba(249,115,22,0.34) 0%, rgba(56,189,248,0.2) 52%, rgba(8,9,12,0) 78%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
      </div>

      {/* Header continuo con Navbar de la landing */}
      <nav className="sticky top-0 z-40 h-16 border-b border-white/[0.08] bg-[#08090C]/75 backdrop-blur-xl supports-[backdrop-filter]:bg-[#08090C]/65 flex items-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center group shrink-0">
            <MotoTrackBrand variant="horizontal" theme="dark" size="md" badge="Live Tracker" />
          </Link>

          <Link
            href="/"
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-3.5 text-xs font-semibold text-slate-200 transition-all hover:border-orange-500/40 hover:bg-white/[0.08] hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-orange-400" />
            Volver al Inicio
          </Link>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-4 py-14 sm:py-20 sm:px-6 lg:px-8 flex flex-col items-center">
        <div className="text-center mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3.5 py-1 text-xs font-semibold text-orange-300">
            <Search className="h-3.5 w-3.5 text-orange-400" />
            Consulta Pública en Tiempo Real
          </div>
          <h1 className="bg-gradient-to-br from-white via-slate-100 to-orange-200 bg-clip-text text-4xl sm:text-5xl font-bold tracking-tight text-transparent">
            Rastrea tu <span className="text-orange-400">Moto</span>
          </h1>
          <p className="text-slate-400 max-w-md mx-auto text-sm sm:text-base leading-relaxed">
            Consulta el estado de tu reparación en tiempo real usando tu placa o código de
            seguimiento.
          </p>
        </div>

        <div className="relative w-full max-w-md">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-10 -top-px h-px bg-gradient-to-r from-transparent via-orange-400/80 to-transparent"
          />
          <Card className="w-full rounded-2xl border border-white/10 bg-[#101218]/90 text-slate-100 shadow-[0_24px_80px_rgba(0,0,0,0.75)] backdrop-blur-xl overflow-hidden">
            <CardHeader className="border-b border-white/[0.07]">
              <div className="flex gap-1.5 p-1 bg-[#0B0D13] border border-white/10 rounded-xl mb-4">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleTabChange('plate')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all border ${
                    searchType === 'plate'
                      ? 'bg-orange-500/15 text-orange-300 border-orange-500/30'
                      : 'border-transparent text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  Por Placa
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleTabChange('token')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all border ${
                    searchType === 'token'
                      ? 'bg-orange-500/15 text-orange-300 border-orange-500/30'
                      : 'border-transparent text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  Por Código
                </button>
              </div>
              <CardTitle className="text-xl flex items-center gap-2 text-white">
                <Search className="w-5 h-5 text-orange-400" />
                {searchType === 'plate' ? 'Buscar por Placa' : 'Buscar por Código'}
              </CardTitle>
              <CardDescription className="text-slate-400">
                {searchType === 'plate'
                  ? 'Ingresa la placa de tu moto y valida tu identidad.'
                  : 'Ingresa el código de seguimiento enviado por WhatsApp.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="query" className="text-xs font-semibold text-slate-300">
                    {searchType === 'plate' ? 'Placa / Patente' : 'Código de Seguimiento'}
                  </Label>
                  <div className="relative">
                    {searchType === 'plate' ? (
                      <Bike className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    ) : (
                      <Hash className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    )}
                    <Input
                      id="query"
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
                        searchType === 'plate' ? 'ABC-123' : 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
                      }
                      disabled={isSubmitting}
                      autoCapitalize={searchType === 'plate' ? 'characters' : 'none'}
                      autoComplete="off"
                      className={`h-11 pl-10 rounded-xl border-white/10 bg-[#0B0D13] font-mono text-white placeholder:text-slate-500 focus-visible:border-orange-500/60 focus-visible:ring-orange-500/30 focus-visible:ring-offset-0 [color-scheme:dark] ${
                        searchType === 'plate' ? 'uppercase' : ''
                      }`}
                      required
                    />
                  </div>
                </div>

                {searchType === 'plate' && (
                  <div className="space-y-2">
                    <Label htmlFor="last4" className="text-xs font-semibold text-slate-300">
                      Últimos 4 dígitos de tu celular
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="last4"
                        name="last4"
                        value={last4}
                        onChange={(e) => setLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="4567"
                        inputMode="numeric"
                        maxLength={4}
                        pattern="\d{4}"
                        disabled={isSubmitting}
                        className="h-11 pl-10 rounded-xl border-white/10 bg-[#0B0D13] font-mono text-white placeholder:text-slate-500 focus-visible:border-orange-500/60 focus-visible:ring-orange-500/30 focus-visible:ring-offset-0 [color-scheme:dark]"
                        required
                      />
                    </div>
                    <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <ShieldCheck className="h-3.5 w-3.5 text-orange-400/80 shrink-0" />
                      Por seguridad, validamos tu identidad con tu teléfono.
                    </p>
                  </div>
                )}

                {error && (
                  <div
                    role="alert"
                    className="flex items-start gap-2.5 text-sm font-medium text-rose-200 bg-rose-500/10 p-3.5 rounded-xl border border-rose-500/30"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-xl text-sm font-bold uppercase tracking-wider bg-orange-500 hover:bg-orange-400 text-slate-950 shadow-[0_0_24px_rgba(249,115,22,0.3)] border border-orange-400/50 transition-all"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Consultando estado...
                    </span>
                  ) : (
                    'Consultar Estado'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="mt-10 text-center text-xs sm:text-sm text-slate-400 space-y-3">
          <p>¿No tienes un código? Contacta a tu taller para que te lo envíen por WhatsApp.</p>
          <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-slate-500">
            <Link
              href="/legal/privacidad"
              className="underline decoration-white/15 underline-offset-4 transition-colors hover:text-orange-300"
            >
              Política de Privacidad
            </Link>
            <span aria-hidden="true">·</span>
            <Link
              href="/legal/terminos"
              className="underline decoration-white/15 underline-offset-4 transition-colors hover:text-orange-300"
            >
              Términos y Condiciones
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
