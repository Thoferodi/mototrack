'use client'

import { useTransition } from 'react'
import { updateOrderStatus } from './actions'
import { Database } from '@/types/database.types'
import { buildWhatsAppLink } from '@/lib/whatsapp'
import { Button } from '@/components/ui/button'
import { MessageSquare } from 'lucide-react'

type Status = Database['public']['Enums']['workorder_status']

const statusMap: Record<Status, { label: string }> = {
  received: { label: 'Recibida' },
  diagnosing: { label: 'Diagnosticando' },
  waiting_approval: { label: 'Esperando Aprobación' },
  in_repair: { label: 'En Reparación' },
  quality_check: { label: 'Control de Calidad' },
  ready_for_pickup: { label: 'Lista para Entrega' },
  delivered: { label: 'Entregada' },
}

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
  workshopSlug,
}: StatusSelectorProps) {
  const [isPending, startTransition] = useTransition()

  const handleStatusChange = async (newStatus: Status) => {
    startTransition(async () => {
      try {
        await updateOrderStatus(orderId, newStatus)
      } catch (error) {
        console.error('Failed to update status:', error)
        alert('Error al actualizar el estado')
      }
    })
  }

  const handleWhatsAppNotify = () => {
    if (!customerPhone) {
      alert('El cliente no tiene un teléfono registrado.')
      return
    }

    const trackingUrl = `${window.location.origin}/track/${trackingToken}`
    const statusText = statusMap[currentStatus].label

    const whatsappUrl = buildWhatsAppLink(
      customerPhone,
      customerName,
      plate,
      workshopName,
      trackingUrl,
      statusText
    )

    window.open(whatsappUrl, '_blank')
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-muted-foreground hidden sm:inline">Estado:</span>
        <div className="relative">
          <select
            value={currentStatus}
            disabled={isPending}
            onChange={(e) => handleStatusChange(e.target.value as Status)}
            className="appearance-none h-11 px-4 pr-10 rounded-full border-2 border-primary/20 bg-background text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 transition-all cursor-pointer hover:border-primary/40"
          >
            {Object.entries(statusMap).map(([value, { label }]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {isPending && (
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      <Button
        onClick={handleWhatsAppNotify}
        variant="outline"
        className="h-11 gap-2 border-emerald-500/30 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-500 font-bold"
      >
        <MessageSquare className="w-4 h-4 text-emerald-600" />
        Notificar por WhatsApp
      </Button>
    </div>
  )
}
