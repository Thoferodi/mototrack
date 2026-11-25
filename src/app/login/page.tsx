'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signIn } from './actions'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Wrench, AlertCircle, Loader2, ArrowLeft } from 'lucide-react'

export default function LoginPage() {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setIsPending(true)

    const formData = new FormData(e.currentTarget)

    try {
      const result = await signIn(formData)
      if (result?.error) {
        setError(result.error)
        setIsPending(false)
      }
    } catch (err: any) {
      // Next.js redirect() throws a special error with digest NEXT_REDIRECT; ignore it so navigation proceeds
      if (err?.digest?.startsWith('NEXT_REDIRECT')) {
        return
      }
      setError('Ocurrió un error al intentar iniciar sesión.')
      setIsPending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-start">
          <Button asChild variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al inicio
            </Link>
          </Button>
        </div>

        {/* Logo / Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-white shadow-lg shadow-primary/20 mb-4">
            <Wrench className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">MotoTrack</h1>
          <p className="text-slate-500 font-medium">Gestión inteligente para talleres</p>
        </div>

        <Card className="border-2 shadow-xl shadow-slate-200/50">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Iniciar Sesión</CardTitle>
            <CardDescription>
              Ingresa tus credenciales para acceder a tu panel
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="font-medium">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-black uppercase tracking-wider text-slate-500">Correo Electrónico</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="ejemplo@taller.com"
                  required
                  className="h-12 border-2 focus-visible:ring-primary"
                  disabled={isPending}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-black uppercase tracking-wider text-slate-500">Contraseña</Label>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="h-12 border-2 focus-visible:ring-primary"
                  disabled={isPending}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                className="w-full h-12 text-base font-bold shadow-lg shadow-primary/20"
                disabled={isPending}
              >
                {isPending ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Autenticando...</span>
                  </div>
                ) : (
                  'Entrar al Sistema'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <p className="text-center text-xs text-slate-400 font-medium uppercase tracking-widest">
          Protegido por MotoTrack Seguridad
        </p>
      </div>
    </div>
  )
}
