'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Wrench, PackageCheck, CheckCircle2, Loader2, AlertCircle, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { updateMechanicOrderStatus } from '../../actions'
import { WorkOrderStatus, getWorkOrderStatusLabel } from '@/lib/workorder-status'

interface ActionButton {
  status: WorkOrderStatus
  label: string
  icon: any
  color: string
}

const actionButtons: ActionButton[] = [
  { status: 'diagnosing', label: 'Diagnosticar', icon: Search, color: 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700' },
  { status: 'in_repair', label: 'Reparar', icon: Wrench, color: 'bg-orange-600 hover:bg-orange-500 active:bg-orange-700' },
  { status: 'quality_check', label: 'Control', icon: CheckCircle2, color: 'bg-purple-600 hover:bg-purple-500 active:bg-purple-700' },
  { status: 'ready_for_pickup', label: 'Listo', icon: PackageCheck, color: 'bg-green-600 hover:bg-green-500 active:bg-green-700' },
]

export function StatusControls({
  orderId,
  currentStatus,
}: {
  orderId: string
  currentStatus: WorkOrderStatus
}) {
  const router = useRouter()
  const [activeStatus, setActiveStatus] = useState<WorkOrderStatus>(currentStatus)
  const [pendingStatus, setPendingStatus] = useState<WorkOrderStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleStatusChange = async (newStatus: WorkOrderStatus) => {
    if (newStatus === activeStatus || pendingStatus !== null) return

    const previousStatus = activeStatus
    setError(null)
    setSuccessMsg(null)
    setPendingStatus(newStatus)

    try {
      const result = await updateMechanicOrderStatus(orderId, newStatus)
      if (!result.success) {
        setActiveStatus(previousStatus)
        setError(result.error || 'No se pudo actualizar el estado.')
        return
      }

      setActiveStatus(newStatus)
      setSuccessMsg(`Estado actualizado a: ${getWorkOrderStatusLabel(newStatus)}`)
      router.refresh()
    } catch (err: any) {
      console.error('Error updating status:', err)
      setActiveStatus(previousStatus)
      setError(err?.message || 'Error de conexión al actualizar el estado.')
    } finally {
      setPendingStatus(null)
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-4">
        {actionButtons.map((btn) => {
          const isCurrent = activeStatus === btn.status
          const isThisPending = pendingStatus === btn.status
          const isAnyPending = pendingStatus !== null

          return (
            <Button
              key={btn.status}
              type="button"
              onClick={() => handleStatusChange(btn.status)}
              disabled={isAnyPending}
              className={`h-20 rounded-3xl flex flex-col gap-1.5 border-0 shadow-lg text-white transition-transform active:scale-95 ${btn.color} ${
                isCurrent
                  ? 'ring-4 ring-white ring-offset-2 ring-offset-slate-900 opacity-100'
                  : 'opacity-70 grayscale-[0.3]'
              }`}
            >
              {isThisPending ? (
                <>
                  <Loader2 className="w-7 h-7 animate-spin" />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Guardando...
                  </span>
                </>
              ) : (
                <>
                  <btn.icon className="w-7 h-7" />
                  <span className="text-[11px] font-black uppercase tracking-widest">
                    {btn.label}
                  </span>
                </>
              )}
            </Button>
          )
        })}
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 bg-red-950/70 border-2 border-red-500/40 text-red-200 px-4 py-3 rounded-2xl text-sm font-semibold"
        >
          <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && !error && (
        <div className="flex items-center gap-2 bg-emerald-950/70 border-2 border-emerald-500/40 text-emerald-200 px-4 py-3 rounded-2xl text-sm font-semibold">
          <Check className="w-5 h-5 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}
    </div>
  )
}
