'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { updateMechanicOrderStatus } from '../../actions'
import { Database } from '@/types/database.types'
import { Search, Wrench, PackageCheck, CheckCircle2, Loader2 } from 'lucide-react'

type Status = Database['public']['Enums']['workorder_status']

interface ActionButton {
  status: Status
  label: string
  icon: any
  color: string
}

const actionButtons: ActionButton[] = [
  { status: 'diagnosing', label: 'Diagnosticar', icon: Search, color: 'bg-blue-600 active:bg-blue-700' },
  { status: 'in_repair', label: 'Reparar', icon: Wrench, color: 'bg-orange-600 active:bg-orange-700' },
  { status: 'quality_check', label: 'Control', icon: CheckCircle2, color: 'bg-purple-600 active:bg-purple-700' },
  { status: 'ready_for_pickup', label: 'Listo', icon: PackageCheck, color: 'bg-green-600 active:bg-green-700' },
]

export function StatusControls({ orderId, currentStatus }: { orderId: string, currentStatus: Status }) {
  const [isPending, startTransition] = useTransition()

  const handleStatusChange = (newStatus: Status) => {
    if (newStatus === currentStatus) return
    startTransition(async () => {
      try {
        await updateMechanicOrderStatus(orderId, newStatus)
      } catch (error) {
        console.error('Error updating status:', error)
        alert('Error al actualizar estado')
      }
    })
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {actionButtons.map((btn) => (
        <Button
          key={btn.status}
          onClick={() => handleStatusChange(btn.status)}
          disabled={isPending}
          className={`h-20 rounded-3xl flex flex-col gap-1 border-0 shadow-lg transition-transform active:scale-95 ${btn.color} ${currentStatus === btn.status ? 'ring-4 ring-white ring-offset-2 ring-offset-slate-900' : 'opacity-60 grayscale-[0.5]'}`}
        >
          {isPending && currentStatus !== btn.status ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              <btn.icon className="w-8 h-8" />
              <span className="text-[10px] font-black uppercase tracking-widest">{btn.label}</span>
            </>
          )}
        </Button>
      ))}
    </div>
  )
}
