'use client'

import { useState, useTransition } from 'react'
import { signIn } from './actions'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Wrench, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await signIn(formData)
      if (result?.error) {
        setError(result.error)
      }
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md space-y-8">
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
          <form action={handleSubmit}>
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
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Autenticando...</span>
                  </div>
                ) : (
                  "Entrar al Sistema"
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
