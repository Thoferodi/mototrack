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

export interface CatalogTemplateItem {
  id: string
  name: string
  type: 'part' | 'labor'
  default_price: number
}

const ITEM_STATUS_CONFIG: Record<string, { label: string; className: string; icon: any }> = {
  approved: {
    label: 'Aprobado',
    className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icon: Check,
  },
  rejected: {
    label: 'Rechazado',
    className: 'bg-red-100 text-red-800 border-red-200',
    icon: X,
  },
  pending: {
    label: 'Pendiente',
    className: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: Clock,
  },
}

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
  const [type, setType] = useState<'part' | 'labor'>('part')
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

  const totalActive = items.reduce(
    (acc, item) => (item.status === 'rejected' ? acc : acc + item.quantity * item.unit_price),
    0
  )

  return (
    <Card className="overflow-hidden border-2">
      <CardHeader className="bg-muted/30 border-b flex flex-row items-center justify-between py-4">
        <CardTitle className="text-xl flex items-center gap-2">
          <PenTool className="w-5 h-5 text-primary" />
          Presupuesto y Repuestos
        </CardTitle>
        <div className="text-right">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Total Activo
          </p>
          <p className="text-2xl font-black text-primary">${totalActive.toLocaleString('es-CL')}</p>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <form onSubmit={handleAddItem} className="p-4 grid gap-4 bg-muted/10 border-b">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs p-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {catalogItems.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="catalog-quick" className="text-xs font-bold uppercase text-slate-500">
                Cargar desde Catálogo (Opcional)
              </Label>
              <select
                id="catalog-quick"
                defaultValue=""
                disabled={isAdding}
                onChange={(e) => {
                  handleSelectCatalog(e.target.value)
                  e.target.value = ''
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">-- Seleccionar repuesto o servicio del catálogo --</option>
                {catalogItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.type === 'labor' ? 'Mano de Obra' : 'Repuesto'}) - $
                    {item.default_price.toLocaleString('es-CL')}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="desc" className="text-xs font-bold uppercase">
                Descripción del Trabajo o Repuesto
              </Label>
              <Input
                id="desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej: Kit de arrastre, Cambio de aceite..."
                required
                disabled={isAdding}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type" className="text-xs font-bold uppercase">
                Tipo
              </Label>
              <div className="relative">
                <select
                  id="type"
                  value={type}
                  disabled={isAdding}
                  onChange={(e) => setType(e.target.value as 'part' | 'labor')}
                  className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary appearance-none"
                >
                  <option value="part">Repuesto</option>
                  <option value="labor">Mano de Obra</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="qty" className="text-xs font-bold uppercase">
                  Cant.
                </Label>
                <Input
                  id="qty"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                  min={1}
                  required
                  disabled={isAdding}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price" className="text-xs font-bold uppercase">
                  Precio U.
                </Label>
                <Input
                  id="price"
                  type="number"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(Math.max(0, Number(e.target.value) || 0))}
                  min={0}
                  required
                  disabled={isAdding}
                  className="h-11"
                />
              </div>
            </div>
          </div>
          <Button type="submit" disabled={isAdding} className="h-11 font-bold">
            {isAdding ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            {isAdding ? 'Agregando...' : 'Agregar al Presupuesto'}
          </Button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] text-muted-foreground uppercase bg-muted/30 border-b">
              <tr>
                <th className="px-6 py-3 font-bold">Concepto</th>
                <th className="px-4 py-3 font-bold text-center">Estado</th>
                <th className="px-4 py-3 font-bold text-center">Cant.</th>
                <th className="px-4 py-3 font-bold text-right">Precio</th>
                <th className="px-4 py-3 font-bold text-right">Total</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted/30">
              {items.map((item) => {
                const statusCfg = ITEM_STATUS_CONFIG[item.status] || ITEM_STATUS_CONFIG.pending
                const StatusIcon = statusCfg.icon
                const isRejected = item.status === 'rejected'
                const isRowDeleting = deletingId === item.id

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-muted/5 transition-colors ${isRejected ? 'opacity-55 bg-slate-50/60' : ''}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`font-bold text-slate-700 ${isRejected ? 'line-through' : ''}`}>
                          {item.description}
                        </span>
                        <div className="flex">
                          <Badge
                            variant={item.type === 'labor' ? 'outline' : 'secondary'}
                            className="text-[10px] h-4 px-1.5 font-bold uppercase"
                          >
                            {item.type === 'labor' ? 'Mano de Obra' : 'Repuesto'}
                          </Badge>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <Badge variant="outline" className={`text-[10px] gap-1 ${statusCfg.className}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusCfg.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-center font-medium">{item.quantity}</td>
                    <td className="px-4 py-4 text-right text-muted-foreground">
                      ${item.unit_price.toLocaleString('es-CL')}
                    </td>
                    <td className="px-4 py-4 text-right font-bold text-slate-900">
                      ${(item.quantity * item.unit_price).toLocaleString('es-CL')}
                    </td>
                    <td className="px-4 py-4 text-right">
                      {confirmDeleteId === item.id ? (
                        <div className="inline-flex items-center gap-1">
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            disabled={isRowDeleting}
                            onClick={() => handleDelete(item.id)}
                            className="h-7 px-2 text-xs"
                          >
                            {isRowDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirmar'}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={isRowDeleting}
                            onClick={() => setConfirmDeleteId(null)}
                            className="h-7 px-2 text-xs"
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
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
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
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Settings className="w-8 h-8 opacity-20" />
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
