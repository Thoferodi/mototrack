'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import imageCompression from 'browser-image-compression'
import SignatureCanvas from 'react-signature-canvas'
import { Camera, Search, User, Bike, Gauge, Fuel, FileText, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { searchMotorcycleByPlate, ensureCustomer, ensureMotorcycle, createWorkOrder, uploadEvidence } from './actions'

const formSchema = z.object({
  plate: z.string().min(1, 'La placa es requerida'),
  customer_name: z.string().min(1, 'El nombre es requerido'),
  customer_phone: z.string().min(1, 'El WhatsApp es requerido'),
  motorcycle_make: z.string().min(1, 'La marca es requerida'),
  motorcycle_model: z.string().min(1, 'El modelo es requerido'),
  motorcycle_year: z.coerce.number().optional(),
  mileage: z.coerce.number().min(0, 'Kilometraje inválido'),
  fuel_level: z.enum(['empty', 'low', 'half', 'high', 'full']),
  description: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

const PHOTO_LABELS = {
  front: 'Frente',
  left: 'Izquierda',
  right: 'Derecha',
  dashboard: 'Tablero',
}

export default function NewOrderPage() {
  const router = useRouter()
  const [isSearching, setIsSearching] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [photos, setPhotos] = React.useState<Record<string, File>>({})
  const [previews, setPreviews] = React.useState<Record<string, string>>({})
  const sigCanvas = React.useRef<SignatureCanvas>(null)
  
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fuel_level: 'half',
    }
  })

  const plate = watch('plate')

  const handleSearchPlate = async () => {
    if (!plate) return
    setIsSearching(true)
    try {
      const data = await searchMotorcycleByPlate(plate)
      if (data) {
        setValue('customer_name', data.customers?.full_name || '')
        setValue('customer_phone', data.customers?.phone || '')
        setValue('motorcycle_make', data.make)
        setValue('motorcycle_model', data.model)
        setValue('motorcycle_year', data.year || undefined)
      }
    } catch (error) {
      console.error('Search error:', error)
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
      fileType: 'image/webp'
    }

    try {
      const compressedFile = await imageCompression(file, options)
      setPhotos(prev => ({ ...prev, [key]: compressedFile }))
      setPreviews(prev => ({ ...prev, [key]: URL.createObjectURL(compressedFile) }))
    } catch (error) {
      console.error('Compression error:', error)
    }
  }

  const onSubmit = async (values: FormValues) => {
    if (sigCanvas.current?.isEmpty()) {
      alert('La firma del cliente es obligatoria')
      return
    }

    setIsSubmitting(true)
    try {
      // 1. Asegurar Cliente y Moto
      const customerId = await ensureCustomer({
        full_name: values.customer_name,
        phone: values.customer_phone,
      })

      const motorcycleId = await ensureMotorcycle({
        customer_id: customerId,
        plate: values.plate.toUpperCase(),
        make: values.motorcycle_make,
        model: values.motorcycle_model,
        year: values.motorcycle_year,
      })

      // 2. Subir Evidencia
      const media_urls: string[] = []
      for (const [key, file] of Object.entries(photos)) {
        const path = `${Date.now()}_${key}.webp`
        const url = await uploadEvidence(file, path)
        media_urls.push(url)
      }

      // 3. Crear Orden
      const order = await createWorkOrder({
        customer_id: customerId,
        motorcycle_id: motorcycleId,
        mileage: values.mileage,
        description: values.description,
        status: 'received',
        total_amount: 0,
        settings: {
          fuel_level: values.fuel_level,
          signature: sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png')
        }
      })

      // 4. Registrar evento inicial con fotos
      // Aquí podríamos llamar a otra acción para crear el timeline event inicial
      
      router.push(`/dashboard/orders`)
    } catch (error) {
      console.error('Submit error:', error)
      alert('Error al crear la orden')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Nueva Orden de Trabajo</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Paso 1: Búsqueda por Placa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" /> Vehículo y Cliente
            </CardTitle>
            <CardDescription>Busca por placa para autocompletar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="plate">Placa</Label>
                <Input {...register('plate')} placeholder="ABC-123" className="uppercase" />
                {errors.plate && <p className="text-destructive text-xs mt-1">{errors.plate.message}</p>}
              </div>
              <Button type="button" variant="secondary" className="mt-6" onClick={handleSearchPlate} disabled={isSearching}>
                {isSearching ? 'Buscando...' : <Search className="w-4 h-4" />}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><User className="w-3 h-3" /> Nombre Cliente</Label>
                <Input {...register('customer_name')} />
                {errors.customer_name && <p className="text-destructive text-xs">{errors.customer_name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>WhatsApp</Label>
                <Input {...register('customer_phone')} type="tel" />
                {errors.customer_phone && <p className="text-destructive text-xs">{errors.customer_phone.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><Bike className="w-3 h-3" /> Marca</Label>
                <Input {...register('motorcycle_make')} />
              </div>
              <div className="space-y-2">
                <Label>Modelo</Label>
                <Input {...register('motorcycle_model')} />
              </div>
              <div className="space-y-2">
                <Label>Año</Label>
                <Input {...register('motorcycle_year')} type="number" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Paso 2: Detalles de la Orden */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" /> Detalles de Ingreso
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><Gauge className="w-3 h-3" /> Kilometraje</Label>
                <Input {...register('mileage')} type="number" />
                {errors.mileage && <p className="text-destructive text-xs">{errors.mileage.message}</p>}
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><Fuel className="w-3 h-3" /> Gasolina</Label>
                <select {...register('fuel_level')} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                  <option value="empty">Vacío</option>
                  <option value="low">1/4</option>
                  <option value="half">1/2</option>
                  <option value="high">3/4</option>
                  <option value="full">Lleno</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notas / Síntomas</Label>
              <Textarea {...register('description')} placeholder="El cliente reporta un ruido en..." />
            </div>
          </CardContent>
        </Card>

        {/* Paso 3: Evidencia Visual */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" /> Evidencia Fotográfica
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            {Object.entries(PHOTO_LABELS).map(([key, label]) => (
              <div key={key} className="relative group">
                <Label className="text-center block mb-2">{label}</Label>
                <div 
                  className={cn(
                    "aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer overflow-hidden bg-muted/50 hover:bg-muted transition-all",
                    previews[key] && "border-solid border-primary"
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
                </div>
                <input 
                  id={`photo-${key}`}
                  type="file" 
                  accept="image/*" 
                  capture="environment"
                  className="hidden" 
                  onChange={(e) => handleFileChange(key, e)}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Paso 4: Firma */}
        <Card>
          <CardHeader>
            <CardTitle>Firma de Recepción</CardTitle>
            <CardDescription>El cliente debe firmar para confirmar el estado de ingreso</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg bg-white h-48 relative">
              <SignatureCanvas 
                ref={sigCanvas}
                penColor="black"
                canvasProps={{ className: 'w-full h-full' }}
              />
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                className="absolute bottom-2 right-2 text-xs"
                onClick={() => sigCanvas.current?.clear()}
              >
                Limpiar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" size="lg" className="w-full h-16 text-lg gap-2" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : (
            <>
              <CheckCircle2 className="w-6 h-6" /> Crear Orden de Trabajo
            </>
          )}
        </Button>
      </form>
    </div>
  )
}
