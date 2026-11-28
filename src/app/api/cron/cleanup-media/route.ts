import { NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/supabase/admin'
import { timingSafeEqual } from 'crypto'
import type { Database } from '@/types/database.types'

export const dynamic = 'force-dynamic'

const TERMINAL_STATUSES: Database['public']['Enums']['order_status'][] = [
  'delivered',
  'cancelled',
]

const RETENTION_DAYS = 90

const EVIDENCES_PATH_MARKERS = [
  '/storage/v1/object/public/evidences/',
  '/storage/v1/object/authenticated/evidences/',
  '/storage/v1/object/sign/evidences/',
]

function extractEvidencesPath(rawUrl: string, expectedHost: string | null): string | null {
  try {
    const parsed = new URL(rawUrl)
    if (expectedHost && parsed.hostname !== expectedHost) {
      return null
    }

    for (const marker of EVIDENCES_PATH_MARKERS) {
      const index = parsed.pathname.indexOf(marker)
      if (index !== -1) {
        const relativePath = decodeURIComponent(
          parsed.pathname.substring(index + marker.length)
        ).replace(/^\/+/, '')
        return relativePath.length > 0 ? relativePath : null
      }
    }

    return null
  } catch {
    return null
  }
}

/**
 * Comparación de tokens en tiempo constante para prevenir timing attacks.
 * Ambos buffers deben tener la misma longitud antes de comparar.
 */
function timingSafeTokenEqual(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, 'utf8')
    const bufB = Buffer.from(b, 'utf8')
    // Si las longitudes difieren, se crea un buffer relleno para mantener tiempo constante
    if (bufA.length !== bufB.length) {
      // Comparar con un buffer del mismo tamaño que a (siempre falso, pero sin fuga de timing)
      const paddedB = Buffer.alloc(bufA.length, 0)
      bufB.copy(paddedB, 0, 0, Math.min(bufB.length, bufA.length))
      timingSafeEqual(bufA, paddedB)
      return false
    }
    return timingSafeEqual(bufA, bufB)
  } catch {
    return false
  }
}

export async function GET(request: Request) {
  try {
    // 1. Exigir autorización estricta con CRON_SECRET mediante comparación de tiempo constante
    const authHeader = request.headers.get('authorization') || ''
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      // No revelar que falta la variable — respuesta genérica
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const expectedToken = `Bearer ${cronSecret}`
    if (!timingSafeTokenEqual(authHeader, expectedToken)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Validar credenciales administrativas antes de instanciar createAdminSupabaseClient()
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('[cron/cleanup-media] Missing Supabase environment variables')
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const dryRun = searchParams.get('dryRun') === 'true'

    const supabase = createAdminSupabaseClient()

    let expectedHost: string | null = null
    try {
      expectedHost = new URL(supabaseUrl).hostname
    } catch {
      expectedHost = null
    }

    // 3. Calcular la fecha límite de 90 días atrás
    const cutoffDate = new Date()
    cutoffDate.setUTCDate(cutoffDate.getUTCDate() - RETENTION_DAYS)
    const cutoffDateISO = cutoffDate.toISOString()

    // 4. Consultar eventos con media_urls de órdenes terminales (delivered / cancelled) > 90 días
    const { data: eventsToClean, error: fetchError } = await supabase
      .from('order_timeline_events')
      .select(`
        id,
        media_urls,
        work_order_id,
        work_orders!inner (
          status,
          updated_at
        )
      `)
      .in('work_orders.status', TERMINAL_STATUSES)
      .lt('work_orders.updated_at', cutoffDateISO)
      .not('media_urls', 'is', null)

    if (fetchError) {
      console.error('[cron/cleanup-media] Error fetching events:', fetchError.code)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    const candidates: Array<{
      eventId: string
      workOrderId: string
      filePaths: string[]
      remainingUrls: string[]
    }> = []

    for (const event of eventsToClean ?? []) {
      const mediaUrls = Array.isArray(event.media_urls)
        ? event.media_urls.filter((u): u is string => typeof u === 'string' && u.length > 0)
        : []

      if (mediaUrls.length === 0) continue

      const filePaths: string[] = []
      const remainingUrls: string[] = []

      for (const url of mediaUrls) {
        const extractedPath = extractEvidencesPath(url, expectedHost)
        if (extractedPath) {
          filePaths.push(extractedPath)
        } else {
          remainingUrls.push(url)
        }
      }

      const uniqueFilePaths = Array.from(new Set(filePaths))
      if (uniqueFilePaths.length === 0) continue

      candidates.push({
        eventId: event.id,
        workOrderId: event.work_order_id,
        filePaths: uniqueFilePaths,
        remainingUrls,
      })
    }

    if (dryRun) {
      const candidateFilesCount = candidates.reduce(
        (total, item) => total + item.filePaths.length,
        0
      )

      return NextResponse.json({
        success: true,
        dryRun: true,
        cutoffDate: cutoffDateISO,
        message: 'Dry run completed. No files or database records were modified.',
        candidateEventsCount: candidates.length,
        candidateFilesCount,
        deletedFilesCount: 0,
        cleanedEventsCount: 0,
        candidates: candidates.map(({ eventId, workOrderId, filePaths }) => ({
          eventId,
          workOrderId,
          filePaths,
        })),
      })
    }

    if (candidates.length === 0) {
      return NextResponse.json({
        success: true,
        dryRun: false,
        cutoffDate: cutoffDateISO,
        message: 'No media found for cleanup',
        deletedFilesCount: 0,
        cleanedEventsCount: 0,
      })
    }

    let deletedFilesCount = 0
    let cleanedEventsCount = 0
    const errors: Array<{ eventId: string; step: 'storage' | 'database' }> = []

    for (const candidate of candidates) {
      const { error: storageError } = await supabase.storage
        .from('evidences')
        .remove(candidate.filePaths)

      if (storageError) {
        console.error(`[cron/cleanup-media] Storage error for event ${candidate.eventId}:`, storageError.message)
        errors.push({ eventId: candidate.eventId, step: 'storage' })
        continue
      }

      deletedFilesCount += candidate.filePaths.length

      const { error: updateError } = await supabase
        .from('order_timeline_events')
        .update({ media_urls: candidate.remainingUrls })
        .eq('id', candidate.eventId)

      if (updateError) {
        console.error(`[cron/cleanup-media] DB error for event ${candidate.eventId}:`, updateError.message)
        errors.push({ eventId: candidate.eventId, step: 'database' })
      } else {
        cleanedEventsCount++
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          dryRun: false,
          cutoffDate: cutoffDateISO,
          message: 'Cleanup finished with partial errors',
          deletedFilesCount,
          cleanedEventsCount,
          errorCount: errors.length,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      dryRun: false,
      cutoffDate: cutoffDateISO,
      message: 'Cleanup completed successfully',
      deletedFilesCount,
      cleanedEventsCount,
    })
  } catch (error: unknown) {
    console.error('[cron/cleanup-media] Unexpected error:', error)
    // No filtrar mensaje de error interno hacia el cliente
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
