'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { addOrderItem, deleteOrderItem } from './actions'
import { Database } from '@/types/database.types'
import { Plus, Trash2, PenTool, Settings, Loader2, AlertCircle, Check, X, Clock } from 'lucide-react'

type Item = Database['public']['Tables']['order_items']['Row']
type ItemType = Database['public']['Enums']['item_type']

export interface CatalogTemplateItem {
  id: string
  name: string
  type: ItemType
  default_price: number
}

function getApprovalConfig(approved: boolean | null) {
  if (approved === true) {
    return {
      key: 'approved',
      label: 'Aprobado',
      className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      icon: Check,
    }
  }
  if (approved === false) {
    return {
      key: 'rejected',
      label: 'Rechazado',
      className: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
      icon: X,
    }
  }
  return {
    key: 'pending',
    label: 'Pendiente',
    className: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    icon: Clock,
  }
}

const DARK_INPUT_CLASS =
  'h-11 rounded-xl border-white/10 bg-[#0B0D13] text-white placeholder:text-slate-500 focus-visible:border-orange-500/60 focus-visible:ring-orange-500/30 focus-visible:ring-offset-0 [color-scheme:dark]'

export function BudgetManager({
  orderId,
  items,
  catalogItems = [],
}: {
  orderId: string
  items: Item[]
  catalogItems?: CatalogTemplateItem[]
}) {
  const [isAdding, setIsAdding] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [description, setDescription] = useState('')
  const [type, setType] = useState<ItemType>('spare_part')
  const [quantity, setQuantity] = useState(1)
  const [unitPrice, setUnitPrice] = useState(0)

  const handleSelectCatalog = (catalogId: string) => {
    const found = catalogItems.find((c) => c.id === catalogId)
    if (!found) return
    setDescription(found.name)
    setType(found.type)
    setUnitPrice(found.default_price)
  }

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!description.trim()) {
      setError('La descripción del trabajo o repuesto es requerida.')
      return
    }

    setIsAdding(true)
    try {
      await addOrderItem(orderId, {
        description: description.trim(),
        type,
        quantity,
        unit_price: unitPrice,
      })
      setDescription('')
      setQuantity(1)
      setUnitPrice(0)
    } catch (err: any) {
      console.error('Error adding item:', err)
      setError(err?.message || 'Error al agregar el ítem al presupuesto.')
    } finally {
      setIsAdding(false)
    }
  }

  const handleDelete = async (itemId: string) => {
    setError(null)
    setDeletingId(itemId)
    try {
      await deleteOrderItem(itemId, orderId)
      setConfirmDeleteId(null)
    } catch (err: any) {
      console.error('Error deleting item:', err)
      setError(err?.message || 'Error al eliminar el ítem.')
    } finally {
      setDeletingId(null)
    }
  }

  const totalActive = items.reduce((acc, item) => {
    if (item.approved === false) return acc
    return acc + Number(item.quantity ?? 1) * Number(item.unit_price ?? 0)
  }, 0)

  return (
    <Card className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#101218] text-slate-100 shadow-none">
      <CardHeader className="bg-[#0B0D13] border-b border-white/10 flex flex-row items-center justify-between gap-4 py-4">
        <CardTitle className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
          <PenTool className="w-5 h-5 text-orange-400 shrink-0" />
          Presupuesto y Repuestos
        </CardTitle>
        <div className="text-right shrink-0">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Activo
          </p>
          <p className="text-2xl font-mono font-black tabular-nums text-orange-400">
            ${totalActive.toLocaleString('es-CL')}
          </p>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <form onSubmit={handleAddItem} className="p-4 sm:p-5 grid gap-4 bg-[#0B0D13]/50 border-b border-white/10">
          {error && (
            <div
              role="alert"
              className="bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs p-3 rounded-xl flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {catalogItems.length > 0 && (
            <div className="space-y-1.5">
              <Label
                htmlFor="catalog-quick"
                className="text-[11px] font-bold uppercase tracking-wider text-slate-400"
              >
                Cargar desde Historial del Taller (Opcional)
              </Label>
              <select
                id="catalog-quick"
                defaultValue=""
                disabled={isAdding}
                onChange={(e) => {
                  handleSelectCatalog(e.target.value)
                  e.target.value = ''
                }}
                className="flex h-10 w-full rounded-xl border border-white/10 bg-[#0B0D13] px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/25 [color-scheme:dark]"
              >
                <option value="" className="bg-[#101218] text-slate-400">
                  -- Seleccionar repuesto o servicio frecuente --
                </option>
                {catalogItems.map((item) => (
                  <option key={item.id} value={item.id} className="bg-[#101218] text-white">
                    {item.name} ({item.type === 'labor' ? 'Mano de Obra' : 'Repuesto'}) - $
                    {item.default_price.toLocaleString('es-CL')}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
            <div className="sm:col-span-4 space-y-1.5">
              <Label htmlFor="desc" className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Descripción del Trabajo o Repuesto
              </Label>
              <Input
                id="desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej: Kit de arrastre, Cambio de aceite..."
                required
                disabled={isAdding}
                className={DARK_INPUT_CLASS}
              />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="type" className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Tipo
              </Label>
              <select
                id="type"
                value={type}
                disabled={isAdding}
                onChange={(e) => setType(e.target.value as ItemType)}
                className="flex h-11 w-full rounded-xl border border-white/10 bg-[#0B0D13] px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/25 [color-scheme:dark]"
              >
                <option value="spare_part" className="bg-[#101218] text-white">
                  Repuesto
                </option>
                <option value="labor" className="bg-[#101218] text-white">
                  Mano de Obra
                </option>
              </select>
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="qty" className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Cantidad
              </Label>
              <Input
                id="qty"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                min={1}
                required
                disabled={isAdding}
                className={`${DARK_INPUT_CLASS} font-mono tabular-nums`}
              />
            </div>
            <div className="sm:col-span-4 space-y-1.5">
              <Label htmlFor="price" className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Precio Unitario
              </Label>
              <Input
                id="price"
                type="number"
                value={unitPrice}
                onChange={(e) => setUnitPrice(Math.max(0, Number(e.target.value) || 0))}
                min={0}
                required
                disabled={isAdding}
                className={`${DARK_INPUT_CLASS} font-mono tabular-nums`}
              />
            </div>
          </div>
          <Button
            type="submit"
            disabled={isAdding}
            className="h-11 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold shadow-[0_0_20px_rgba(249,115,22,0.25)]"
          >
            {isAdding ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            {isAdding ? 'Agregando...' : 'Agregar al Presupuesto'}
          </Button>
        </form>

        <div className="overflow-x-auto [color-scheme:dark] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-[#0B0D12] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/15 hover:[&::-webkit-scrollbar-thumb]:bg-orange-500/40">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] text-slate-400 uppercase tracking-wider bg-[#0B0D13] border-b border-white/10">
              <tr>
                <th className="px-4 py-3 font-bold">Concepto</th>
                <th className="px-2 py-3 font-bold text-center">Estado</th>
                <th className="px-2 py-3 font-bold text-center">Cant.</th>
                <th className="px-3 py-3 font-bold text-right">Precio</th>
                <th className="px-3 py-3 font-bold text-right">Total</th>
                <th className="px-2 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {items.map((item) => {
                const statusCfg = getApprovalConfig(item.approved)
                const StatusIcon = statusCfg.icon
                const isRejected = item.approved === false
                const isRowDeleting = deletingId === item.id
                const qty = Number(item.quantity ?? 1)
                const price = Number(item.unit_price ?? 0)

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-white/[0.03] transition-colors ${
                      isRejected ? 'opacity-60 bg-white/[0.02]' : ''
                    }`}
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col gap-1">
                        <span className={`font-bold text-white ${isRejected ? 'line-through text-slate-400' : ''}`}>
                          {item.description}
                        </span>
                        <div className="flex">
                          <Badge
                            variant="outline"
                            className={
                              item.type === 'labor'
                                ? 'text-[10px] min-h-4 px-1.5 py-0.5 whitespace-nowrap font-bold uppercase border-sky-500/30 bg-sky-500/15 text-sky-300'
                                : 'text-[10px] min-h-4 px-1.5 py-0.5 whitespace-nowrap font-bold uppercase border-orange-500/30 bg-orange-500/15 text-orange-300'
                            }
                          >
                            {item.type === 'labor' ? 'Mano de Obra' : 'Repuesto'}
                          </Badge>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3.5 text-center">
                      <Badge variant="outline" className={`text-[10px] gap-1 ${statusCfg.className}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusCfg.label}
                      </Badge>
                    </td>
                    <td className="px-2 py-3.5 text-center font-mono tabular-nums font-medium text-slate-200">
                      {qty}
                    </td>
                    <td className="px-3 py-3.5 text-right font-mono tabular-nums text-slate-400 whitespace-nowrap">
                      ${price.toLocaleString('es-CL')}
                    </td>
                    <td className="px-3 py-3.5 text-right font-mono tabular-nums font-bold text-white whitespace-nowrap">
                      ${(qty * price).toLocaleString('es-CL')}
                    </td>
                    <td className="px-2 py-3.5 text-right">
                      {confirmDeleteId === item.id ? (
                        <div className="inline-flex items-center gap-1">
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            disabled={isRowDeleting}
                            onClick={() => handleDelete(item.id)}
                            className="h-7 rounded-lg px-2 text-xs bg-rose-600 hover:bg-rose-500 text-white"
                          >
                            {isRowDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirmar'}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={isRowDeleting}
                            onClick={() => setConfirmDeleteId(null)}
                            className="h-7 rounded-lg px-2 text-xs text-slate-300 hover:bg-white/[0.06] hover:text-white"
                          >
                            No
                          </Button>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="Eliminar ítem"
                          onClick={() => setConfirmDeleteId(item.id)}
                          disabled={isAdding || Boolean(deletingId)}
                          className="h-8 w-8 rounded-lg text-rose-400 hover:bg-rose-500/15 hover:text-rose-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Settings className="w-8 h-8 text-slate-600" />
                      <p className="text-sm italic font-medium">
                        El presupuesto está vacío. Comienza agregando un ítem arriba.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
