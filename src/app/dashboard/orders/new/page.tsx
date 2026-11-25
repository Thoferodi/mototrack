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
} from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import {
  searchMotorcycleByPlate,
  ensureCustomer,
  ensureMotorcycle,
  createWorkOrder,
  uploadEvidence,
  uploadSignatureDataUrl,
} from './actions'

const formSchema = z.object({
  plate: z.string().min(1, 'La placa es requerida'),
  customer_name: z.string().min(1, 'El nombre es requerido'),
  customer_phone: z.string().min(1, 'El WhatsApp es requerido'),
  motorcycle_make: z.string().min(1, 'La marca es requerida'),
  motorcycle_model: z.string().min(1, 'El modelo es requerido'),
  motorcycle_year: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : Number(val)),
    z.number().int('Año inválido').min(1950, 'Año mínimo 1950').max(2100, 'Año inválido').optional()
  ),
  mileage: z.coerce.number({ invalid_type_error: 'Kilometraje inválido' }).min(0, 'Kilometraje inválido'),
  fuel_level: z.enum(['empty', 'low', 'half', 'high', 'full']),
  description: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

const PHOTO_LABELS: Record<string, string> = {
  front: 'Frente',
  left: 'Izquierda',
  right: 'Derecha',
  dashboard: 'Tablero',
}

