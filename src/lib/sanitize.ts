/**
 * src/lib/sanitize.ts
 * 
 * Utilidades de sanitización para prevenir:
 * - PostgREST filter injection en .or(), .filter(), .ilike()
 * - Control chars / XSS en inputs de texto y URLs
 * - Open Redirect via parámetro de redirección
 */

/**
 * Elimina caracteres especiales de sintaxis PostgREST para uso seguro
 * en .or(...), .ilike(...) y filtros de texto libre.
 * 
 * Caracteres peligrosos en PostgREST: , ( ) . * \ % _ " '
 */
export function sanitizePostgrestSearch(input: string): string {
  if (!input || typeof input !== 'string') return ''
  return input
    .trim()
    .replace(/[\x00-\x1f\x7f]/g, '')
    .replace(/[,().\\*%_'"]/g, '')
    .slice(0, 200)
}

/**
 * Sanitiza texto libre para almacenar en BD (notas, comentarios, descripciones).
 * Elimina caracteres de control excepto saltos de línea y tabulaciones.
 */
export function sanitizeText(input: string, maxLength = 2000): string {
  if (!input || typeof input !== 'string') return ''
  return input
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '')
    .trim()
    .slice(0, maxLength)
}

/**
 * Valida que una URL sea segura: protocolo https: o ruta relativa /.
 * Bloquea javascript:, data:, vbscript:, file:, etc.
 */
export function validateSafeUrl(url: string | null | undefined): boolean {
  if (!url) return true
  const trimmed = url.trim()
  if (!trimmed) return true
  // Eliminar caracteres de control ocultos que puedan engañar a parsers
  if (/[\x00-\x1f\x7f]/.test(trimmed)) return false
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return true
  try {
    const parsed = new URL(trimmed)
    return parsed.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Valida que un parámetro de redirección sea una ruta interna segura.
 * Previene Open Redirect: solo permite rutas que empiecen con '/' pero no '//'.
 */
export function isSafeRedirect(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false
  const trimmed = url.trim()
  return trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.startsWith('/\\')
}

/**
 * Normaliza un email para comparación segura (trim + lowercase).
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}
