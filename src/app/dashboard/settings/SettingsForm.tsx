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
import { updateWorkshopSettings, uploadWorkshopLogo } from './actions'

const formSchema = z.object({
  name: z.string().trim().min(2, 'El nombre es requerido').max(100, 'Máximo 100 caracteres'),
  phone_whatsapp: z.string().trim().min(1, 'El WhatsApp es requerido').max(25, 'Máximo 25 caracteres'),
  address: z.string().trim().min(1, 'La dirección es requerida').max(200, 'Máximo 200 caracteres'),
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

const DARK_INPUT_CLASS =
  'h-10 rounded-xl border-white/10 bg-[#0B0D13] text-white placeholder:text-slate-500 focus-visible:border-orange-500/60 focus-visible:ring-orange-500/30 focus-visible:ring-offset-0 [color-scheme:dark]'

export function SettingsForm({ workshop }: SettingsFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isUploading, setIsUploading] = React.useState(false)
  const [preview, setPreview] = React.useState<string | null>(workshop.logo_url)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)

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

    const allowedClientTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
    if (file.type && !allowedClientTypes.has(file.type.toLowerCase())) {
      setErrorMessage('Solo se permiten imágenes JPEG, PNG o WebP (SVG y otros formatos están bloqueados).')
      e.target.value = ''
      return
    }

    setIsUploading(true)
    try {
      const options = {
        maxSizeMB: 0.1,
        maxWidthOrHeight: 800,
        useWebWorker: true,
        fileType: 'image/webp',
      }

      const compressedBlob = await imageCompression(file, options)
      const compressedFile = new File([compressedBlob], 'logo.webp', { type: 'image/webp' })

      const formData = new FormData()
      formData.append('file', compressedFile)

      const result = await uploadWorkshopLogo(formData)
      if (!result.success || !result.publicUrl) {
        setErrorMessage(result.error || 'No se pudo subir el logo.')
        return
      }

      setValue('logo_url', result.publicUrl)
      setPreview(result.publicUrl)
      setSuccessMessage('Logo cargado. Haz clic en "Guardar Cambios" para confirmar.')
    } catch (error: any) {
      console.error('Error uploading logo:', error)
      setErrorMessage('No se pudo procesar o subir la imagen seleccionada. Verifica que sea JPEG, PNG o WebP válido.')
    } finally {
      setIsUploading(false)
      e.target.value = ''
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
        <div
          role="alert"
          className="bg-rose-500/10 border border-rose-500/30 text-rose-200 text-sm p-4 rounded-xl flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-sm p-4 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 rounded-2xl border border-white/10 bg-[#101218] text-slate-100 shadow-none overflow-hidden">
          <CardHeader className="border-b border-white/[0.07]">
            <CardTitle className="flex items-center gap-2 text-lg text-white">
              <Building2 className="w-5 h-5 text-orange-400" />
              Información del Taller
            </CardTitle>
            <CardDescription className="text-slate-400">
              Configura los datos básicos que verán tus clientes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-semibold text-slate-300">
                Nombre del Taller *
              </Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Ej. Moto Service Pro"
                className={DARK_INPUT_CLASS}
                disabled={isSubmitting}
              />
              {errors.name && <p className="text-xs text-rose-400">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone_whatsapp" className="text-xs font-semibold text-slate-300">
                  WhatsApp de Contacto *
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="phone_whatsapp"
                    className={`${DARK_INPUT_CLASS} pl-10`}
                    {...register('phone_whatsapp')}
                    placeholder="Ej. +57 300 123 4567"
                    disabled={isSubmitting}
                  />
                </div>
                {errors.phone_whatsapp && (
                  <p className="text-xs text-rose-400">{errors.phone_whatsapp.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="primary_color" className="text-xs font-semibold text-slate-300">
                  Color Principal de Marca
                </Label>
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-10 h-10 rounded-xl border border-white/20 shadow-sm shrink-0"
                    style={{ backgroundColor: watch('primary_color') }}
                  />
                  <Input
                    id="primary_color"
                    type="color"
                    className="h-10 w-full cursor-pointer rounded-xl border border-white/10 bg-[#0B0D13] p-1 [color-scheme:dark]"
                    {...register('primary_color')}
                    disabled={isSubmitting}
                  />
                  <span className="text-xs font-mono text-slate-300 uppercase shrink-0">
                    {watch('primary_color')}
                  </span>
                </div>
                {errors.primary_color && (
                  <p className="text-xs text-rose-400">{errors.primary_color.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-xs font-semibold text-slate-300">
                Dirección Física *
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="address"
                  className={`${DARK_INPUT_CLASS} pl-10`}
                  {...register('address')}
                  placeholder="Ej. Av. Principal 123, Ciudad"
                  disabled={isSubmitting}
                />
              </div>
              {errors.address && <p className="text-xs text-rose-400">{errors.address.message}</p>}
            </div>
          </CardContent>
          <CardFooter className="border-t border-white/10 bg-[#0B0D13]/70 p-4">
            <Button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="ml-auto rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold shadow-[0_0_20px_rgba(249,115,22,0.25)]"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </CardFooter>
        </Card>

        <Card className="rounded-2xl border border-white/10 bg-[#101218] text-slate-100 shadow-none overflow-hidden">
          <CardHeader className="border-b border-white/[0.07]">
            <CardTitle className="flex items-center gap-2 text-lg text-white">
              <Palette className="w-5 h-5 text-orange-400" />
              Logo del Taller
            </CardTitle>
            <CardDescription className="text-slate-400">
              Se usará en facturas, dashboard y tracker.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center space-y-4 pt-6">
            <div
              className={`relative w-32 h-32 rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden group ${
                preview
                  ? 'border-white/25 bg-white/95 p-2 shadow-inner'
                  : 'border-white/15 bg-[#0B0D13]'
              }`}
            >
              {preview ? (
                <img src={preview} alt="Logo preview" className="w-full h-full object-contain" />
              ) : (
                <Upload className="w-8 h-8 text-slate-500" />
              )}
              {isUploading && (
                <div className="absolute inset-0 bg-[#08090C]/80 backdrop-blur-sm flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
                </div>
              )}
            </div>

            <div className="w-full space-y-2">
              <Label
                htmlFor="logo-upload"
                className="flex items-center justify-center gap-2 w-full h-10 px-4 py-2 rounded-xl border border-white/10 bg-white/[0.06] text-slate-200 hover:bg-white/[0.1] hover:border-orange-500/35 hover:text-white cursor-pointer transition-colors text-sm font-medium"
              >
                <Upload className="w-4 h-4 text-orange-400" />
                {isUploading ? 'Subiendo...' : preview ? 'Cambiar Logo' : 'Subir Logo'}
              </Label>
              <input
                id="logo-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
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
                  className="w-full rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Quitar Logo
                </Button>
              )}
              <p className="text-[11px] text-center text-slate-400 mt-2">
                Recomendado: WebP, Máx 100KB.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  )
}
