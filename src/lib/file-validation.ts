/**
 * src/lib/file-validation.ts
 * 
 * Validación segura de archivos subidos en servidor:
 * 1. Lista blanca estricta de MIME types (JPEG, PNG, WebP únicamente)
 * 2. Límite de tamaño en bytes
 * 3. Verificación de Magic Bytes (cabecera real del archivo, ignora file.type/extensión falsificados)
 * 4. Generación de nombre seguro con UUID (evita path traversal)
 */

import { randomUUID } from 'crypto'
export { validateSafeUrl } from './sanitize'

export type AllowedMimeType = 'image/jpeg' | 'image/png' | 'image/webp'

export interface FileValidationOptions {
  maxSizeBytes?: number
  allowedTypes?: AllowedMimeType[]
}

export interface FileValidationResult {
  valid: boolean
  error?: string
  /** Tipo MIME real verificado por magic bytes */
  detectedType?: AllowedMimeType
  /** Nombre de archivo seguro con UUID, sin usar file.name del usuario */
  safeName?: string
  /** Extensión derivada del tipo real */
  extension?: string
}

const MAGIC_BYTES: Array<{
  type: AllowedMimeType
  ext: string
  check: (buf: Uint8Array) => boolean
}> = [
  {
    type: 'image/jpeg',
    ext: 'jpg',
    // FF D8 FF
    check: (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    type: 'image/png',
    ext: 'png',
    // 89 50 4E 47 0D 0A 1A 0A
    check: (b) =>
      b.length >= 8 &&
      b[0] === 0x89 &&
      b[1] === 0x50 &&
      b[2] === 0x4e &&
      b[3] === 0x47 &&
      b[4] === 0x0d &&
      b[5] === 0x0a &&
      b[6] === 0x1a &&
      b[7] === 0x0a,
  },
  {
    type: 'image/webp',
    ext: 'webp',
    // 52 49 46 46 ?? ?? ?? ?? 57 45 42 50 (RIFF....WEBP)
    check: (b) =>
      b.length >= 12 &&
      b[0] === 0x52 &&
      b[1] === 0x49 &&
      b[2] === 0x46 &&
      b[3] === 0x46 &&
      b[8] === 0x57 &&
      b[9] === 0x45 &&
      b[10] === 0x42 &&
      b[11] === 0x50,
  },
]

const DEFAULT_ALLOWED: AllowedMimeType[] = ['image/jpeg', 'image/png', 'image/webp']
const MAX_EVIDENCE_BYTES = 5 * 1024 * 1024 // 5 MB
const MAX_LOGO_BYTES = 2 * 1024 * 1024     // 2 MB

/**
 * Verifica los magic bytes de un Buffer/Uint8Array y retorna el tipo coincidente.
 */
export function detectImageMagicBytes(
  bytes: Uint8Array,
  allowedTypes: AllowedMimeType[] = DEFAULT_ALLOWED
): { type: AllowedMimeType; ext: string } | null {
  const match = MAGIC_BYTES.find((m) => allowedTypes.includes(m.type) && m.check(bytes))
  return match ? { type: match.type, ext: match.ext } : null
}

/**
 * Valida un File/Blob en servidor mediante tamaño y Magic Bytes reales.
 */
export async function validateImageFile(
  file: File | Blob,
  opts: FileValidationOptions = {}
): Promise<FileValidationResult> {
  const allowedTypes = opts.allowedTypes ?? DEFAULT_ALLOWED
  const maxSize = opts.maxSizeBytes ?? MAX_EVIDENCE_BYTES

  if (file.size === 0) {
    return { valid: false, error: 'El archivo está vacío.' }
  }
  if (file.size > maxSize) {
    const maxMB = (maxSize / (1024 * 1024)).toFixed(0)
    return { valid: false, error: `El archivo supera el límite de ${maxMB} MB.` }
  }

  const slice = file.slice(0, 12)
  const buffer = await slice.arrayBuffer()
  const bytes = new Uint8Array(buffer)

  const match = detectImageMagicBytes(bytes, allowedTypes)

  if (!match) {
    const trimmedHeader = new TextDecoder('utf-8', { fatal: false })
      .decode(bytes)
      .trimStart()
    const isMarkup =
      trimmedHeader.startsWith('<') ||
      bytes[0] === 0x3c ||
      trimmedHeader.toLowerCase().includes('<svg') ||
      trimmedHeader.toLowerCase().includes('<html')
    const isPdf = bytes.length >= 3 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44
    const isExe = bytes.length >= 2 && bytes[0] === 0x4d && bytes[1] === 0x5a

    if (isMarkup) {
      return {
        valid: false,
        error: 'Los archivos SVG, HTML y XML no están permitidos por razones de seguridad.',
      }
    }
    if (isPdf) {
      return { valid: false, error: 'Los archivos PDF no están permitidos como imágenes.' }
    }
    if (isExe) {
      return { valid: false, error: 'Los archivos ejecutables no están permitidos.' }
    }

    return {
      valid: false,
      error: 'Tipo de archivo no permitido o corrupto. Solo se aceptan imágenes JPEG, PNG o WebP reales.',
    }
  }

  const safeName = `${randomUUID()}.${match.ext}`

  return {
    valid: true,
    detectedType: match.type,
    extension: match.ext,
    safeName,
  }
}

/**
 * Valida una Data URL de firma (canvas PNG) verificando prefijo, límite de 2 MB y magic bytes PNG reales.
 */
export function validateSignatureDataUrl(dataUrl: string): { valid: boolean; error?: string } {
  if (!dataUrl || typeof dataUrl !== 'string') {
    return { valid: false, error: 'Firma inválida.' }
  }
  const prefix = 'data:image/png;base64,'
  if (!dataUrl.startsWith(prefix)) {
    return {
      valid: false,
      error: 'Solo se acepta firma en formato PNG (data:image/png;base64,...).',
    }
  }
  const base64Part = dataUrl.slice(prefix.length)
  if (!base64Part || !/^[A-Za-z0-9+/=]+$/.test(base64Part)) {
    return { valid: false, error: 'Contenido base64 de la firma inválido.' }
  }
  const approxBytes = base64Part.length * 0.75
  if (approxBytes > MAX_LOGO_BYTES) {
    return { valid: false, error: 'La firma es demasiado grande (máx 2 MB).' }
  }
  const decoded = Buffer.from(base64Part, 'base64')
  const magic = detectImageMagicBytes(new Uint8Array(decoded), ['image/png'])
  if (!magic) {
    return { valid: false, error: 'La firma no corresponde a una imagen PNG válida.' }
  }
  return { valid: true }
}

export { MAX_EVIDENCE_BYTES, MAX_LOGO_BYTES }
