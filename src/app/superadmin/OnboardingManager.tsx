'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Building2,
  ClipboardList,
  Check,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  Loader2,
  LogOut,
  MapPin,
  MessageSquare,
  Palette,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
  X,
} from 'lucide-react'
import { MotoTrackBrand } from '@/components/brand/MotoTrackBrand'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { signOut } from '@/app/login/actions'
import {
  OnboardingDeliveryCredentials,
  SuperadminWorkshopRow,
  WorkshopPlan,
  createWorkshopWithOwner,
} from './actions'

interface OnboardingManagerProps {
  initialWorkshops: SuperadminWorkshopRow[]
  superadminEmail: string
}

const DARK_INPUT_CLASS =
  'h-10 rounded-xl border-white/10 bg-[#0B0D13] text-white placeholder:text-slate-500 focus-visible:border-orange-500/60 focus-visible:ring-orange-500/30 focus-visible:ring-offset-0 [color-scheme:dark]'

const PLAN_OPTIONS: { value: WorkshopPlan; label: string; badgeClass: string }[] = [
  {
    value: 'free',
    label: 'Free',
    badgeClass: 'border-slate-500/35 bg-slate-500/15 text-slate-300',
  },
  {
    value: 'pro',
    label: 'Pro',
    badgeClass: 'border-orange-500/40 bg-orange-500/15 text-orange-300',
  },
  {
    value: 'enterprise',
    label: 'Enterprise',
    badgeClass: 'border-sky-500/40 bg-sky-500/15 text-sky-300',
  },
]

const PLAN_META: Record<WorkshopPlan, { label: string; badgeClass: string }> = {
  free: PLAN_OPTIONS[0],
  pro: PLAN_OPTIONS[1],
  enterprise: PLAN_OPTIONS[2],
}

function slugifyWorkshopName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 60)
}

function sanitizeSlugInput(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-{2,}/g, '-')
    .slice(0, 60)
}

function generateSecurePassword(length = 14): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghijkmnopqrstuvwxyz'
  const digits = '23456789'
  const symbols = '!@#$%&*?'
  const all = upper + lower + digits + symbols

  const pick = (charset: string) => {
    const buf = new Uint32Array(1)
    window.crypto.getRandomValues(buf)
    return charset[buf[0] % charset.length]
  }

  const chars = [pick(upper), pick(lower), pick(digits), pick(symbols)]
  for (let i = chars.length; i < length; i++) {
    chars.push(pick(all))
  }

  for (let i = chars.length - 1; i > 0; i--) {
    const buf = new Uint32Array(1)
    window.crypto.getRandomValues(buf)
    const j = buf[0] % (i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }

  return chars.join('')
}

