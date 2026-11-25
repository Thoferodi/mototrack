'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, Loader2, Bike, Phone, Hash, ArrowLeft, AlertCircle } from 'lucide-react'
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
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 font-sans">
      {/* Header Minimalista */}
      <nav className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-xl flex items-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-600 text-white font-bold text-sm">
              M
            </div>
            <span className="text-xl font-bold tracking-tight">MotoTrack</span>
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Inicio
            </Link>
          </Button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 flex flex-col items-center">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-4">
            Rastrea tu <span className="text-orange-600">Moto</span>
          </h1>
          <p className="text-slate-600 max-w-md mx-auto">
            Consulta el estado de tu reparación en tiempo real usando tu placa o código de seguimiento.
          </p>
        </div>

        <Card className="w-full max-w-md shadow-xl border-t-4 border-orange-600 bg-white">
          <CardHeader>
            <div className="flex gap-2 p-1 bg-slate-100 rounded-lg mb-4">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleTabChange('plate')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                  searchType === 'plate'
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Por Placa
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleTabChange('token')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                  searchType === 'token'
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Por Código
              </button>
            </div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Search className="w-5 h-5 text-orange-600" />
              {searchType === 'plate' ? 'Buscar por Placa' : 'Buscar por Código'}
            </CardTitle>
            <CardDescription>
              {searchType === 'plate'
                ? 'Ingresa la placa de tu moto y valida tu identidad.'
                : 'Ingresa el código de seguimiento enviado por WhatsApp.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="query">
                  {searchType === 'plate' ? 'Placa / Patente' : 'Código de Seguimiento'}
                </Label>
                <div className="relative">
                  {searchType === 'plate' ? (
                    <Bike className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  ) : (
                    <Hash className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
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
                    className={`pl-9 font-mono ${searchType === 'plate' ? 'uppercase' : ''}`}
                    required
                  />
                </div>
              </div>

              {searchType === 'plate' && (
                <div className="space-y-2">
                  <Label htmlFor="last4">Últimos 4 dígitos de tu celular</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
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
                      className="pl-9 font-mono"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Por seguridad, validamos tu identidad con tu teléfono.
                  </p>
                </div>
              )}

              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2 text-sm font-medium text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 text-base font-semibold bg-orange-600 hover:bg-orange-700 text-white"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Consultando estado...
                  </span>
                ) : (
                  'Consultar Estado'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-12 text-center text-sm text-slate-500">
          <p>¿No tienes un código? Contacta a tu taller para que te lo envíen por WhatsApp.</p>
        </div>
      </main>
    </div>
  )
}
