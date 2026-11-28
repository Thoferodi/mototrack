'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PackageCheck, Lock } from 'lucide-react'
import { ItemApprovalButtons } from './ItemApprovalButtons'

export interface PublicBudgetItem {
  id: string
  description: string
  type: 'spare_part' | 'labor'
  quantity: number | null
  unit_price: number | null
  approved: boolean | null
}

interface PublicBudgetCardProps {
  trackingToken: string
  initialItems: PublicBudgetItem[]
  isWaitingApproval: boolean
  currentStatusLabel: string
}

export function PublicBudgetCard({
  trackingToken,
  initialItems,
  isWaitingApproval,
  currentStatusLabel,
}: PublicBudgetCardProps) {
  const [items, setItems] = React.useState<PublicBudgetItem[]>(initialItems)

  React.useEffect(() => {
    setItems(initialItems)
  }, [initialItems])

  const handleStatusUpdated = (itemId: string, approved: boolean) => {
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, approved } : item))
    )
  }

  const total = items.reduce((acc, item) => {
    if (item.approved === false) return acc
    return acc + Number(item.quantity ?? 1) * Number(item.unit_price ?? 0)
  }, 0)

  return (
    <Card className="border-2 shadow-sm overflow-hidden">
      <CardHeader className="bg-slate-50/80 border-b py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <PackageCheck className="w-5 h-5 text-primary" />
          Presupuesto Detallado
        </CardTitle>
        {!isWaitingApproval ? (
          <Badge
            variant="secondary"
            className="gap-1.5 bg-amber-100 text-amber-800 border-amber-200 text-xs py-1 w-fit"
          >
            <Lock className="w-3.5 h-3.5" />
            Presupuesto cerrado · {currentStatusLabel}
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="gap-1.5 bg-yellow-50 text-yellow-800 border-yellow-300 text-xs py-1 animate-pulse w-fit"
          >
            Acción requerida: Aprueba o rechaza ítems
          </Badge>
        )}
      </CardHeader>

      <CardContent className="p-0">
        {/* Vista móvil sin scroll horizontal */}
        <div className="sm:hidden divide-y divide-slate-100">
          {items.map((item) => {
            const isRejected = item.approved === false
            const qty = Number(item.quantity ?? 1)
            const price = Number(item.unit_price ?? 0)

            return (
              <div
                key={item.id}
                className={`p-4 space-y-3 ${isRejected ? 'opacity-60 bg-slate-50/60' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div
                      className={`font-semibold text-slate-800 break-words ${
                        isRejected ? 'line-through' : ''
                      }`}
                    >
                      {item.description}
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase font-bold mt-0.5">
                      {item.type === 'labor' ? 'Mano de Obra' : 'Repuesto'} · {qty} x $
                      {price.toLocaleString('es-CL')}
                    </div>
                  </div>
                  <div className="font-bold text-slate-900 whitespace-nowrap shrink-0">
                    ${(qty * price).toLocaleString('es-CL')}
                  </div>
                </div>

                <div className="flex justify-end">
                  <ItemApprovalButtons
                    trackingToken={trackingToken}
                    itemId={item.id}
                    approved={item.approved ?? null}
                    isLocked={!isWaitingApproval}
                    onStatusUpdated={handleStatusUpdated}
                  />
                </div>
              </div>
            )
          })}

          {items.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground italic">
              No se han agregado ítems al presupuesto aún.
            </div>
          )}
        </div>

        {/* Vista escritorio/tablet en tabla */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/50 text-[10px] font-bold text-muted-foreground uppercase border-b">
              <tr>
                <th className="px-4 py-2 text-left">Concepto</th>
                <th className="px-4 py-2 text-right">Cant. x Precio</th>
                <th className="px-4 py-2 text-right">Total</th>
                <th className="px-4 py-2 text-center">Estado / Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => {
                const isRejected = item.approved === false
                const qty = Number(item.quantity ?? 1)
                const price = Number(item.unit_price ?? 0)
                return (
                  <tr
                    key={item.id}
                    className={isRejected ? 'opacity-50 bg-slate-50/50' : ''}
                  >
                    <td className="px-4 py-3">
                      <div
                        className={`font-semibold text-slate-800 ${
                          isRejected ? 'line-through' : ''
                        }`}
                      >
                        {item.description}
                      </div>
                      <div className="text-[10px] text-muted-foreground uppercase font-bold">
                        {item.type === 'labor' ? 'Mano de Obra' : 'Repuesto'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600 whitespace-nowrap">
                      {qty} x ${price.toLocaleString('es-CL')}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900 whitespace-nowrap">
                      ${(qty * price).toLocaleString('es-CL')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ItemApprovalButtons
                        trackingToken={trackingToken}
                        itemId={item.id}
                        approved={item.approved ?? null}
                        isLocked={!isWaitingApproval}
                        onStatusUpdated={handleStatusUpdated}
                      />
                    </td>
                  </tr>
                )
              })}
              {items.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground italic">
                    No se han agregado ítems al presupuesto aún.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-100 bg-slate-50/80 px-4 py-2.5 text-[11px] leading-snug text-slate-600">
          Al aprobar un ítem emites una autorización electrónica válida como mensaje de datos
          (Ley 527 de 1999) con registro de fecha y hora.
        </div>

        <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
          <div>
            <span className="text-sm font-bold uppercase tracking-wider opacity-80 block">
              {isWaitingApproval ? 'Total Activo' : 'Total Aprobado'}
            </span>
            <span className="text-[11px] text-slate-400">
              Excluye ítems rechazados
            </span>
          </div>
          <span className="text-xl font-black">${total.toLocaleString('es-CL')}</span>
        </div>
      </CardContent>
    </Card>
  )
}
