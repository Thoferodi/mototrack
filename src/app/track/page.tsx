'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, Loader2, Bike, Phone, Hash, ArrowLeft } from 'lucide-react'
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const query = formData.get('query') as string
    const last4 = formData.get('last4') as string

    try {
      const result = await globalSearchOrder(query, searchType === 'plate' ? last4 : undefined)
      
      if (result.success && result.token) {
        router.push(`/track/${result.token}`)
      } else {
        setError(result.error || 'No se encontró la orden.')
      }
    } catch (err) {
      setError('Ocurrió un error inesperado.')
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
                onClick={() => setSearchType('plate')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                  searchType === 'plate' 
                    ? 'bg-white text-orange-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Por Placa
              </button>
              <button
                onClick={() => setSearchType('token')}
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
                    placeholder={searchType === 'plate' ? 'ABC-123' : 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'}
                    className={`pl-9 ${searchType === 'plate' ? 'uppercase' : ''}`}
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
                      placeholder="4567"
                      maxLength={4}
                      pattern="\d{4}"
                      className="pl-9"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">Por seguridad, validamos tu identidad con tu teléfono.</p>
                </div>
              )}

              {error && (
                <p className="text-sm font-medium text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                  {error}
                </p>
              )}

              <Button 
                type="submit" 
                disabled={isSubmitting} 
                className="w-full h-12 text-lg font-semibold bg-orange-600 hover:bg-orange-700 text-white"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
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
