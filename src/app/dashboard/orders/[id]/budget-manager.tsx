'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { addOrderItem, deleteOrderItem } from './actions'
import { Database } from '@/types/database.types'
import { Plus, Trash2, PenTool, Settings } from 'lucide-react'

type Item = Database['public']['Tables']['order_items']['Row']

export function BudgetManager({ orderId, items }: { orderId: string, items: Item[] }) {
  const [isPending, startTransition] = useTransition()
  const [description, setDescription] = useState('')
  const [type, setType] = useState<'part' | 'labor'>('part')
  const [quantity, setQuantity] = useState(1)
  const [unitPrice, setUnitPrice] = useState(0)

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      try {
        await addOrderItem(orderId, {
          description,
          type,
          quantity,
          unit_price: unitPrice
        })
        setDescription('')
        setQuantity(1)
        setUnitPrice(0)
      } catch (error) {
        console.error('Error adding item:', error)
        alert('Error al agregar el ítem')
      }
    })
  }

  const handleDelete = async (itemId: string) => {
    if (!confirm('¿Estás seguro de eliminar este ítem?')) return
    startTransition(async () => {
      try {
        await deleteOrderItem(itemId, orderId)
      } catch (error) {
        console.error('Error deleting item:', error)
        alert('Error al eliminar el ítem')
      }
    })
  }

  const total = items.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0)

  return (
    <Card className="overflow-hidden border-2">
      <CardHeader className="bg-muted/30 border-b flex flex-row items-center justify-between py-4">
        <CardTitle className="text-xl flex items-center gap-2">
          <PenTool className="w-5 h-5 text-primary" />
          Presupuesto y Repuestos
        </CardTitle>
        <div className="text-right">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Estimado</p>
          <p className="text-2xl font-black text-primary">${total.toLocaleString('es-CL')}</p>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <form onSubmit={handleAddItem} className="p-4 grid gap-4 bg-muted/10 border-b">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
             <div className="md:col-span-2 space-y-2">
                <Label htmlFor="desc" className="text-xs font-bold uppercase">Descripción del Trabajo o Repuesto</Label>
                <Input 
                  id="desc"
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder="Ej: Kit de arrastre, Cambio de aceite..." 
                  required
                  className="h-11"
                />
             </div>
             <div className="space-y-2">
                <Label htmlFor="type" className="text-xs font-bold uppercase">Tipo</Label>
                <div className="relative">
                  <select 
                    id="type"
                    value={type} 
                    onChange={(e) => setType(e.target.value as 'part' | 'labor')}
                    className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary appearance-none"
                  >
                    <option value="part">🔧 Repuesto</option>
                    <option value="labor">👨‍🔧 Mano de Obra</option>
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
                  <Label htmlFor="qty" className="text-xs font-bold uppercase">Cant.</Label>
                  <Input 
                    id="qty"
                    type="number" 
                    value={quantity} 
                    onChange={(e) => setQuantity(Number(e.target.value))} 
                    min={1}
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-xs font-bold uppercase">Precio U.</Label>
                  <Input 
                    id="price"
                    type="number" 
                    value={unitPrice} 
                    onChange={(e) => setUnitPrice(Number(e.target.value))} 
                    min={0}
                    required
                    className="h-11"
                  />
                </div>
             </div>
          </div>
          <Button type="submit" disabled={isPending} className="h-11 font-bold">
            {isPending ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Agregar al Presupuesto
          </Button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] text-muted-foreground uppercase bg-muted/30 border-b">
              <tr>
                <th className="px-6 py-3 font-bold">Concepto</th>
                <th className="px-6 py-3 font-bold text-center">Cant.</th>
                <th className="px-6 py-3 font-bold text-right">Precio</th>
                <th className="px-6 py-3 font-bold text-right">Total</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted/30">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-muted/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-slate-700">{item.description}</span>
                      <div className="flex">
                        <Badge variant={item.type === 'labor' ? 'outline' : 'secondary'} className="text-[10px] h-4 px-1.5 font-bold uppercase">
                          {item.type === 'labor' ? 'Mano de Obra' : 'Repuesto'}
                        </Badge>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center font-medium">{item.quantity}</td>
                  <td className="px-6 py-4 text-right text-muted-foreground">${item.unit_price.toLocaleString('es-CL')}</td>
                  <td className="px-6 py-4 text-right font-bold text-slate-900">${(item.quantity * item.unit_price).toLocaleString('es-CL')}</td>
                  <td className="px-6 py-4 text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(item.id)}
                      disabled={isPending}
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Settings className="w-8 h-8 opacity-20" />
                      <p className="text-sm italic font-medium">El presupuesto está vacío. Comienza agregando un ítem arriba.</p>
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