export default function NewOrderPage() {
  const router = useRouter()
  const [isSearching, setIsSearching] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [searchFeedback, setSearchFeedback] = React.useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null)
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
        setValue('customer_phone', (data.customers as any)?.phone || '', { shouldValidate: true })
        setValue('motorcycle_make', data.make, { shouldValidate: true })
        setValue('motorcycle_model', data.model, { shouldValidate: true })
        setValue('motorcycle_year', data.year ?? undefined)
        setSearchFeedback({
          type: 'success',
          message: `Vehículo encontrado (${data.make} ${data.model}). Datos autocompletados.`,
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

    try {
      const compressedFile = await imageCompression(file, options)
      setPhotos((prev) => ({ ...prev, [key]: compressedFile }))
      setPreviews((prev) => ({ ...prev, [key]: URL.createObjectURL(compressedFile) }))
    } catch (error) {
      console.error('Compression error:', error)
      setSubmitError('No se pudo comprimir una de las imágenes seleccionadas.')
    }
  }

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null)
    setSignatureError(null)

    if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
      setSignatureError('La firma del cliente es obligatoria para registrar el ingreso.')
      return
    }

    setIsSubmitting(true)
    try {
      // 1. Asegurar Cliente y Moto
      const customerId = await ensureCustomer({
        id: foundCustomerId,
        full_name: values.customer_name,
        phone: values.customer_phone,
      })

      const motorcycleId = await ensureMotorcycle({
        id: foundMotorcycleId,
        customer_id: customerId,
        plate: values.plate.toUpperCase(),
        make: values.motorcycle_make,
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

      // 3. Guardar Firma Digital en Storage
      const signatureDataUrl = sigCanvas.current.toDataURL('image/png')
      const signatureUrl = await uploadSignatureDataUrl(
        signatureDataUrl,
        `${timestamp}_signature.png`
      )

      // 4. Crear Orden + Evento inicial en Timeline
      const order = await createWorkOrder({
        customer_id: customerId,
        motorcycle_id: motorcycleId,
        mileage: values.mileage,
        description: values.description,
        fuel_level: values.fuel_level,
        media_urls: mediaUrls,
        signature_url: signatureUrl,
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
    <div className="container max-w-2xl mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Button asChild variant="ghost" size="sm" className="-ml-2 text-slate-600">
          <Link href="/dashboard/orders">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al tablero
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Nueva Orden de Trabajo</h1>
        <p className="text-muted-foreground text-sm">
          Registra la recepción de la motocicleta, evidencia y firma de conformidad.
        </p>
      </div>

      {submitError && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="font-medium">{submitError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Paso 1: Búsqueda por Placa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Search className="w-5 h-5 text-primary" /> Vehículo y Cliente
            </CardTitle>
            <CardDescription>Busca por placa para autocompletar o registra datos nuevos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 items-start">
              <div className="flex-1 space-y-1">
                <Label htmlFor="plate">Placa *</Label>
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
                  className="uppercase"
                  disabled={isSubmitting}
                />
                {errors.plate && <p className="text-destructive text-xs">{errors.plate.message}</p>}
              </div>
              <Button
                type="button"
                variant="secondary"
                className="mt-6"
                onClick={handleSearchPlate}
                disabled={isSearching || isSubmitting}
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Buscando
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Buscar
                  </>
                )}
              </Button>
            </div>

            {searchFeedback && (
              <div
                className={cn(
                  'text-xs p-3 rounded-lg border flex items-center gap-2',
                  searchFeedback.type === 'success' && 'bg-emerald-50 border-emerald-200 text-emerald-800',
                  searchFeedback.type === 'info' && 'bg-blue-50 border-blue-200 text-blue-800',
                  searchFeedback.type === 'error' && 'bg-destructive/10 border-destructive/20 text-destructive'
                )}
              >
                {searchFeedback.type === 'success' ? (
                  <Check className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{searchFeedback.message}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer_name" className="flex items-center gap-1">
                  <User className="w-3 h-3" /> Nombre Cliente *
                </Label>
                <Input id="customer_name" {...register('customer_name')} disabled={isSubmitting} />
                {errors.customer_name && (
                  <p className="text-destructive text-xs">{errors.customer_name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer_phone">WhatsApp *</Label>
                <Input
                  id="customer_phone"
                  {...register('customer_phone')}
                  type="tel"
                  placeholder="Ej. +57 300 123 4567"
                  disabled={isSubmitting}
                />
                {errors.customer_phone && (
                  <p className="text-destructive text-xs">{errors.customer_phone.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="motorcycle_make" className="flex items-center gap-1">
                  <Bike className="w-3 h-3" /> Marca *
                </Label>
                <Input id="motorcycle_make" {...register('motorcycle_make')} disabled={isSubmitting} />
                {errors.motorcycle_make && (
                  <p className="text-destructive text-xs">{errors.motorcycle_make.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="motorcycle_model">Modelo *</Label>
                <Input id="motorcycle_model" {...register('motorcycle_model')} disabled={isSubmitting} />
                {errors.motorcycle_model && (
                  <p className="text-destructive text-xs">{errors.motorcycle_model.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="motorcycle_year">Año</Label>
                <Input
                  id="motorcycle_year"
                  {...register('motorcycle_year')}
                  type="number"
                  placeholder="2024"
                  disabled={isSubmitting}
                />
                {errors.motorcycle_year && (
                  <p className="text-destructive text-xs">{errors.motorcycle_year.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Paso 2: Detalles de la Orden */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5 text-primary" /> Detalles de Ingreso
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mileage" className="flex items-center gap-1">
                  <Gauge className="w-3 h-3" /> Kilometraje *
                </Label>
                <Input id="mileage" {...register('mileage')} type="number" min={0} disabled={isSubmitting} />
                {errors.mileage && <p className="text-destructive text-xs">{errors.mileage.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="fuel_level" className="flex items-center gap-1">
                  <Fuel className="w-3 h-3" /> Gasolina
                </Label>
                <select
                  id="fuel_level"
                  {...register('fuel_level')}
                  disabled={isSubmitting}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="empty">Vacío</option>
                  <option value="low">1/4</option>
                  <option value="half">1/2</option>
                  <option value="high">3/4</option>
                  <option value="full">Lleno</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Notas / Síntomas</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="El cliente reporta un ruido en..."
                disabled={isSubmitting}
              />
            </div>
          </CardContent>
        </Card>

        {/* Paso 3: Evidencia Visual */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Camera className="w-5 h-5 text-primary" /> Evidencia Fotográfica
            </CardTitle>
            <CardDescription>Las fotos se comprimen automáticamente a WebP para carga rápida</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            {Object.entries(PHOTO_LABELS).map(([key, label]) => (
              <div key={key} className="relative group">
                <Label className="text-center block mb-2">{label}</Label>
                <button
                  type="button"
                  disabled={isSubmitting}
                  className={cn(
                    'w-full aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer overflow-hidden bg-muted/50 hover:bg-muted transition-all disabled:opacity-50',
                    previews[key] && 'border-solid border-primary'
                  )}
                  onClick={() => document.getElementById(`photo-${key}`)?.click()}
                >
                  {previews[key] ? (
                    <img src={previews[key]} alt={label} className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <Camera className="w-8 h-8 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Capturar</span>
                    </>
                  )}
                </button>
                <input
                  id={`photo-${key}`}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  disabled={isSubmitting}
                  onChange={(e) => handleFileChange(key, e)}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Paso 4: Firma */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Firma de Recepción *</CardTitle>
            <CardDescription>El cliente debe firmar para confirmar el estado de ingreso</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div ref={sigContainerRef} className="border-2 rounded-lg bg-white h-48 relative overflow-hidden">
              <SignatureCanvas
                ref={sigCanvas}
                penColor="black"
                onBegin={() => setSignatureError(null)}
                canvasProps={{
                  width: canvasWidth,
                  height: 192,
                  className: 'w-full h-full touch-none',
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isSubmitting}
                className="absolute bottom-2 right-2 text-xs bg-slate-100/80 hover:bg-slate-200"
                onClick={() => {
                  sigCanvas.current?.clear()
                  setSignatureError(null)
                }}
              >
                Limpiar
              </Button>
            </div>
            {signatureError && (
              <p className="text-destructive text-xs font-medium flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                {signatureError}
              </p>
            )}
          </CardContent>
        </Card>

        <Button type="submit" size="lg" className="w-full h-14 text-base font-bold gap-2" disabled={isSubmitting}>
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
