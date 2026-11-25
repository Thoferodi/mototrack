import { NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/supabase/admin'
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

export async function GET(request: Request) {
  try {
    // 1. Exigir autorización estricta con CRON_SECRET (también para dryRun)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Validar credenciales administrativas antes de instanciar createAdminSupabaseClient()
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Missing Supabase environment variables for cron job' },
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
      console.error('Error fetching events for cleanup:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
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
    const errors: Array<{ eventId: string; step: 'storage' | 'database'; message: string }> = []

    for (const candidate of candidates) {
      const { error: storageError } = await supabase.storage
        .from('evidences')
        .remove(candidate.filePaths)

      if (storageError) {
        console.error(
          `Error deleting files from storage for event ${candidate.eventId}:`,
          storageError
        )
        errors.push({
          eventId: candidate.eventId,
          step: 'storage',
          message: storageError.message,
        })
        continue
      }

      deletedFilesCount += candidate.filePaths.length

      const { error: updateError } = await supabase
        .from('order_timeline_events')
        .update({ media_urls: candidate.remainingUrls })
        .eq('id', candidate.eventId)

      if (updateError) {
        console.error(`Error updating event ${candidate.eventId}:`, updateError)
        errors.push({
          eventId: candidate.eventId,
          step: 'database',
          message: updateError.message,
        })
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
          errors,
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
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    console.error('Unexpected error in cleanup cron job:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
