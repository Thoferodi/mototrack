'use client'

import * as React from 'react'
import { useState } from 'react'
import Link from 'next/link'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { signIn } from './actions'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Wrench, AlertCircle, Loader2, ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react'

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { error?: string }
}) {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(() =>
    searchParams?.error === 'account_disabled'
      ? 'Tu cuenta está desactivada. Contacta al administrador de tu taller.'
      : null
  )

  const submitRef = React.useRef<HTMLButtonElement>(null)
  const rawX = useMotionValue(140)
  const springX = useSpring(rawX, { stiffness: 320, damping: 28, mass: 0.4 })
  const [hovered, setHovered] = useState(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = submitRef.current?.getBoundingClientRect()
    if (!rect) return
    rawX.set(e.clientX - rect.left)
  }

  const handleMouseLeave = () => {
    setHovered(false)
    const rect = submitRef.current?.getBoundingClientRect()
    if (rect) {
      rawX.set(rect.width * 0.72)
    }
  }

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
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#08090C] p-6 text-slate-100 [color-scheme:dark] selection:bg-orange-500/30 selection:text-orange-100">
      {/* Fondo atmosférico y haz de luz radial naranja/azul estilo Huly */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute left-1/2 top-1/2 h-[540px] w-[760px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-55 blur-[120px]"
          style={{
            background:
              'radial-gradient(ellipse at 38% 45%, rgba(249,115,22,0.34) 0%, rgba(56,189,248,0.22) 52%, rgba(8,9,12,0) 78%)',
          }}
        />
        <div
          className="absolute left-1/2 top-0 h-[420px] w-[320px] -translate-x-1/2 opacity-40 blur-[48px]"
          style={{
            background:
              'linear-gradient(180deg, rgba(56,189,248,0.18) 0%, rgba(249,115,22,0.28) 60%, rgba(8,9,12,0) 100%)',
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

      <div className="relative z-10 w-full max-w-md space-y-7">
        <div className="flex justify-start">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-semibold text-slate-300 transition-all hover:border-orange-500/35 hover:bg-white/[0.08] hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-orange-400" />
            Volver al inicio
          </Link>
        </div>

        {/* Logo / Branding */}
        <div className="text-center space-y-2.5">
          <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-[0_0_32px_rgba(249,115,22,0.45)] ring-1 ring-white/20">
            <Wrench className="h-8 w-8" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="bg-gradient-to-br from-white via-slate-100 to-orange-200 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
              MotoTrack
            </h1>
            <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-orange-400">
              SaaS
            </span>
          </div>
          <p className="text-sm font-medium text-slate-400">
            Gestión inteligente para talleres de motocicletas
          </p>
        </div>

        {/* Tarjeta Glass Oscura */}
        <div className="relative">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-10 -top-px h-px bg-gradient-to-r from-transparent via-orange-400/80 to-transparent"
          />
          <div className="rounded-2xl border border-white/10 bg-[#101218]/90 p-6 sm:p-7 shadow-[0_24px_80px_rgba(0,0,0,0.75)] backdrop-blur-xl">
            <div className="space-y-1.5 pb-5 border-b border-white/[0.07]">
              <h2 className="text-xl font-bold tracking-tight text-white">Iniciar Sesión</h2>
              <p className="text-sm text-slate-400">
                Ingresa tus credenciales para acceder a tu panel operativo
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-5">
              {error && (
                <div
                  role="alert"
                  className="flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-sm text-rose-200 animate-in fade-in slide-in-from-top-2"
                >
                  <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
                  <p className="font-medium">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-[11px] font-bold uppercase tracking-wider text-slate-400"
                >
                  Correo Electrónico
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="ejemplo@taller.com"
                  required
                  disabled={isPending}
                  className="h-12 rounded-xl border-white/10 bg-[#0B0D13] px-3.5 text-white placeholder:text-slate-500 focus-visible:border-orange-500/60 focus-visible:ring-orange-500/30 focus-visible:ring-offset-0 [color-scheme:dark]"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-[11px] font-bold uppercase tracking-wider text-slate-400"
                >
                  Contraseña
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  disabled={isPending}
                  className="h-12 rounded-xl border-white/10 bg-[#0B0D13] px-3.5 text-white placeholder:text-slate-500 focus-visible:border-orange-500/60 focus-visible:ring-orange-500/30 focus-visible:ring-offset-0 [color-scheme:dark]"
                />
              </div>

              <button
                ref={submitRef}
                type="submit"
                disabled={isPending}
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={handleMouseLeave}
                className="group relative inline-flex h-12 w-full items-center justify-center overflow-hidden rounded-full border border-white/60 bg-[#D9D9DC] px-6 text-xs font-bold uppercase tracking-[0.05em] text-[#3B1706] shadow-[0_0_28px_rgba(249,115,22,0.3)] transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-70 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
              >
                <motion.div
                  aria-hidden="true"
                  style={{ x: springX }}
                  className="pointer-events-none absolute left-0 top-1/2 -z-0 h-[140px] w-[220px] -translate-x-1/2 -translate-y-1/2"
                >
                  <div
                    className={`absolute left-1/2 top-1/2 h-[116px] w-[116px] -translate-x-1/2 -translate-y-1/2 rounded-full transition-opacity duration-300 ${
                      hovered ? 'opacity-100' : 'opacity-90'
                    }`}
                    style={{
                      background:
                        'radial-gradient(50% 50% at 50% 50%, #FFFBEB 5%, #FDBA74 28%, #F97316 52%, rgba(249,115,22,0.35) 72%, rgba(249,115,22,0) 95%)',
                    }}
                  />
                  <div
                    className="absolute left-1/2 top-1/2 h-[98px] w-[200px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[6px]"
                    style={{
                      background:
                        'radial-gradient(45% 45% at 50% 50%, #FFFFFF 22%, #FEF3C7 48%, #FDBA74 68%, rgba(249,115,22,0) 100%)',
                    }}
                  />
                </motion.div>
                <span className="relative z-10 inline-flex items-center gap-2 whitespace-nowrap">
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Autenticando...</span>
                    </>
                  ) : (
                    <>
                      <span>Entrar al Sistema</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </span>
              </button>
            </form>
          </div>
        </div>

        <p className="flex items-center justify-center gap-1.5 text-center text-[11px] font-medium uppercase tracking-widest text-slate-500">
          <ShieldCheck className="h-3.5 w-3.5 text-orange-400/80" />
          Protegido por MotoTrack Seguridad
        </p>
      </div>
    </div>
  )
}
