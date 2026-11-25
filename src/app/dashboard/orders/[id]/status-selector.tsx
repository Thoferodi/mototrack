'use client'

import { useState } from 'react'
import { updateOrderStatus } from './actions'
import { Database } from '@/types/database.types'
import { WORKORDER_STATUS_LABELS } from '@/lib/workorder-status'
import { buildWhatsAppLink } from '@/lib/whatsapp'
import { Button } from '@/components/ui/button'
import { MessageSquare, Loader2, AlertCircle } from 'lucide-react'

type Status = Database['public']['Enums']['order_status']

interface StatusSelectorProps {
  orderId: string
  currentStatus: Status
  trackingToken: string
  customerName: string
  customerPhone: string
  plate: string
  workshopName: string
  workshopSlug: string
}

export function StatusSelector({
  orderId,
  currentStatus,
  trackingToken,
  customerName,
  customerPhone,
  plate,
  workshopName,
}: StatusSelectorProps) {
  const [status, setStatus] = useState<Status>(currentStatus)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleStatusChange = async (newStatus: Status) => {
    const previousStatus = status
    setStatus(newStatus)
    setError(null)
    setIsUpdating(true)
    try {
      await updateOrderStatus(orderId, newStatus)
    } catch (err: any) {
      console.error('Failed to update status:', err)
      setStatus(previousStatus)
      setError(err?.message || 'Error al actualizar el estado de la orden.')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleWhatsAppNotify = () => {
    setError(null)
    const cleanPhone = customerPhone.replace(/\D/g, '')
    if (!cleanPhone) {
      setError('El cliente no tiene un número de WhatsApp válido registrado.')
      return
    }
    if (!trackingToken) {
      setError('Esta orden no tiene un token de seguimiento asignado.')
      return
    }

    const trackingUrl = `${window.location.origin}/track/${trackingToken}`
    const statusText = WORKORDER_STATUS_LABELS[status] || status

    const whatsappUrl = buildWhatsAppLink(
      customerPhone,
      customerName,
      plate,
      workshopName,
      trackingUrl,
      statusText
    )

    window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="flex flex-col items-start md:items-end gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 hidden sm:inline">
            Estado:
          </span>
          <div className="relative flex items-center gap-2">
            <select
              value={status}
              disabled={isUpdating}
              onChange={(e) => handleStatusChange(e.target.value as Status)}
              className="h-11 px-4 rounded-full border border-white/15 bg-[#0B0D13] text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/60 disabled:opacity-50 transition-all cursor-pointer hover:border-orange-500/40 [color-scheme:dark]"
            >
              {Object.entries(WORKORDER_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value} className="bg-[#101218] text-white">
                  {label}
                </option>
              ))}
            </select>
            {isUpdating && <Loader2 className="w-4 h-4 text-orange-400 animate-spin shrink-0" />}
          </div>
        </div>

        <Button
          type="button"
          onClick={handleWhatsAppNotify}
          variant="outline"
          disabled={isUpdating}
          className="h-11 gap-2 rounded-xl border-emerald-500/35 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 hover:text-emerald-200 hover:border-emerald-400/50 font-bold"
        >
          <MessageSquare className="w-4 h-4 text-emerald-400" />
          Notificar por WhatsApp
        </Button>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center gap-1.5 text-xs font-medium text-rose-200 bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/30"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
