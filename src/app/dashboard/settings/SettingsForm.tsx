'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import imageCompression from 'browser-image-compression'
import {
  Loader2,
  Upload,
  Palette,
  Building2,
  Phone,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Trash2,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { createBrowserSupabaseClient } from '@/supabase/browser'
import { updateWorkshopSettings } from './actions'

const formSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  phone_whatsapp: z.string().min(1, 'El WhatsApp es requerido'),
  address: z.string().min(1, 'La dirección es requerida'),
  primary_color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color inválido'),
  logo_url: z.string().nullable(),
})

type FormValues = z.infer<typeof formSchema>

interface SettingsFormProps {
  workshop: {
    id: string
    name: string
    phone_whatsapp: string | null
    address: string | null
    logo_url: string | null
    primary_color: string | null
  }
}

export function SettingsForm({ workshop }: SettingsFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isUploading, setIsUploading] = React.useState(false)
  const [preview, setPreview] = React.useState<string | null>(workshop.logo_url)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)
  const supabase = createBrowserSupabaseClient()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: workshop.name,
      phone_whatsapp: workshop.phone_whatsapp || '',
      address: workshop.address || '',
      primary_color: workshop.primary_color || '#EA580C',
      logo_url: workshop.logo_url,
    },
  })

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setErrorMessage(null)
    setSuccessMessage(null)
    setIsUploading(true)
    try {
      const options = {
        maxSizeMB: 0.1,
        maxWidthOrHeight: 800,
        useWebWorker: true,
        fileType: 'image/webp',
      }

      const compressedFile = await imageCompression(file, options)
      const filePath = `${workshop.id}/logo-${Date.now()}.webp`

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, compressedFile, {
          upsert: true,
          contentType: 'image/webp',
        })

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from('logos').getPublicUrl(filePath)

      setValue('logo_url', publicUrl)
      setPreview(publicUrl)
      setSuccessMessage('Logo cargado. Haz clic en "Guardar Cambios" para confirmar.')
    } catch (error: any) {
      console.error('Error uploading logo:', error)
      setErrorMessage(
        error?.message || 'Error al subir el logo. Verifica que el bucket "logos" exista y tenga permisos.'
      )
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveLogo = () => {
    setValue('logo_url', null)
    setPreview(null)
    setSuccessMessage(null)
  }

  const onSubmit = async (values: FormValues) => {
    setErrorMessage(null)
    setSuccessMessage(null)
    setIsSubmitting(true)
    try {
      const result = await updateWorkshopSettings(workshop.id, {
        name: values.name,
        phone_whatsapp: values.phone_whatsapp,
        address: values.address,
        logo_url: values.logo_url,
        primary_color: values.primary_color,
      })

      if (result.success) {
        router.refresh()
        setSuccessMessage('Configuración actualizada con éxito.')
      } else {
        setErrorMessage(result.error || 'No se pudo actualizar la configuración.')
      }
    } catch (error: any) {
      console.error('Submit error:', error)
      setErrorMessage(error?.message || 'Error inesperado al guardar la configuración.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {errorMessage && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm p-4 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="w-5 h-5 text-slate-400" />
              Información del Taller
            </CardTitle>
            <CardDescription>
              Configura los datos básicos que verán tus clientes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Taller *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Ej. Moto Service Pro"
                disabled={isSubmitting}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone_whatsapp">WhatsApp de Contacto *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="phone_whatsapp"
                    className="pl-9"
                    {...register('phone_whatsapp')}
                    placeholder="Ej. +57 300 123 4567"
                    disabled={isSubmitting}
                  />
                </div>
                {errors.phone_whatsapp && (
                  <p className="text-xs text-destructive">{errors.phone_whatsapp.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="primary_color">Color Principal de Marca</Label>
                <div className="flex items-center gap-2">
                  <div
                    className="w-10 h-10 rounded-lg border shadow-sm shrink-0"
                    style={{ backgroundColor: watch('primary_color') }}
                  />
                  <Input
                    id="primary_color"
                    type="color"
                    className="h-10 w-full cursor-pointer"
                    {...register('primary_color')}
                    disabled={isSubmitting}
                  />
                  <span className="text-xs font-mono text-slate-500 uppercase">
                    {watch('primary_color')}
                  </span>
                </div>
                {errors.primary_color && (
                  <p className="text-xs text-destructive">{errors.primary_color.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Dirección Física *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  id="address"
                  className="pl-9"
                  {...register('address')}
                  placeholder="Ej. Av. Principal 123, Ciudad"
                  disabled={isSubmitting}
                />
              </div>
              {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
            </div>
          </CardContent>
          <CardFooter className="border-t bg-slate-50/50 p-4">
            <Button type="submit" disabled={isSubmitting || isUploading} className="ml-auto">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Palette className="w-5 h-5 text-slate-400" />
              Logo del Taller
            </CardTitle>
            <CardDescription>
              Se usará en facturas, dashboard y tracker.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center space-y-4">
            <div className="relative w-32 h-32 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50 overflow-hidden group">
              {preview ? (
                <img src={preview} alt="Logo preview" className="w-full h-full object-contain p-2" />
              ) : (
                <Upload className="w-8 h-8 text-slate-300" />
              )}
              {isUploading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              )}
            </div>

            <div className="w-full space-y-2">
              <Label
                htmlFor="logo-upload"
                className="flex items-center justify-center gap-2 w-full h-10 px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md cursor-pointer transition-colors text-sm font-medium"
              >
                <Upload className="w-4 h-4" />
                {isUploading ? 'Subiendo...' : preview ? 'Cambiar Logo' : 'Subir Logo'}
              </Label>
              <input
                id="logo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
                disabled={isUploading || isSubmitting}
              />
              {preview && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveLogo}
                  disabled={isUploading || isSubmitting}
                  className="w-full text-xs text-destructive hover:bg-destructive/10 gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Quitar Logo
                </Button>
              )}
              <p className="text-[10px] text-center text-slate-400 mt-2">
                Recomendado: WebP, Máx 100KB.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  )
}
