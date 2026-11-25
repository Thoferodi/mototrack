'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, X, Loader2, AlertCircle } from 'lucide-react'
import { updateItemApprovalStatus } from './actions'

interface ItemApprovalButtonsProps {
  trackingToken: string
  itemId: string
  approved: boolean | null
  isLocked: boolean
}

export function ItemApprovalButtons({
  trackingToken,
  itemId,
  approved,
  isLocked,
}: ItemApprovalButtonsProps) {
  const router = useRouter()
  const [pendingAction, setPendingAction] = useState<'approved' | 'rejected' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const currentStatus: 'pending' | 'approved' | 'rejected' =
    approved === true ? 'approved' : approved === false ? 'rejected' : 'pending'

  const handleAction = async (status: 'approved' | 'rejected') => {
    if (isLocked || pendingAction !== null || currentStatus === status) return

    setError(null)
    setPendingAction(status)

    try {
      const result = await updateItemApprovalStatus(trackingToken, itemId, status)
      if (!result.success) {
        setError(result.error || 'No se pudo actualizar el ítem.')
        return
      }
      router.refresh()
    } catch (err: any) {
      console.error('Error updating item approval:', err)
      setError(err?.message || 'Error de conexión al actualizar el ítem.')
    } finally {
      setPendingAction(null)
    }
  }

  // Si está bloqueado (presupuesto cerrado)
  if (isLocked) {
    if (currentStatus === 'approved') {
      return (
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1">
          <Check className="w-3 h-3" /> Aprobado
        </Badge>
      )
    }
    if (currentStatus === 'rejected') {
      return (
        <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 gap-1">
          <X className="w-3 h-3" /> Rechazado
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200">
        Pendiente
      </Badge>
    )
  }

  const isBusy = pendingAction !== null

  // Si está interactivo (estado waiting_approval)
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex items-center justify-center gap-1.5">
        <Button
          type="button"
          size="sm"
          variant={currentStatus === 'approved' ? 'default' : 'outline'}
          disabled={isBusy}
          onClick={() => handleAction('approved')}
          className={`h-9 px-3 text-xs font-bold gap-1 ${
            currentStatus === 'approved'
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
          }`}
        >
          {pendingAction === 'approved' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Check className="w-3.5 h-3.5" />
          )}
          {pendingAction === 'approved' ? 'Guardando' : 'Aprobar'}
        </Button>

        <Button
          type="button"
          size="sm"
          variant={currentStatus === 'rejected' ? 'destructive' : 'outline'}
          disabled={isBusy}
          onClick={() => handleAction('rejected')}
          className={`h-9 px-3 text-xs font-bold gap-1 ${
            currentStatus === 'rejected'
              ? 'bg-rose-600 hover:bg-rose-700 text-white'
              : 'border-rose-300 text-rose-700 hover:bg-rose-50'
          }`}
        >
          {pendingAction === 'rejected' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <X className="w-3.5 h-3.5" />
          )}
          {pendingAction === 'rejected' ? 'Guardando' : 'Rechazar'}
        </Button>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center gap-1 text-[11px] font-semibold text-destructive bg-destructive/10 px-2 py-1 rounded border border-destructive/20 max-w-[220px] text-left"
        >
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
