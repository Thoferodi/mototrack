'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Camera, Send, Loader2 } from 'lucide-react'
import { saveEvidence } from './actions'

// Nota: En una implementación real, importaríamos browser-image-compression
// import imageCompression from 'browser-image-compression'

export function EvidenceCapture({ orderId }: { orderId: string }) {
  const [isPending, startTransition] = useTransition()
  const [description, setDescription] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setPreview(URL.createObjectURL(selectedFile))
    }
  }

  const handleUpload = async () => {
    if (!file || !description) return

    startTransition(async () => {
      try {
        // Simulación de compresión y subida a Supabase Storage
        // const compressedFile = await imageCompression(file, { maxSizeMB: 0.25, maxWidthOrHeight: 1280, useWebWorker: true, fileType: 'image/webp' })
        // const publicUrl = await uploadToStorage(compressedFile)
        
        const mockUrl = `https://placehold.co/600x400/222/white?text=Evidencia+Moto+${orderId}`
        await saveEvidence(orderId, [mockUrl], description)
        
        setFile(null)
        setPreview(null)
        setDescription('')
      } catch (error) {
        console.error('Error uploading evidence:', error)
        alert('Error al subir evidencia')
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <input 
          type="file" 
          accept="image/*" 
          capture="environment" 
          onChange={handleFileChange}
          className="hidden"
          id="camera-input"
        />
        <label 
          htmlFor="camera-input"
          className="flex flex-col items-center justify-center w-full h-40 bg-slate-800 border-4 border-dashed border-slate-700 rounded-3xl active:scale-95 transition-transform cursor-pointer overflow-hidden"
        >
          {preview ? (
            <img src={preview} alt="Vista previa" className="w-full h-full object-cover" />
          ) : (
            <>
              <Camera className="w-12 h-12 text-primary mb-2" />
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">Capturar Foto</span>
            </>
          )}
        </label>
      </div>

      {preview && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe lo que encontraste (ej: fuga de aceite, disco desgastado...)"
            className="w-full h-32 bg-slate-800 border-2 border-slate-700 rounded-2xl p-4 text-white focus:outline-none focus:border-primary placeholder:text-slate-600 text-lg font-medium"
          />
          <Button 
            onClick={handleUpload}
            disabled={isPending || !description}
            className="w-full h-16 rounded-2xl text-xl font-black uppercase tracking-tighter"
          >
            {isPending ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <Send className="w-6 h-6 mr-3" />
                Registrar Hallazgo
              </>
            )}
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => { setPreview(null); setFile(null); }}
            className="w-full text-slate-500 font-bold uppercase text-[10px]"
          >
            Cancelar
          </Button>
        </div>
      )}
    </div>
  )
}
