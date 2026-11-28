/**
 * src/lib/rate-limit.ts
 * 
 * Rate limiter de ventana deslizante basado en memoria de proceso.
 * Funciona en instancias calientes de Vercel Hobby (serverless warm reuse).
 * Para escalar a múltiples réplicas, reemplaza `store` por un cliente Redis/Upstash
 * conservando la misma interfaz pública.
 * 
 * Extrae la IP real desde x-forwarded-for / x-real-ip (cabeceras Vercel/Nginx).
 */

interface RateLimitEntry {
  timestamps: number[]
}

// Map en memoria del proceso (persiste entre invocaciones en instancias calientes)
const store = new Map<string, RateLimitEntry>()

export interface RateLimitOptions {
  /** Clave única de la acción (ej. 'login', 'search') */
  action: string
  /** IP o identificador normalizado del cliente */
  identifier: string
  /** Máximo de intentos dentro de la ventana */
  limit: number
  /** Duración de la ventana en milisegundos */
  windowMs: number
}

export interface RateLimitResult {
  allowed: boolean
  /** Intentos restantes dentro de la ventana */
  remaining: number
  /** Tiempo en ms hasta que el primer token expire */
  retryAfterMs: number
}

/**
 * Verifica y registra un intento. Limpia entradas expiradas automáticamente.
 */
export function checkRateLimit(opts: RateLimitOptions): RateLimitResult {
  const { action, identifier, limit, windowMs } = opts
  const key = `${action}:${identifier}`
  const now = Date.now()
  const windowStart = now - windowMs

  // Limpieza oportunista si el store crece demasiado en instancias calientes
  if (store.size > 500) {
    purgeExpiredEntries(windowMs)
  }

  let entry = store.get(key)
  if (!entry) {
    entry = { timestamps: [] }
    store.set(key, entry)
  }

  // Limpiar timestamps expirados de esta clave
  entry.timestamps = entry.timestamps.filter((ts: number) => ts > windowStart)

  if (entry.timestamps.length >= limit) {
    const oldest = entry.timestamps[0]
    const retryAfterMs = oldest + windowMs - now
    return { allowed: false, remaining: 0, retryAfterMs: Math.max(retryAfterMs, 0) }
  }

  entry.timestamps.push(now)
  return {
    allowed: true,
    remaining: limit - entry.timestamps.length,
    retryAfterMs: 0,
  }
}

/**
 * Extrae la IP real del cliente desde los headers de la request.
 * Vercel inyecta x-forwarded-for; en desarrollo se devuelve '127.0.0.1'.
 */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    // x-forwarded-for puede ser "client, proxy1, proxy2"; tomamos el primero
    return forwarded.split(',')[0].trim() || '127.0.0.1'
  }
  return headers.get('x-real-ip')?.trim() || '127.0.0.1'
}

/**
 * Elimina la entrada de rate limit de un identificador (útil tras login exitoso).
 */
export function clearRateLimit(action: string, identifier: string): void {
  store.delete(`${action}:${identifier}`)
}

/**
 * Limpieza global de entradas expiradas (compatible con target ES5/ES6 sin downlevelIteration).
 */
export function purgeExpiredEntries(windowMs: number): void {
  const cutoff = Date.now() - windowMs
  store.forEach((entry: RateLimitEntry, key: string) => {
    entry.timestamps = entry.timestamps.filter((ts: number) => ts > cutoff)
    if (entry.timestamps.length === 0) {
      store.delete(key)
    }
  })
}
