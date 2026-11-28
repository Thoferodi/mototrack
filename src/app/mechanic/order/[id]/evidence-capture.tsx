'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import imageCompression from 'browser-image-compression'
import { Camera, Send, Loader2, AlertCircle, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { uploadAndSaveEvidence } from '../../actions'

export function EvidenceCapture({ orderId }: { orderId: string }) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isCompressing, setIsCompressing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [description, setDescription] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview)
      }
    }
  }, [preview])

  const resetCapture = () => {
    if (preview) {
      URL.revokeObjectURL(preview)
    }
    setFile(null)
    setPreview(null)
    setDescription('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setError(null)
    setSuccessMsg(null)

    const allowedClientTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
    if (selectedFile.type && !allowedClientTypes.has(selectedFile.type.toLowerCase())) {
      setError('Solo se permiten imágenes JPEG, PNG o WebP.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setIsCompressing(true)

    try {
      const compressedBlob = await imageCompression(selectedFile, {
        maxSizeMB: 0.25,
        maxWidthOrHeight: 1280,
        useWebWorker: true,
        fileType: 'image/webp',
      })

      const compressedFile = new File(
        [compressedBlob],
        `evidence_${Date.now()}.webp`,
        { type: 'image/webp' }
      )

      if (preview) {
        URL.revokeObjectURL(preview)
      }
      setFile(compressedFile)
      setPreview(URL.createObjectURL(compressedFile))
    } catch (err) {
      console.error('Error compressing image:', err)
      setError('No se pudo procesar o comprimir la imagen seleccionada. Intenta con otra foto.')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } finally {
      setIsCompressing(false)
    }
  }

  const handleUpload = async () => {
    if (isUploading || isCompressing) return
    if (!file) {
      setError('Selecciona o captura una fotografía primero.')
      return
    }
    if (!description.trim()) {
      setError('Escribe una descripción del hallazgo.')
      return
    }

    setError(null)
    setSuccessMsg(null)
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('orderId', orderId)
      formData.append('description', description.trim())
      formData.append('file', file)

      const result = await uploadAndSaveEvidence(formData)
      if (!result.success) {
        setError(result.error || 'No se pudo subir la evidencia.')
        return
      }

      resetCapture()
      setSuccessMsg('Evidencia registrada y publicada en la bitácora.')
      router.refresh()
    } catch (err: any) {
      console.error('Error uploading evidence:', err)
      setError(err?.message || 'Error inesperado al subir la evidencia.')
    } finally {
      setIsUploading(false)
    }
  }

  const isBusy = isCompressing || isUploading

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          onChange={handleFileChange}
          disabled={isBusy}
          className="hidden"
          id="camera-input"
        />
        <label
          htmlFor="camera-input"
          className={`flex flex-col items-center justify-center w-full h-44 bg-slate-800 border-4 border-dashed border-slate-700 rounded-3xl active:scale-[0.99] transition-transform overflow-hidden ${
            isBusy ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-primary/60'
          }`}
        >
          {isCompressing ? (
            <div className="flex flex-col items-center gap-2 text-primary">
              <Loader2 className="w-10 h-10 animate-spin" />
              <span className="text-xs font-black uppercase tracking-widest">
                Optimizando WebP...
              </span>
            </div>
          ) : preview ? (
            <img src={preview} alt="Vista previa de evidencia" className="w-full h-full object-cover" />
          ) : (
            <>
              <Camera className="w-12 h-12 text-primary mb-2" />
              <span className="text-xs font-black uppercase tracking-widest text-slate-300">
                Capturar Foto
              </span>
              <span className="text-[11px] text-slate-500 mt-1">
                Compresión automática WebP (máx. 250 KB)
              </span>
            </>
          )}
        </label>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 bg-red-950/70 border-2 border-red-500/40 text-red-200 px-4 py-3 rounded-2xl text-sm font-semibold"
        >
          <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && !error && (
        <div className="flex items-center gap-2 bg-emerald-950/70 border-2 border-emerald-500/40 text-emerald-200 px-4 py-3 rounded-2xl text-sm font-semibold">
          <Check className="w-5 h-5 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {preview && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isBusy}
            placeholder="Describe lo que encontraste (ej: fuga de aceite, disco desgastado...)"
            className="w-full h-32 bg-slate-800 border-2 border-slate-700 rounded-2xl p-4 text-white focus:outline-none focus:border-primary placeholder:text-slate-500 text-base font-medium disabled:opacity-60"
          />

          <Button
            type="button"
            onClick={handleUpload}
            disabled={isBusy || !description.trim()}
            className="w-full h-16 rounded-2xl text-lg font-black uppercase tracking-tight"
          >
            {isUploading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin" />
                Subiendo evidencia...
              </span>
            ) : (
              <>
                <Send className="w-6 h-6 mr-3" />
                Registrar Hallazgo
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={isBusy}
            onClick={resetCapture}
            className="w-full h-14 rounded-2xl border-2 border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white font-bold uppercase text-xs tracking-wider"
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar Foto
          </Button>
        </div>
      )}
    </div>
  )
}
