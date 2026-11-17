import { Database } from '@/types/database.types'
import { Badge } from '@/components/ui/badge'
import { Circle, CheckCircle2, Clock, Wrench, Search, PackageCheck, Truck } from 'lucide-react'

type Event = Database['public']['Tables']['order_timeline_events']['Row']
type Status = Database['public']['Enums']['workorder_status']

const statusConfig: Record<Status, { icon: any, color: string }> = {
  received: { icon: Clock, color: 'text-slate-500' },
  diagnosing: { icon: Search, color: 'text-blue-500' },
  waiting_approval: { icon: PackageCheck, color: 'text-yellow-500' },
  in_repair: { icon: Wrench, color: 'text-orange-500' },
  quality_check: { icon: CheckCircle2, color: 'text-purple-500' },
  ready_for_pickup: { icon: PackageCheck, color: 'text-green-500' },
  delivered: { icon: Truck, color: 'text-emerald-700' },
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
        const Config = statusConfig[event.status] || { icon: Circle, color: 'text-muted-foreground' }
        const Icon = Config.icon

        return (
          <div key={event.id} className="relative pl-12">
            {/* Icono de estado */}
            <div className={`absolute left-0 top-0 w-10 h-10 rounded-full border-4 border-background bg-muted flex items-center justify-center z-10 ${Config.color}`}>
              <Icon className="w-5 h-5" />
            </div>

            {/* Contenido del evento */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize text-[10px] font-bold">
                  {event.status.replace('_', ' ')}
                </Badge>
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  {new Date(event.created_at).toLocaleString('es-ES', { 
                    day: '2-digit', 
                    month: 'short', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                {event.description}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
