'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2, Bike, Phone, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { searchOrderByPlate } from './actions'

interface BuscadorPlacaProps {
  workshopId: string
  workshopSlug?: string
  primaryColor?: string
}

export function BuscadorPlaca({
  workshopId,
  workshopSlug,
  primaryColor = '#3b82f6',
}: BuscadorPlacaProps) {
  const router = useRouter()
  const [plate, setPlate] = React.useState('')
  const [last4, setLast4] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (isSubmitting) return

    const normalizedPlate = plate.replace(/\s+/g, '').toUpperCase()
    const cleanLast4 = last4.replace(/\D/g, '')

    if (!normalizedPlate) {
      setError('Ingresa la placa de tu motocicleta.')
      return
    }
    if (!/^\d{4}$/.test(cleanLast4)) {
      setError('Ingresa los últimos 4 dígitos numéricos de tu celular.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await searchOrderByPlate(workshopId, normalizedPlate, cleanLast4)

      if (result.success && result.token) {
        const targetPath = workshopSlug
          ? `/t/${workshopSlug}/track/${result.token}`
          : `/track/${result.token}`
        router.push(targetPath)
        return
      }

      setError(result.error || 'No se encontró ninguna orden con esos datos.')
    } catch (err) {
      setError('Ocurrió un error de conexión al buscar tu orden. Intenta nuevamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg border-t-4" style={{ borderTopColor: primaryColor }}>
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Search className="w-5 h-5" style={{ color: primaryColor }} />
          ¿Dónde está mi moto?
        </CardTitle>
        <CardDescription>
          Consulta el estado de tu reparación en tiempo real.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="plate">Placa / Patente</Label>
            <div className="relative">
              <Bike className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                id="plate"
                name="plate"
                value={plate}
                onChange={(e) => setPlate(e.target.value.replace(/\s+/g, '').toUpperCase())}
                placeholder="ABC-123"
                disabled={isSubmitting}
                autoCapitalize="characters"
                autoComplete="off"
                className="pl-9 uppercase font-mono"
                required
              />
            </div>
          </div>

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
              Por tu seguridad, validamos tu identidad con tu teléfono.
            </p>
          </div>

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
            className="w-full h-12 text-base font-semibold text-white"
            style={{ backgroundColor: primaryColor }}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Buscando orden...
              </span>
            ) : (
              'Rastrear Mi Orden'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
