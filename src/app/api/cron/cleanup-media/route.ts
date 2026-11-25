import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    // 1. Verificar el header de autorización con CRON_SECRET
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Instanciar Supabase con Service Role Key para tareas administrativas en background
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Missing Supabase environment variables for cron job' },
        { status: 500 }
      )
    }

    const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
      },
    })

    // 3. Calcular la fecha límite de 90 días atrás
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
    const cutoffDateISO = ninetyDaysAgo.toISOString()

    // 4. Buscar órdenes de trabajo entregadas (delivered) actualizadas hace más de 90 días
    // y sus eventos de timeline asociados que contengan media_urls.
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
      .eq('work_orders.status', 'delivered')
      .lt('work_orders.updated_at', cutoffDateISO)
      .not('media_urls', 'is', null)

    if (fetchError) {
      console.error('Error fetching events for cleanup:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!eventsToClean || eventsToClean.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No media found for cleanup',
        deletedFilesCount: 0,
        cleanedEventsCount: 0,
      })
    }

    let deletedFilesCount = 0
    let cleanedEventsCount = 0

    for (const event of eventsToClean) {
      const mediaUrls = Array.isArray(event.media_urls)
        ? event.media_urls.filter((u): u is string => typeof u === 'string' && u.length > 0)
        : []
      if (mediaUrls.length === 0) continue

      const filePaths: string[] = []
      for (const url of mediaUrls) {
        try {
          const urlObj = new URL(url)
          const marker = '/storage/v1/object/public/evidences/'
          const index = urlObj.pathname.indexOf(marker)
          if (index !== -1) {
            const path = urlObj.pathname.substring(index + marker.length)
            filePaths.push(path)
          } else {
            const parts = url.split('/evidences/')
            if (parts.length > 1) {
              filePaths.push(parts[1])
            }
          }
        } catch (e) {
          console.error('Error parsing media URL:', url, e)
        }
      }

      if (filePaths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from('evidences')
          .remove(filePaths)

        if (storageError) {
          console.error(`Error deleting files from storage for event ${event.id}:`, storageError)
        } else {
          deletedFilesCount += filePaths.length
        }
      }

      const { error: updateError } = await supabase
        .from('order_timeline_events')
        .update({ media_urls: [] })
        .eq('id', event.id)

      if (updateError) {
        console.error(`Error updating event ${event.id}:`, updateError)
      } else {
        cleanedEventsCount++
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Cleanup completed successfully',
      deletedFilesCount,
      cleanedEventsCount,
    })
  } catch (error: any) {
    console.error('Unexpected error in cleanup cron job:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
