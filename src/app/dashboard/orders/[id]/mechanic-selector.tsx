'use client'

import * as React from 'react'
import { AlertCircle, Check, Loader2, Wrench } from 'lucide-react'
import { assignOrderMechanic } from './actions'
import { TEAM_ROLE_LABELS, WorkshopMechanicOption } from '@/lib/team'

interface MechanicSelectorProps {
  orderId: string
  currentMechanicId: string | null
  mechanics: WorkshopMechanicOption[]
}

export function MechanicSelector({
  orderId,
  currentMechanicId,
  mechanics,
}: MechanicSelectorProps) {
  const [selectedId, setSelectedId] = React.useState(currentMechanicId || '')
  const [isUpdating, setIsUpdating] = React.useState(false)
  const [savedNotice, setSavedNotice] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    setSelectedId(currentMechanicId || '')
  }, [currentMechanicId])

  const handleChange = async (newValue: string) => {
    const previousId = selectedId
    setSelectedId(newValue)
    setError(null)
    setSavedNotice(false)
    setIsUpdating(true)

    try {
      await assignOrderMechanic(orderId, newValue || null)
      setSavedNotice(true)
      setTimeout(() => setSavedNotice(false), 2200)
    } catch (err: any) {
      console.error('Error assigning mechanic:', err)
      setSelectedId(previousId)
      setError(err?.message || 'No se pudo asignar el mecánico.')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor="order-mechanic-select"
          className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5"
        >
          <Wrench className="w-3.5 h-3.5 text-orange-400" />
          Mecánico Asignado
        </label>
        {isUpdating ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-orange-300">
            <Loader2 className="w-3 h-3 animate-spin" />
            Guardando...
          </span>
        ) : savedNotice ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-300">
            <Check className="w-3 h-3" />
            Guardado
          </span>
        ) : null}
      </div>

      <select
        id="order-mechanic-select"
        value={selectedId}
        disabled={isUpdating}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full h-10 px-3 rounded-xl border border-white/10 bg-[#0B0D13] text-sm font-semibold text-white focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/25 disabled:opacity-50 transition-all cursor-pointer [color-scheme:dark]"
      >
        <option value="" className="bg-[#101218] text-slate-300">
          Sin asignar
        </option>
        {mechanics.map((m) => (
          <option
            key={m.id}
            value={m.id}
            disabled={!m.active}
            className="bg-[#101218] text-white"
          >
            {m.full_name} ({TEAM_ROLE_LABELS[m.role] || m.role}
            {!m.active ? ' · Inactivo' : ''})
          </option>
        ))}
      </select>

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
