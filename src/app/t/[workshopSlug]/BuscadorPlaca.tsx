'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2, Bike, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { searchOrderByPlate } from './actions'

interface BuscadorPlacaProps {
  workshopId: string
  primaryColor?: string
}

export function BuscadorPlaca({ workshopId, primaryColor = '#3b82f6' }: BuscadorPlacaProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const plate = formData.get('plate') as string
    const last4 = formData.get('last4') as string

    try {
      const result = await searchOrderByPlate(workshopId, plate, last4)
      
      if (result.success && result.token) {
        // Redirigir al tracker
        router.push(`/track/${result.token}`)
      } else {
        setError(result.error || 'Error al buscar la orden.')
      }
    } catch (err) {
      setError('Ocurrió un error inesperado.')
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
                placeholder="ABC-123"
                className="pl-9 uppercase"
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
                placeholder="4567"
                maxLength={4}
                pattern="\d{4}"
                className="pl-9"
                required
              />
            </div>
            <p className="text-[10px] text-slate-400">Por tu seguridad, validamos tu identidad con tu teléfono.</p>
          </div>

          {error && (
            <p className="text-sm font-medium text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20">
              {error}
            </p>
          )}

          <Button 
            type="submit" 
            disabled={isSubmitting} 
            className="w-full h-12 text-lg font-semibold"
            style={{ backgroundColor: primaryColor }}
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Rastrear Mi Orden'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
