import { Database } from '@/types/database.types'
import { Badge } from '@/components/ui/badge'
import { Circle, CheckCircle2, Clock, Wrench, Search, PackageCheck, Truck, ImageIcon } from 'lucide-react'

type Event = Database['public']['Tables']['order_timeline_events']['Row']
type Status = Database['public']['Enums']['workorder_status']

const statusConfig: Record<Status, { icon: any; color: string; label: string }> = {
  received: { icon: Clock, color: 'text-slate-500', label: 'Recibida' },
  diagnosing: { icon: Search, color: 'text-blue-500', label: 'Diagnosticando' },
  waiting_approval: { icon: PackageCheck, color: 'text-yellow-500', label: 'Esperando Aprobación' },
  in_repair: { icon: Wrench, color: 'text-orange-500', label: 'En Reparación' },
  quality_check: { icon: CheckCircle2, color: 'text-purple-500', label: 'Control de Calidad' },
  ready_for_pickup: { icon: PackageCheck, color: 'text-green-500', label: 'Lista para Entrega' },
  delivered: { icon: Truck, color: 'text-emerald-700', label: 'Entregada' },
}

export function Timeline({ events }: { events: Event[] }) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p className="text-sm italic">No se han registrado eventos en la bitácora aún.</p>
      </div>
    )
  }

  return (
    <div className="relative space-y-6 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-muted">
      {events.map((event) => {
        const Config = statusConfig[event.status] || {
          icon: Circle,
          color: 'text-muted-foreground',
          label: event.status,
        }
        const Icon = Config.icon
        const mediaUrls = event.media_urls || []

        return (
          <div key={event.id} className="relative pl-12">
            <div
              className={`absolute left-0 top-0 w-10 h-10 rounded-full border-4 border-background bg-muted flex items-center justify-center z-10 ${Config.color}`}
            >
              <Icon className="w-5 h-5" />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-[10px] font-bold">
                  {Config.label}
                </Badge>
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  {new Date(event.created_at).toLocaleString('es-ES', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              {event.description && (
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {event.description}
                </p>
              )}

              {mediaUrls.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                  {mediaUrls.map((url, idx) => (
                    <a
                      key={`${event.id}-media-${idx}`}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative aspect-video rounded-lg border bg-slate-50 overflow-hidden hover:ring-2 hover:ring-primary transition-all"
                    >
                      <img
                        src={url}
                        alt={`Evidencia ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <span className="absolute bottom-1 right-1 bg-slate-900/70 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
                        <ImageIcon className="w-2.5 h-2.5" />
                        Ver
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
