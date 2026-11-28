'use client'

import * as React from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import imageCompression from 'browser-image-compression'
import SignatureCanvas from 'react-signature-canvas'
import {
  Camera,
  Search,
  User,
  Bike,
  Gauge,
  Fuel,
  FileText,
  CheckCircle2,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Check,
  PenTool,
  RotateCcw,
  Wrench,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { TEAM_ROLE_LABELS, WorkshopMechanicOption } from '@/lib/team'
import {
  searchMotorcycleByPlate,
  ensureCustomer,
  ensureMotorcycle,
  createWorkOrder,
  uploadEvidence,
  uploadSignatureDataUrl,
} from './actions'

const formSchema = z.object({
  plate: z.string().trim().min(1, 'La placa es requerida').max(20, 'Máximo 20 caracteres'),
  customer_name: z.string().trim().min(1, 'El nombre es requerido').max(120, 'Máximo 120 caracteres'),
  customer_phone: z.string().trim().min(4, 'El WhatsApp es requerido').max(30, 'Máximo 30 caracteres'),
  motorcycle_make: z.string().trim().min(1, 'La marca es requerida').max(80, 'Máximo 80 caracteres'),
  motorcycle_model: z.string().trim().min(1, 'El modelo es requerido').max(80, 'Máximo 80 caracteres'),
  motorcycle_year: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : Number(val)),
    z.number().int('Año inválido').min(1950, 'Año mínimo 1950').max(2100, 'Año inválido').optional()
  ),
  mileage: z.coerce.number({ invalid_type_error: 'Kilometraje inválido' }).min(0, 'Kilometraje inválido').max(9_999_999),
  fuel_level: z.enum(['empty', 'low', 'half', 'high', 'full']),
  mechanic_id: z.string().optional(),
  description: z.string().max(1000, 'Máximo 1000 caracteres').optional(),
  legal_consent: z.boolean().refine((val) => val === true, {
    message:
      'Debes confirmar la autorización de ingreso, firma electrónica y tratamiento de datos del cliente.',
  }),
})

type FormValues = z.infer<typeof formSchema>

const PHOTO_LABELS: Record<string, string> = {
  front: 'Frente',
  left: 'Izquierda',
  right: 'Derecha',
  dashboard: 'Tablero',
}

const DARK_INPUT_CLASS =
  'h-10 rounded-xl border-white/10 bg-[#0B0D13] text-white placeholder:text-slate-500 focus-visible:border-orange-500/60 focus-visible:ring-orange-500/30 focus-visible:ring-offset-0 [color-scheme:dark]'

