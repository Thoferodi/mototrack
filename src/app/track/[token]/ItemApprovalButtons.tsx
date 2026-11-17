'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, X, Loader2 } from 'lucide-react'
import { updateItemApprovalStatus } from './actions'

interface ItemApprovalButtonsProps {
  trackingToken: string
  itemId: string
  currentStatus: 'pending' | 'approved' | 'rejected'
  isLocked: boolean
}

export function ItemApprovalButtons({
  trackingToken,
  itemId,
  currentStatus,
  isLocked,
}: ItemApprovalButtonsProps) {
  const [isPending, startTransition] = useTransition()

  const handleAction = (status: 'approved' | 'rejected') => {
    if (isLocked) return

    startTransition(async () => {
      try {
        await updateItemApprovalStatus(trackingToken, itemId, status)
      } catch (error: any) {
        console.error('Error updating item approval:', error)
        alert(error.message || 'Error al actualizar el ítem')
      }
    })
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

  // Si está interactivo (estado waiting_approval)
  return (
    <div className="flex items-center justify-center gap-1.5">
      <Button
        size="sm"
        variant={currentStatus === 'approved' ? 'default' : 'outline'}
        disabled={isPending}
        onClick={() => handleAction('approved')}
        className={`h-8 px-3 text-xs font-bold gap-1 ${
          currentStatus === 'approved'
            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
            : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
        }`}
      >
        {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
        Aprobar
      </Button>

      <Button
        size="sm"
        variant={currentStatus === 'rejected' ? 'destructive' : 'outline'}
        disabled={isPending}
        onClick={() => handleAction('rejected')}
        className={`h-8 px-3 text-xs font-bold gap-1 ${
          currentStatus === 'rejected'
            ? 'bg-rose-600 hover:bg-rose-700 text-white'
            : 'border-rose-300 text-rose-700 hover:bg-rose-50'
        }`}
      >
        {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
        Rechazar
      </Button>
    </div>
  )
}
