import { Database } from '@/types/database.types'
import { Badge } from '@/components/ui/badge'
import { parseMediaUrls } from '@/lib/workorder-status'
import {
  Circle,
  CheckCircle2,
  Clock,
  Wrench,
  Search,
  PackageCheck,
  Truck,
  XCircle,
  ImageIcon,
  PenTool,
} from 'lucide-react'

type Event = Database['public']['Tables']['order_timeline_events']['Row']
type Status = Database['public']['Enums']['order_status']

const statusConfig: Record<
  Status,
  { icon: any; color: string; badgeClass: string; label: string }
> = {
  received: {
    icon: Clock,
    color: 'text-slate-300 border-slate-400/30',
    badgeClass: 'bg-slate-500/15 text-slate-200 border-slate-400/30',
    label: 'Recibida',
  },
  diagnosing: {
    icon: Search,
    color: 'text-sky-400 border-sky-400/35',
    badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-400/30',
    label: 'Diagnosticando',
  },
  waiting_approval: {
    icon: PackageCheck,
    color: 'text-amber-400 border-amber-400/35',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-400/30',
    label: 'Esperando Aprobación',
  },
  in_progress: {
    icon: Wrench,
    color: 'text-orange-400 border-orange-500/40',
    badgeClass: 'bg-orange-500/15 text-orange-300 border-orange-400/30',
    label: 'En Reparación',
  },
  testing: {
    icon: CheckCircle2,
    color: 'text-violet-400 border-violet-400/35',
    badgeClass: 'bg-violet-500/15 text-violet-300 border-violet-400/30',
    label: 'Control de Calidad',
  },
  ready: {
    icon: PackageCheck,
    color: 'text-emerald-400 border-emerald-400/35',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
    label: 'Lista para Entrega',
  },
  delivered: {
    icon: Truck,
    color: 'text-emerald-300 border-emerald-400/40',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
    label: 'Entregada',
  },
  cancelled: {
    icon: XCircle,
    color: 'text-rose-400 border-rose-400/35',
    badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-400/30',
    label: 'Cancelada',
  },
}

export function Timeline({ events }: { events: Event[] }) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <p className="text-sm italic">No se han registrado eventos en la bitácora aún.</p>
      </div>
    )
  }

  return (
    <div className="relative space-y-6 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-px before:bg-white/10">
      {events.map((event) => {
        const snapshot = event.status_snapshot
        const Config = (snapshot && statusConfig[snapshot]) || {
          icon: Circle,
          color: 'text-slate-400 border-white/15',
          badgeClass: 'bg-white/[0.06] text-slate-200 border-white/15',
          label: snapshot || 'Actualización',
        }
        const Icon = Config.icon
        const mediaUrls = parseMediaUrls(event.media_urls)

        return (
          <div key={event.id} className="relative pl-12">
            <div
              className={`absolute left-0 top-0 w-10 h-10 rounded-full border-2 bg-[#0B0D13] shadow-[0_0_18px_rgba(249,115,22,0.12)] flex items-center justify-center z-10 ${Config.color}`}
            >
              <Icon className="w-4 h-4" />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={`text-[10px] font-bold ${Config.badgeClass}`}>
                  {Config.label}
                </Badge>
                {event.created_at && (
                  <span className="text-[11px] font-mono font-medium text-slate-400 uppercase tracking-wider">
                    {new Date(event.created_at).toLocaleString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                )}
              </div>

              {event.public_comment && (
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {event.public_comment}
                </p>
              )}

              {mediaUrls.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                  {mediaUrls.map((url, idx) => {
                    const lowerUrl = url.toLowerCase()
                    const isSignature =
                      lowerUrl.includes('/signatures/') ||
                      lowerUrl.includes('_signature.png') ||
                      lowerUrl.endsWith('signature.png')
                    return (
                      <a
                        key={`${event.id}-media-${idx}`}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`group relative aspect-video rounded-xl border overflow-hidden transition-all hover:ring-2 hover:ring-orange-500/70 ${
                          isSignature
                            ? 'border-slate-300 bg-white p-1.5'
                            : 'border-white/10 bg-[#0B0D13]'
                        }`}
                      >
                        <img
                          src={url}
                          alt={isSignature ? 'Firma de conformidad' : `Evidencia ${idx + 1}`}
                          className={`w-full h-full transition-transform group-hover:scale-105 ${
                            isSignature ? 'object-contain' : 'object-cover'
                          }`}
                        />
                        <span className="absolute bottom-1.5 right-1.5 bg-[#08090C]/85 border border-white/15 text-slate-100 text-[10px] font-semibold px-1.5 py-0.5 rounded-md flex items-center gap-1">
                          {isSignature ? (
                            <>
                              <PenTool className="w-2.5 h-2.5 text-orange-400" />
                              Firma
                            </>
                          ) : (
                            <>
                              <ImageIcon className="w-2.5 h-2.5 text-orange-400" />
                              Ver
                            </>
                          )}
                        </span>
                      </a>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