export function NewOrderForm({
  teamMembers,
}: {
  teamMembers: WorkshopMechanicOption[]
}) {
  const router = useRouter()
  const [isSearching, setIsSearching] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [compressingKey, setCompressingKey] = React.useState<string | null>(null)
  const [searchFeedback, setSearchFeedback] = React.useState<{
    type: 'success' | 'info' | 'error'
    message: string
  } | null>(null)
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const [signatureError, setSignatureError] = React.useState<string | null>(null)
  const [foundCustomerId, setFoundCustomerId] = React.useState<string | undefined>(undefined)
  const [foundMotorcycleId, setFoundMotorcycleId] = React.useState<string | undefined>(undefined)
  const [photos, setPhotos] = React.useState<Record<string, File>>({})
  const [previews, setPreviews] = React.useState<Record<string, string>>({})
  const sigContainerRef = React.useRef<HTMLDivElement>(null)
  const sigCanvas = React.useRef<SignatureCanvas>(null)
  const [canvasWidth, setCanvasWidth] = React.useState(560)

  React.useEffect(() => {
    const updateSize = () => {
      if (sigContainerRef.current) {
        setCanvasWidth(sigContainerRef.current.clientWidth)
      }
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fuel_level: 'half',
      mileage: 0,
      mechanic_id: '',
      legal_consent: false,
    },
  })

  const plate = watch('plate')

  const handleSearchPlate = async () => {
    const cleanPlate = plate?.trim()
    if (!cleanPlate) {
      setSearchFeedback({ type: 'error', message: 'Ingresa una placa para buscar.' })
      return
    }
    setIsSearching(true)
    setSearchFeedback(null)
    try {
      const data = await searchMotorcycleByPlate(cleanPlate)
      if (data) {
        setFoundMotorcycleId(data.id)
        setFoundCustomerId(data.customer_id)
        setValue('customer_name', (data.customers as any)?.full_name || '', { shouldValidate: true })
        setValue('customer_phone', (data.customers as any)?.phone_whatsapp || '', {
          shouldValidate: true,
        })
        setValue('motorcycle_make', data.brand, { shouldValidate: true })
        setValue('motorcycle_model', data.model, { shouldValidate: true })
        setValue('motorcycle_year', data.year ?? undefined)
        setSearchFeedback({
          type: 'success',
          message: `Vehículo encontrado (${data.brand} ${data.model}). Datos autocompletados.`,
        })
      } else {
        setFoundMotorcycleId(undefined)
        setFoundCustomerId(undefined)
        setSearchFeedback({
          type: 'info',
          message: 'Placa no registrada en el taller. Completa los datos para crear el vehículo.',
        })
      }
    } catch (error: any) {
      console.error('Search error:', error)
      setSearchFeedback({
        type: 'error',
        message: error?.message || 'Error al buscar la placa.',
      })
    } finally {
      setIsSearching(false)
    }
  }

  const handleFileChange = async (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const options = {
      maxSizeMB: 0.25,
      maxWidthOrHeight: 1280,
      useWebWorker: true,
      fileType: 'image/webp',
    }

    setCompressingKey(key)
    setSubmitError(null)
    try {
      const compressedFile = await imageCompression(file, options)
      setPhotos((prev) => ({ ...prev, [key]: compressedFile }))
      setPreviews((prev) => ({ ...prev, [key]: URL.createObjectURL(compressedFile) }))
    } catch (error) {
      console.error('Compression error:', error)
      setSubmitError('No se pudo comprimir una de las imágenes seleccionadas.')
    } finally {
      setCompressingKey(null)
    }
  }

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null)
    setSignatureError(null)

    if (!values.legal_consent) {
      setSubmitError(
        'Debes confirmar la autorización de ingreso, firma electrónica y tratamiento de datos del cliente.'
      )
      return
    }

    if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
      setSignatureError('La firma electrónica del cliente es obligatoria para registrar el ingreso.')
      return
    }

    setIsSubmitting(true)
    try {
      // 1. Asegurar Cliente y Moto
      const customerId = await ensureCustomer({
        id: foundCustomerId,
        full_name: values.customer_name,
        phone_whatsapp: values.customer_phone,
      })

      const motorcycleId = await ensureMotorcycle({
        id: foundMotorcycleId,
        customer_id: customerId,
        license_plate: values.plate.replace(/\s+/g, '').toUpperCase(),
        brand: values.motorcycle_make,
        model: values.motorcycle_model,
        year: values.motorcycle_year,
      })

      // 2. Subir Evidencia Fotográfica vía FormData
      const mediaUrls: string[] = []
      const timestamp = Date.now()
      for (const [key, file] of Object.entries(photos)) {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('path', `intake/${timestamp}_${key}.webp`)
        const url = await uploadEvidence(fd)
        mediaUrls.push(url)
      }

      // 3. Guardar Firma Electrónica en Storage
      const signatureDataUrl = sigCanvas.current.toDataURL('image/png')
      const signatureUrl = await uploadSignatureDataUrl(
        signatureDataUrl,
        `${timestamp}_signature.png`
      )

      // 4. Crear Orden + Evento inicial en Timeline
      const order = await createWorkOrder({
        motorcycle_id: motorcycleId,
        mileage_in: values.mileage,
        customer_notes: values.description,
        fuel_level: values.fuel_level,
        mechanic_id: values.mechanic_id || null,
        media_urls: mediaUrls,
        signature_url: signatureUrl,
        legalConsent: values.legal_consent,
      })

      router.push(`/dashboard/orders/${order.id}`)
      router.refresh()
    } catch (error: any) {
      console.error('Submit error:', error)
      setSubmitError(error?.message || 'Error al crear la orden de trabajo. Intenta de nuevo.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container max-w-3xl mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/dashboard/orders"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-semibold text-slate-300 transition-all hover:border-orange-500/35 hover:bg-white/[0.08] hover:text-white"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-orange-400" />
          Volver al tablero
        </Link>
      </div>

      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
          Nueva Orden de Trabajo
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Registra la recepción de la motocicleta, evidencia WebP y firma de conformidad.
        </p>
      </div>

      {submitError && (
        <div
          role="alert"
          className="bg-rose-500/10 border border-rose-500/30 text-rose-200 text-sm p-4 rounded-xl flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          <p className="font-medium">{submitError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Paso 1: Búsqueda por Placa */}
        <Card className="rounded-2xl border border-white/10 bg-[#101218] text-slate-100 shadow-none overflow-hidden">
          <CardHeader className="border-b border-white/[0.07]">
            <CardTitle className="flex items-center gap-2 text-lg text-white">
              <Search className="w-5 h-5 text-orange-400" /> Vehículo y Cliente
            </CardTitle>
            <CardDescription className="text-slate-400">
              Busca por placa para autocompletar o registra datos nuevos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            <div className="flex gap-2.5 items-start">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="plate" className="text-xs font-semibold text-slate-300">
                  Placa *
                </Label>
                <Input
                  id="plate"
                  {...register('plate', {
                    onChange: () => {
                      setFoundCustomerId(undefined)
                      setFoundMotorcycleId(undefined)
                      setSearchFeedback(null)
                    },
                  })}
                  placeholder="ABC-123"
                  className={`${DARK_INPUT_CLASS} uppercase font-mono`}
                  disabled={isSubmitting}
                />
                {errors.plate && <p className="text-rose-400 text-xs">{errors.plate.message}</p>}
              </div>
              <Button
                type="button"
                variant="outline"
                className="mt-6 h-10 rounded-xl border-white/10 bg-white/[0.06] text-slate-100 hover:bg-orange-500/15 hover:border-orange-500/40 hover:text-orange-200"
                onClick={handleSearchPlate}
                disabled={isSearching || isSubmitting}
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin text-orange-400" />
                    Buscando
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2 text-orange-400" />
                    Buscar
                  </>
                )}
              </Button>
            </div>

            {searchFeedback && (
              <div
                className={cn(
                  'text-xs p-3.5 rounded-xl border flex items-center gap-2.5 font-medium',
                  searchFeedback.type === 'success' &&
                    'bg-emerald-500/10 border-emerald-500/30 text-emerald-200',
                  searchFeedback.type === 'info' && 'bg-sky-500/10 border-sky-500/30 text-sky-200',
                  searchFeedback.type === 'error' &&
                    'bg-rose-500/10 border-rose-500/30 text-rose-200'
                )}
              >
                {searchFeedback.type === 'success' ? (
                  <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle
                    className={cn(
                      'w-4 h-4 shrink-0',
                      searchFeedback.type === 'info' ? 'text-sky-400' : 'text-rose-400'
                    )}
                  />
                )}
                <span>{searchFeedback.message}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="customer_name"
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-300"
                >
                  <User className="w-3.5 h-3.5 text-slate-400" /> Nombre Cliente *
                </Label>
                <Input
                  id="customer_name"
                  {...register('customer_name')}
                  className={DARK_INPUT_CLASS}
                  disabled={isSubmitting}
                />
                {errors.customer_name && (
                  <p className="text-rose-400 text-xs">{errors.customer_name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer_phone" className="text-xs font-semibold text-slate-300">
                  WhatsApp *
                </Label>
                <Input
                  id="customer_phone"
                  {...register('customer_phone')}
                  type="tel"
                  placeholder="Ej. +57 300 123 4567"
                  className={DARK_INPUT_CLASS}
                  disabled={isSubmitting}
                />
                {errors.customer_phone && (
                  <p className="text-rose-400 text-xs">{errors.customer_phone.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="motorcycle_make"
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-300"
                >
                  <Bike className="w-3.5 h-3.5 text-slate-400" /> Marca *
                </Label>
                <Input
                  id="motorcycle_make"
                  {...register('motorcycle_make')}
                  className={DARK_INPUT_CLASS}
                  disabled={isSubmitting}
                />
                {errors.motorcycle_make && (
                  <p className="text-rose-400 text-xs">{errors.motorcycle_make.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="motorcycle_model" className="text-xs font-semibold text-slate-300">
                  Modelo *
                </Label>
                <Input
                  id="motorcycle_model"
                  {...register('motorcycle_model')}
                  className={DARK_INPUT_CLASS}
                  disabled={isSubmitting}
                />
                {errors.motorcycle_model && (
                  <p className="text-rose-400 text-xs">{errors.motorcycle_model.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="motorcycle_year" className="text-xs font-semibold text-slate-300">
                  Año
                </Label>
                <Input
                  id="motorcycle_year"
                  {...register('motorcycle_year')}
                  type="number"
                  placeholder="2024"
                  className={DARK_INPUT_CLASS}
                  disabled={isSubmitting}
                />
                {errors.motorcycle_year && (
                  <p className="text-rose-400 text-xs">{errors.motorcycle_year.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Paso 2: Detalles de la Orden */}
        <Card className="rounded-2xl border border-white/10 bg-[#101218] text-slate-100 shadow-none overflow-hidden">
          <CardHeader className="border-b border-white/[0.07]">
            <CardTitle className="flex items-center gap-2 text-lg text-white">
              <FileText className="w-5 h-5 text-orange-400" /> Detalles de Ingreso
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="mileage"
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-300"
                >
                  <Gauge className="w-3.5 h-3.5 text-slate-400" /> Kilometraje *
                </Label>
                <Input
                  id="mileage"
                  {...register('mileage')}
                  type="number"
                  min={0}
                  className={`${DARK_INPUT_CLASS} font-mono`}
                  disabled={isSubmitting}
                />
                {errors.mileage && <p className="text-rose-400 text-xs">{errors.mileage.message}</p>}
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="fuel_level"
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-300"
                >
                  <Fuel className="w-3.5 h-3.5 text-slate-400" /> Gasolina
                </Label>
                <select
                  id="fuel_level"
                  {...register('fuel_level')}
                  disabled={isSubmitting}
                  className="w-full h-10 px-3 rounded-xl border border-white/10 bg-[#0B0D13] text-sm text-white focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/25 [color-scheme:dark]"
                >
                  <option value="empty" className="bg-[#101218] text-white">
                    Vacío
                  </option>
                  <option value="low" className="bg-[#101218] text-white">
                    1/4
                  </option>
                  <option value="half" className="bg-[#101218] text-white">
                    1/2
                  </option>
                  <option value="high" className="bg-[#101218] text-white">
                    3/4
                  </option>
                  <option value="full" className="bg-[#101218] text-white">
                    Lleno
                  </option>
                </select>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="mechanic_id"
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-300"
                >
                  <Wrench className="w-3.5 h-3.5 text-slate-400" /> Mecánico Responsable
                </Label>
                <select
                  id="mechanic_id"
                  {...register('mechanic_id')}
                  disabled={isSubmitting}
                  className="w-full h-10 px-3 rounded-xl border border-white/10 bg-[#0B0D13] text-sm text-white focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/25 [color-scheme:dark]"
                >
                  <option value="" className="bg-[#101218] text-slate-300">
                    Sin asignar
                  </option>
                  {teamMembers.map((member) => (
                    <option key={member.id} value={member.id} className="bg-[#101218] text-white">
                      {member.full_name} ({TEAM_ROLE_LABELS[member.role] || member.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-xs font-semibold text-slate-300">
                Notas / Síntomas
              </Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="El cliente reporta un ruido en..."
                className="min-h-[92px] rounded-xl border-white/10 bg-[#0B0D13] text-white placeholder:text-slate-500 focus-visible:border-orange-500/60 focus-visible:ring-orange-500/30 focus-visible:ring-offset-0 [color-scheme:dark]"
                disabled={isSubmitting}
              />
            </div>
          </CardContent>
        </Card>

        {/* Paso 3: Evidencia Visual */}
        <Card className="rounded-2xl border border-white/10 bg-[#101218] text-slate-100 shadow-none overflow-hidden">
          <CardHeader className="border-b border-white/[0.07]">
            <CardTitle className="flex items-center gap-2 text-lg text-white">
              <Camera className="w-5 h-5 text-orange-400" /> Evidencia Fotográfica
            </CardTitle>
            <CardDescription className="text-slate-400">
              Las fotos se comprimen automáticamente a WebP (~250 KB) para carga rápida
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5">
            {Object.entries(PHOTO_LABELS).map(([key, label]) => {
              const isCompressing = compressingKey === key
              const hasPreview = Boolean(previews[key])
              return (
                <div key={key} className="relative group">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs font-semibold text-slate-300">{label}</Label>
                    {hasPreview && (
                      <span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
                        WebP
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={isSubmitting || isCompressing}
                    className={cn(
                      'w-full aspect-square rounded-xl border-2 border-dashed border-white/15 flex flex-col items-center justify-center gap-2 cursor-pointer overflow-hidden bg-[#0B0D13] hover:bg-white/[0.04] hover:border-orange-500/40 transition-all disabled:opacity-60',
                      hasPreview && 'border-solid border-orange-500/70'
                    )}
                    onClick={() => document.getElementById(`photo-${key}`)?.click()}
                  >
                    {isCompressing ? (
                      <>
                        <Loader2 className="w-7 h-7 animate-spin text-orange-400" />
                        <span className="text-[11px] font-medium text-orange-300">
                          Comprimiendo...
                        </span>
                      </>
                    ) : previews[key] ? (
                      <img src={previews[key]} alt={label} className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Camera className="w-7 h-7 text-slate-500 group-hover:text-orange-400 transition-colors" />
                        <span className="text-xs text-slate-400">Capturar</span>
                      </>
                    )}
                  </button>
                  <input
                    id={`photo-${key}`}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    capture="environment"
                    className="hidden"
                    disabled={isSubmitting || isCompressing}
                    onChange={(e) => handleFileChange(key, e)}
                  />
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Paso 4: Firma Electrónica */}
        <Card className="rounded-2xl border border-white/10 bg-[#101218] text-slate-100 shadow-none overflow-hidden">
          <CardHeader className="border-b border-white/[0.07]">
            <CardTitle className="flex items-center gap-2 text-lg text-white">
              <PenTool className="w-5 h-5 text-orange-400" /> Firma Electrónica de Recepción *
            </CardTitle>
            <CardDescription className="text-slate-400">
              El cliente debe confirmar la autorización y firmar para registrar el estado de ingreso
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            {/* Checkbox obligatorio de consentimiento legal encima del lienzo de firma */}
            <div
              className={cn(
                'rounded-xl border p-3.5 transition-colors',
                errors.legal_consent
                  ? 'border-rose-500/50 bg-rose-500/[0.08]'
                  : 'border-white/15 bg-[#0B0D13]'
              )}
            >
              <label
                htmlFor="legal_consent"
                className="flex items-start gap-3 cursor-pointer select-none"
              >
                <input
                  id="legal_consent"
                  type="checkbox"
                  disabled={isSubmitting}
                  {...register('legal_consent')}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/30 bg-[#101218] text-orange-500 accent-orange-500 focus:ring-2 focus:ring-orange-500/40"
                />
                <span className="text-xs leading-relaxed text-slate-200">
                  Confirmo que el cliente autoriza el ingreso de la motocicleta, acepta la validez
                  de esta firma electrónica (Ley 527 de 1999 y Decreto 2364 de 2012) y autoriza al
                  taller el tratamiento de sus datos personales para el seguimiento de la orden (las
                  fotos de evidencia se conservan automáticamente durante 90 días).{' '}
                  <Link
                    href="/legal/privacidad"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-orange-400 underline underline-offset-4 hover:text-orange-300"
                  >
                    Ver Política de Privacidad
                  </Link>
                </span>
              </label>
              {errors.legal_consent && (
                <p
                  role="alert"
                  className="mt-2.5 flex items-center gap-1.5 text-xs font-medium text-rose-400"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.legal_consent.message}
                </p>
              )}
            </div>

            <div className="rounded-xl border border-white/15 bg-[#0B0D13] p-3 space-y-2.5">
              <div className="flex items-center justify-between text-[11px] font-medium text-slate-400">
                <span>Área de firma del cliente</span>
                <span className="text-slate-500">Trazo oscuro sobre lienzo blanco</span>
              </div>
              <div
                ref={sigContainerRef}
                className="border border-slate-300 rounded-lg bg-white h-48 relative overflow-hidden shadow-inner"
              >
                <SignatureCanvas
                  ref={sigCanvas}
                  penColor="#09090B"
                  onBegin={() => setSignatureError(null)}
                  canvasProps={{
                    width: canvasWidth,
                    height: 192,
                    className: 'w-full h-full touch-none',
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSubmitting}
                  className="absolute bottom-2.5 right-2.5 h-8 gap-1.5 text-xs bg-slate-900/90 text-white border-slate-700 hover:bg-slate-800 hover:text-white"
                  onClick={() => {
                    sigCanvas.current?.clear()
                    setSignatureError(null)
                  }}
                >
                  <RotateCcw className="w-3 h-3" />
                  Limpiar
                </Button>
              </div>
            </div>
            {signatureError && (
              <p className="text-rose-400 text-xs font-medium flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {signatureError}
              </p>
            )}
          </CardContent>
        </Card>

        <Button
          type="submit"
          size="lg"
          className="w-full h-14 text-base font-bold gap-2 rounded-2xl bg-orange-500 hover:bg-orange-400 text-slate-950 shadow-[0_0_28px_rgba(249,115,22,0.3)] border border-orange-400/50 transition-all"
          disabled={isSubmitting || Boolean(compressingKey)}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Guardando orden y evidencias...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" /> Crear Orden de Trabajo
            </>
          )}
        </Button>
      </form>
    </div>
  )
}