function formatDateEs(value: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

export function OnboardingManager({
  initialWorkshops,
  superadminEmail,
}: OnboardingManagerProps) {
  const router = useRouter()
  const [workshops, setWorkshops] = React.useState<SuperadminWorkshopRow[]>(initialWorkshops)
  const [search, setSearch] = React.useState('')
  const [origin, setOrigin] = React.useState('')
  const [isSigningOut, setIsSigningOut] = React.useState(false)

  // Form states
  const [workshopName, setWorkshopName] = React.useState('')
  const [slug, setSlug] = React.useState('')
  const [slugManuallyEdited, setSlugManuallyEdited] = React.useState(false)
  const [phoneWhatsapp, setPhoneWhatsapp] = React.useState('')
  const [address, setAddress] = React.useState('')
  const [primaryColor, setPrimaryColor] = React.useState('#F97316')
  const [planType, setPlanType] = React.useState<WorkshopPlan>('pro')

  const [ownerFullName, setOwnerFullName] = React.useState('')
  const [ownerEmail, setOwnerEmail] = React.useState('')
  const [ownerPassword, setOwnerPassword] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(true)

  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [formError, setFormError] = React.useState<string | null>(null)
  const [delivery, setDelivery] = React.useState<OnboardingDeliveryCredentials | null>(null)
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null)

  React.useEffect(() => {
    setWorkshops(initialWorkshops)
  }, [initialWorkshops])

  React.useEffect(() => {
    setOrigin(window.location.origin)
    setOwnerPassword(generateSecurePassword())
  }, [])

  React.useEffect(() => {
    const prev = document.documentElement.style.colorScheme
    document.documentElement.style.colorScheme = 'dark'
    return () => {
      document.documentElement.style.colorScheme = prev
    }
  }, [])

  const existingSlugs = React.useMemo(
    () => new Set(workshops.map((w) => w.slug.toLowerCase())),
    [workshops]
  )

  const cleanSlug = slug.replace(/^-+|-+$/g, '')
  const isSlugTaken = Boolean(cleanSlug && existingSlugs.has(cleanSlug))

  const stats = React.useMemo(() => {
    const totalWorkshops = workshops.length
    const paidWorkshops = workshops.filter(
      (w) => w.plan_type === 'pro' || w.plan_type === 'enterprise'
    ).length
    const totalActiveUsers = workshops.reduce((acc, w) => acc + w.activeUsersCount, 0)
    const totalOrders = workshops.reduce((acc, w) => acc + w.ordersCount, 0)
    return { totalWorkshops, paidWorkshops, totalActiveUsers, totalOrders }
  }, [workshops])

  const filteredWorkshops = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return workshops
    return workshops.filter((w) => {
      return (
        w.name.toLowerCase().includes(q) ||
        w.slug.toLowerCase().includes(q) ||
        (w.phone_whatsapp || '').toLowerCase().includes(q) ||
        w.plan_type.toLowerCase().includes(q)
      )
    })
  }, [workshops, search])

  const handleWorkshopNameChange = (value: string) => {
    setWorkshopName(value)
    if (!slugManuallyEdited) {
      setSlug(slugifyWorkshopName(value))
    }
  }

  const handleSlugChange = (value: string) => {
    setSlugManuallyEdited(true)
    setSlug(sanitizeSlugInput(value))
  }

  const handleSyncSlugFromName = () => {
    setSlugManuallyEdited(false)
    setSlug(slugifyWorkshopName(workshopName))
  }

  const handleGeneratePassword = () => {
    setOwnerPassword(generateSecurePassword())
    setShowPassword(true)
  }

  const copyToClipboard = async (key: string, text: string) => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopiedKey(key)
      setTimeout(() => {
        setCopiedKey((prev) => (prev === key ? null : prev))
      }, 2200)
    } catch {
      setFormError('No se pudo copiar al portapapeles. Cópialo manualmente.')
    }
  }

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOut()
    } catch (err: any) {
      if (err?.digest?.startsWith('NEXT_REDIRECT')) {
        return
      }
      setIsSigningOut(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    const normalizedSlug = cleanSlug
    if (normalizedSlug.length < 3) {
      setFormError('El slug debe tener al menos 3 caracteres válidos.')
      return
    }
    if (isSlugTaken) {
      setFormError(`El slug "${normalizedSlug}" ya existe. Usa uno diferente.`)
      return
    }
    if (!/^#[0-9A-Fa-f]{6}$/.test(primaryColor.trim())) {
      setFormError('Ingresa un color corporativo válido en formato hexadecimal (ej. #F97316).')
      return
    }
    if (ownerPassword.length < 8) {
      setFormError('La contraseña temporal debe tener al menos 8 caracteres.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await createWorkshopWithOwner({
        workshopName: workshopName.trim(),
        slug: normalizedSlug,
        phoneWhatsapp: phoneWhatsapp.trim(),
        address: address.trim(),
        primaryColor: primaryColor.trim(),
        planType,
        ownerFullName: ownerFullName.trim(),
        ownerEmail: ownerEmail.trim().toLowerCase(),
        ownerPassword,
      })

      if (!res.success || !res.workshop || !res.credentials) {
        setFormError(res.error || 'No se pudo completar el alta del taller.')
        return
      }

      setWorkshops((prev) => [res.workshop!, ...prev])
      setDelivery(res.credentials)

      // Reset form for next pilot workshop
      setWorkshopName('')
      setSlug('')
      setSlugManuallyEdited(false)
      setPhoneWhatsapp('')
      setAddress('')
      setPrimaryColor('#F97316')
      setPlanType('pro')
      setOwnerFullName('')
      setOwnerEmail('')
      setOwnerPassword(generateSecurePassword())
      router.refresh()
    } catch (err: any) {
      setFormError(err?.message || 'Error inesperado al crear el taller piloto.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const loginUrl = delivery
    ? `${origin || ''}${delivery.loginPath}`
    : ''
  const publicSiteUrl = delivery
    ? `${origin || ''}${delivery.publicSitePath}`
    : ''

  const whatsappDeliveryMessage = delivery
    ? [
        `¡Hola ${delivery.ownerName}! Bienvenido a *MotoTrack* 🏍️🔧`,
        `Ya quedó activo el entorno de *${delivery.workshopName}*:`,
        ``,
        `🔐 *Acceso al Panel:* ${loginUrl}`,
        `📧 *Correo:* ${delivery.ownerEmail}`,
        `🔑 *Contraseña temporal:* ${delivery.tempPassword}`,
        `🌐 *Tu micrositio público:* ${publicSiteUrl}`,
        ``,
        `Te recomendamos guardar estos datos e ingresar para revisar tus órdenes y personalizar tu equipo.`,
      ].join('\n')
    : ''

  const cleanDeliveryPhone = delivery?.phoneWhatsapp.replace(/\D/g, '') || ''

  return (
    <div className="relative min-h-screen bg-[#08090C] text-slate-100 [color-scheme:dark] selection:bg-orange-500/30 selection:text-orange-100">
      {/* Subtle Huly ambient radial glow */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute left-1/2 -top-40 h-[420px] w-[760px] -translate-x-1/2 rounded-full opacity-35 blur-[120px]"
          style={{
            background:
              'radial-gradient(ellipse at 50% 45%, rgba(249,115,22,0.28) 0%, rgba(56,189,248,0.14) 55%, rgba(8,9,12,0) 80%)',
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Top Bar */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <MotoTrackBrand variant="horizontal" theme="dark" size="sm" />
              <Badge
                variant="outline"
                className="border-orange-500/35 bg-orange-500/15 text-orange-300 text-[10px] font-bold uppercase tracking-wider gap-1"
              >
                <ShieldCheck className="w-3 h-3" />
                Superadmin
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Alta Rápida de Talleres
            </h1>
            <p className="text-sm text-slate-400">
              Onboarding atómico para talleres piloto y su propietario inicial sin SQL manual.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#101218] px-3 py-2 text-xs text-slate-300">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="font-mono truncate max-w-[200px]">{superadminEmail}</span>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="h-9 rounded-xl border-white/10 bg-[#101218] text-slate-300 hover:bg-white/[0.06] hover:text-white gap-2 text-xs font-semibold"
            >
              {isSigningOut ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <LogOut className="w-3.5 h-3.5" />
              )}
              Cerrar sesión
            </Button>
          </div>
        </header>

        {/* KPI Strip */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-white/10 bg-[#101218] p-4">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
              <span>Talleres Registrados</span>
              <Building2 className="w-4 h-4 text-orange-400" />
            </div>
            <p className="mt-2 text-2xl font-bold text-white tabular-nums">
              {stats.totalWorkshops}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#101218] p-4">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
              <span>Planes Pro / Enterprise</span>
              <Sparkles className="w-4 h-4 text-sky-400" />
            </div>
            <p className="mt-2 text-2xl font-bold text-sky-300 tabular-nums">
              {stats.paidWorkshops}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#101218] p-4">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
              <span>Usuarios Activos</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="mt-2 text-2xl font-bold text-emerald-300 tabular-nums">
              {stats.totalActiveUsers}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#101218] p-4">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
              <span>Órdenes Totales</span>
              <ClipboardList className="w-4 h-4 text-amber-400" />
            </div>
            <p className="mt-2 text-2xl font-bold text-white tabular-nums">
              {stats.totalOrders}
            </p>
          </div>
        </section>

        {/* Delivery Card (after successful onboarding) */}
        {delivery && (
          <section
            aria-label="Resumen de entrega del nuevo taller"
            className="relative rounded-2xl border border-emerald-500/35 bg-[#101218] p-5 sm:p-6 shadow-[0_0_40px_rgba(16,185,129,0.12)]"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-10 -top-px h-px bg-gradient-to-r from-transparent via-emerald-400/80 to-transparent"
            />
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-white/[0.08]">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    ¡Taller &ldquo;{delivery.workshopName}&rdquo; creado con éxito!
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400">
                    Propietario <span className="text-slate-200 font-medium">{delivery.ownerName}</span>{' '}
                    listo. Copia las credenciales y envíalas por WhatsApp.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  onClick={() => copyToClipboard('whatsapp_bundle', whatsappDeliveryMessage)}
                  className="h-9 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-xs gap-1.5"
                >
                  {copiedKey === 'whatsapp_bundle' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      ¡Resumen copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copiar todo para WhatsApp
                    </>
                  )}
                </Button>

                {cleanDeliveryPhone && (
                  <Button
                    asChild
                    variant="outline"
                    className="h-9 rounded-xl border-emerald-500/35 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 hover:text-emerald-200 text-xs font-semibold gap-1.5"
                  >
                    <a
                      href={`https://wa.me/${cleanDeliveryPhone}?text=${encodeURIComponent(
                        whatsappDeliveryMessage
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Abrir WhatsApp
                    </a>
                  </Button>
                )}

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Cerrar tarjeta de entrega"
                  onClick={() => setDelivery(null)}
                  className="h-9 w-9 rounded-xl text-slate-400 hover:bg-white/[0.06] hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Login URL */}
              <div className="rounded-xl border border-white/10 bg-[#0B0D13] p-3 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <span>URL de Acceso</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('login_url', loginUrl)}
                    className="text-orange-400 hover:text-orange-300 inline-flex items-center gap-1"
                  >
                    {copiedKey === 'login_url' ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
                <p className="font-mono text-xs text-white truncate">{loginUrl}</p>
              </div>

              {/* Owner Email */}
              <div className="rounded-xl border border-white/10 bg-[#0B0D13] p-3 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <span>Correo del Dueño</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('owner_email', delivery.ownerEmail)}
                    className="text-orange-400 hover:text-orange-300 inline-flex items-center gap-1"
                  >
                    {copiedKey === 'owner_email' ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
                <p className="font-mono text-xs text-white truncate">{delivery.ownerEmail}</p>
              </div>

              {/* Temp Password */}
              <div className="rounded-xl border border-white/10 bg-[#0B0D13] p-3 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <span>Contraseña Temporal</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('temp_password', delivery.tempPassword)}
                    className="text-orange-400 hover:text-orange-300 inline-flex items-center gap-1"
                  >
                    {copiedKey === 'temp_password' ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
                <p className="font-mono text-xs text-amber-300 truncate">
                  {delivery.tempPassword}
                </p>
              </div>

              {/* Public Site URL */}
              <div className="rounded-xl border border-white/10 bg-[#0B0D13] p-3 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <span>Micrositio Público</span>
                  <div className="flex items-center gap-2">
                    <Link
                      href={delivery.publicSitePath}
                      target="_blank"
                      className="text-sky-400 hover:text-sky-300"
                      title="Abrir micrositio"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => copyToClipboard('public_url', publicSiteUrl)}
                      className="text-orange-400 hover:text-orange-300 inline-flex items-center gap-1"
                    >
                      {copiedKey === 'public_url' ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
                <p className="font-mono text-xs text-sky-300 truncate">{publicSiteUrl}</p>
              </div>
            </div>
          </section>
        )}

        {/* Onboarding Form: Nuevo Taller Piloto */}
        <section className="relative rounded-2xl border border-white/10 bg-[#101218] overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-12 -top-px h-px bg-gradient-to-r from-transparent via-orange-400/75 to-transparent"
          />

          <div className="px-5 sm:px-6 py-4 border-b border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-orange-400" />
                Nuevo Taller Piloto
              </h2>
              <p className="text-xs text-slate-400">
                Crea el tenant en <code className="font-mono text-slate-300">workshops</code> y su
                primer propietario (<code className="font-mono text-slate-300">owner</code>) en una
                operación atómica.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6">
            {formError && (
              <div
                role="alert"
                className="bg-rose-500/10 border border-rose-500/30 text-rose-200 text-sm p-4 rounded-xl flex items-center gap-3"
              >
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
                <span className="font-medium flex-1">{formError}</span>
                <button
                  type="button"
                  aria-label="Cerrar error"
                  onClick={() => setFormError(null)}
                  className="text-rose-300 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Columna 1: Datos del Taller */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-400">
                  <Building2 className="w-3.5 h-3.5" />
                  1. Datos del Taller
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="workshop-name" className="text-xs font-semibold text-slate-300">
                      Nombre del Taller *
                    </Label>
                    <Input
                      id="workshop-name"
                      value={workshopName}
                      onChange={(e) => handleWorkshopNameChange(e.target.value)}
                      placeholder="Ej. Motos El Rayo Medellín"
                      className={DARK_INPUT_CLASS}
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="workshop-slug" className="text-xs font-semibold text-slate-300">
                        Slug (URL pública) *
                      </Label>
                      {slugManuallyEdited && workshopName.trim() && (
                        <button
                          type="button"
                          onClick={handleSyncSlugFromName}
                          disabled={isSubmitting}
                          className="text-[11px] font-semibold text-orange-400 hover:text-orange-300"
                        >
                          Autogenerar
                        </button>
                      )}
                    </div>
                    <Input
                      id="workshop-slug"
                      value={slug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      placeholder="motos-el-rayo-medellin"
                      className={`${DARK_INPUT_CLASS} font-mono text-xs`}
                      required
                      disabled={isSubmitting}
                    />
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="text-slate-500 font-mono truncate">
                        /t/{cleanSlug || 'tu-taller'}
                      </span>
                      {cleanSlug.length >= 3 && (
                        <span
                          className={
                            isSlugTaken ? 'text-rose-400 font-semibold' : 'text-emerald-400 font-semibold'
                          }
                        >
                          {isSlugTaken ? 'Ya existe' : 'Disponible'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="workshop-whatsapp"
                      className="text-xs font-semibold text-slate-300 flex items-center gap-1.5"
                    >
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      WhatsApp del Taller *
                    </Label>
                    <Input
                      id="workshop-whatsapp"
                      value={phoneWhatsapp}
                      onChange={(e) => setPhoneWhatsapp(e.target.value)}
                      placeholder="+57 300 123 4567"
                      className={DARK_INPUT_CLASS}
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="workshop-address"
                      className="text-xs font-semibold text-slate-300 flex items-center gap-1.5"
                    >
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      Dirección <span className="text-slate-500 font-normal">(opcional)</span>
                    </Label>
                    <Input
                      id="workshop-address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Cra 45 # 32-10, Medellín"
                      className={DARK_INPUT_CLASS}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="workshop-color-hex"
                      className="text-xs font-semibold text-slate-300 flex items-center gap-1.5"
                    >
                      <Palette className="w-3.5 h-3.5 text-slate-400" />
                      Color Corporativo
                    </Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        aria-label="Selector de color corporativo"
                        value={/^#[0-9A-Fa-f]{6}$/.test(primaryColor) ? primaryColor : '#F97316'}
                        onChange={(e) => setPrimaryColor(e.target.value.toUpperCase())}
                        disabled={isSubmitting}
                        className="h-10 w-12 shrink-0 cursor-pointer rounded-xl border border-white/10 bg-[#0B0D13] p-1"
                      />
                      <Input
                        id="workshop-color-hex"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        placeholder="#F97316"
                        maxLength={7}
                        className={`${DARK_INPUT_CLASS} font-mono uppercase`}
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="workshop-plan" className="text-xs font-semibold text-slate-300">
                      Plan del Taller *
                    </Label>
                    <select
                      id="workshop-plan"
                      value={planType}
                      onChange={(e) => setPlanType(e.target.value as WorkshopPlan)}
                      disabled={isSubmitting}
                      className="flex h-10 w-full rounded-xl border border-white/10 bg-[#0B0D13] px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/25 [color-scheme:dark]"
                    >
                      {PLAN_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value} className="bg-[#101218] text-white">
                          {opt.label} ({opt.value})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Columna 2: Datos del Dueño Inicial */}
              <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl border border-white/10 bg-[#0B0D13]/70 p-4 sm:p-5 space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-400">
                      <KeyRound className="w-3.5 h-3.5" />
                      2. Propietario Inicial (Owner)
                    </div>
                    <Badge
                      variant="outline"
                      className="border-amber-400/35 bg-amber-500/15 text-amber-300 text-[10px] shrink-0 whitespace-nowrap"
                    >
                      role: owner
                    </Badge>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="owner-name" className="text-xs font-semibold text-slate-300">
                      Nombre Completo del Dueño *
                    </Label>
                    <Input
                      id="owner-name"
                      value={ownerFullName}
                      onChange={(e) => setOwnerFullName(e.target.value)}
                      placeholder="Ej. Andrés Restrepo"
                      className={DARK_INPUT_CLASS}
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="owner-email" className="text-xs font-semibold text-slate-300">
                      Correo Electrónico *
                    </Label>
                    <Input
                      id="owner-email"
                      type="email"
                      value={ownerEmail}
                      onChange={(e) => setOwnerEmail(e.target.value)}
                      placeholder="dueno@taller.com"
                      className={DARK_INPUT_CLASS}
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <Label
                        htmlFor="owner-password"
                        className="text-xs font-semibold text-slate-300"
                      >
                        Contraseña Temporal *
                      </Label>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleGeneratePassword}
                          disabled={isSubmitting}
                          className="h-7 px-2 rounded-lg text-[11px] font-semibold text-orange-300 hover:bg-orange-500/15 hover:text-orange-200 gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Generar
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard('form_password', ownerPassword)}
                          disabled={isSubmitting || !ownerPassword}
                          className="h-7 px-2 rounded-lg text-[11px] font-semibold text-slate-300 hover:bg-white/[0.08] hover:text-white gap-1"
                        >
                          {copiedKey === 'form_password' ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-300">Copiada</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copiar</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="relative">
                      <Input
                        id="owner-password"
                        type={showPassword ? 'text' : 'password'}
                        value={ownerPassword}
                        onChange={(e) => setOwnerPassword(e.target.value)}
                        placeholder="Mínimo 8 caracteres"
                        minLength={8}
                        className={`${DARK_INPUT_CLASS} font-mono pr-10`}
                        required
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || isSlugTaken}
                  className="w-full h-11 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold shadow-[0_0_24px_rgba(249,115,22,0.28)] border border-orange-400/50 gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creando taller y propietario...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Crear Taller Piloto y Owner
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </section>

        {/* Workshops Directory */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white">Talleres Existentes</h2>
              <p className="text-xs text-slate-400">
                {filteredWorkshops.length} de {workshops.length} talleres visibles en plataforma.
              </p>
            </div>

            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre, slug, plan o WhatsApp..."
                className="h-10 pl-10 rounded-xl bg-[#101218] border-white/10 text-white placeholder:text-slate-500 focus-visible:border-orange-500/60 focus-visible:ring-orange-500/30 focus-visible:ring-offset-0 [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Desktop Table */}
          <Card className="hidden md:block rounded-2xl border border-white/10 bg-[#101218] text-slate-100 shadow-none overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto [color-scheme:dark]">
                <table className="w-full text-sm text-left">
                  <thead className="text-[11px] text-slate-400 uppercase tracking-wider bg-[#0B0D13] border-b border-white/10">
                    <tr>
                      <th className="px-6 py-3.5 font-bold">Taller</th>
                      <th className="px-4 py-3.5 font-bold">Slug / Micrositio</th>
                      <th className="px-4 py-3.5 font-bold">Plan</th>
                      <th className="px-4 py-3.5 font-bold">WhatsApp</th>
                      <th className="px-4 py-3.5 font-bold text-right">Usuarios Activos</th>
                      <th className="px-6 py-3.5 font-bold text-right">Órdenes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                    {filteredWorkshops.map((w) => {
                      const planMeta = PLAN_META[w.plan_type] || PLAN_META.free
                      return (
                        <tr key={w.id} className="transition-colors hover:bg-white/[0.03]">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <span
                                className="w-3 h-8 rounded-full shrink-0 border border-white/15"
                                style={{ backgroundColor: w.primary_color || '#F97316' }}
                                title={w.primary_color || '#F97316'}
                              />
                              <div className="min-w-0">
                                <p className="font-semibold text-white truncate">{w.name}</p>
                                <p className="text-xs text-slate-500 truncate">
                                  {w.address || `Alta: ${formatDateEs(w.created_at)}`}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <Link
                              href={`/t/${w.slug}`}
                              target="_blank"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#0B0D13] px-2.5 py-1 font-mono text-xs text-sky-300 hover:border-sky-400/40 hover:text-sky-200 transition-colors"
                            >
                              <Globe className="w-3 h-3 shrink-0" />
                              /t/{w.slug}
                              <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
                            </Link>
                          </td>
                          <td className="px-4 py-4">
                            <Badge
                              variant="outline"
                              className={`text-xs font-semibold ${planMeta.badgeClass}`}
                            >
                              {planMeta.label}
                            </Badge>
                          </td>
                          <td className="px-4 py-4 font-mono text-xs text-slate-300">
                            {w.phone_whatsapp || '—'}
                          </td>
                          <td className="px-4 py-4 text-right font-semibold tabular-nums text-emerald-300">
                            {w.activeUsersCount}
                          </td>
                          <td className="px-6 py-4 text-right font-semibold tabular-nums text-white">
                            {w.ordersCount}
                          </td>
                        </tr>
                      )
                    })}

                    {filteredWorkshops.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">
                          No hay talleres que coincidan con tu búsqueda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Mobile Cards */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredWorkshops.map((w) => {
              const planMeta = PLAN_META[w.plan_type] || PLAN_META.free
              return (
                <div
                  key={w.id}
                  className="rounded-2xl border border-white/10 bg-[#101218] p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-2.5 h-8 rounded-full shrink-0 border border-white/15"
                        style={{ backgroundColor: w.primary_color || '#F97316' }}
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-white truncate">{w.name}</p>
                        <p className="text-xs text-slate-400 font-mono truncate">
                          {w.phone_whatsapp || 'Sin WhatsApp'}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[11px] font-semibold shrink-0 ${planMeta.badgeClass}`}
                    >
                      {planMeta.label}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/[0.06] text-xs">
                    <Link
                      href={`/t/${w.slug}`}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 font-mono text-sky-300 hover:text-sky-200 truncate"
                    >
                      <Globe className="w-3.5 h-3.5 shrink-0" />
                      /t/{w.slug}
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </Link>

                    <div className="flex items-center gap-3 shrink-0 tabular-nums">
                      <span className="text-emerald-300 font-semibold">
                        {w.activeUsersCount} usr
                      </span>
                      <span className="text-slate-300 font-semibold">{w.ordersCount} órd</span>
                    </div>
                  </div>
                </div>
              )
            })}

            {filteredWorkshops.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-[#101218] p-8 text-center text-sm text-slate-400">
                No hay talleres que coincidan con tu búsqueda.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
