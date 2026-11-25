'use client'

import * as React from 'react'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Package,
  Wrench,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  CatalogItem,
  createCatalogItem,
  updateCatalogItem,
  deleteCatalogItem,
} from './actions'

export function CatalogManager({ initialItems }: { initialItems: CatalogItem[] }) {
  const [items, setItems] = React.useState<CatalogItem[]>(initialItems)
  const [search, setSearch] = React.useState('')
  const [typeFilter, setTypeFilter] = React.useState<'all' | 'part' | 'labor'>('all')

  const [isFormOpen, setIsFormOpen] = React.useState(false)
  const [editingItem, setEditingItem] = React.useState<CatalogItem | null>(null)

  const [name, setName] = React.useState('')
  const [type, setType] = React.useState<'part' | 'labor'>('part')
  const [defaultPrice, setDefaultPrice] = React.useState('0')
  const [sku, setSku] = React.useState('')
  const [notes, setNotes] = React.useState('')

  const [isSaving, setIsSaving] = React.useState(false)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)

  React.useEffect(() => {
    setItems(initialItems)
  }, [initialItems])

  const openCreateForm = () => {
    setEditingItem(null)
    setName('')
    setType('part')
    setDefaultPrice('0')
    setSku('')
    setNotes('')
    setError(null)
    setSuccess(null)
    setIsFormOpen(true)
  }

  const openEditForm = (item: CatalogItem) => {
    setEditingItem(item)
    setName(item.name)
    setType(item.type)
    setDefaultPrice(String(item.default_price))
    setSku(item.sku || '')
    setNotes(item.notes || '')
    setError(null)
    setSuccess(null)
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingItem(null)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!name.trim()) {
      setError('El nombre del repuesto o servicio es requerido.')
      return
    }

    const numericPrice = Number(defaultPrice)
    if (Number.isNaN(numericPrice) || numericPrice < 0) {
      setError('Ingresa un precio válido mayor o igual a 0.')
      return
    }

    setIsSaving(true)
    try {
      if (editingItem) {
        const res = await updateCatalogItem(editingItem.id, {
          name: name.trim(),
          type,
          default_price: numericPrice,
          sku: sku.trim(),
          notes: notes.trim(),
        })
        if (!res.success) {
          setError(res.error || 'Error al actualizar el ítem.')
        } else {
          setItems((prev) =>
            prev.map((it) =>
              it.id === editingItem.id
                ? {
                    ...it,
                    name: name.trim(),
                    type,
                    default_price: numericPrice,
                    sku: sku.trim(),
                    notes: notes.trim(),
                  }
                : it
            )
          )
          setSuccess('Ítem actualizado correctamente.')
          closeForm()
        }
      } else {
        const res = await createCatalogItem({
          name: name.trim(),
          type,
          default_price: numericPrice,
          sku: sku.trim(),
          notes: notes.trim(),
        })
        if (!res.success || !res.item) {
          setError(res.error || 'Error al crear el ítem.')
        } else {
          setItems((prev) => [res.item!, ...prev])
          setSuccess('Ítem agregado al catálogo.')
          closeForm()
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Error inesperado al guardar.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (itemId: string) => {
    setError(null)
    setSuccess(null)
    setDeletingId(itemId)
    try {
      const res = await deleteCatalogItem(itemId)
      if (!res.success) {
        setError(res.error || 'Error al eliminar el ítem.')
      } else {
        setItems((prev) => prev.filter((it) => it.id !== itemId))
        setConfirmDeleteId(null)
        setSuccess('Ítem eliminado del catálogo.')
      }
    } catch (err: any) {
      setError(err?.message || 'Error inesperado al eliminar.')
    } finally {
      setDeletingId(null)
    }
  }

  const filteredItems = items.filter((item) => {
    if (typeFilter !== 'all' && item.type !== typeFilter) return false
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      item.name.toLowerCase().includes(q) ||
      (item.sku || '').toLowerCase().includes(q) ||
      (item.notes || '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Catálogo de Repuestos y Mano de Obra</h1>
          <p className="text-muted-foreground text-sm">
            Administra tus ítems frecuentes para agilizar la creación de presupuestos.
          </p>
        </div>
        <Button type="button" onClick={openCreateForm} className="gap-2 h-11">
          <Plus className="w-4 h-4" />
          Nuevo Ítem
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm p-4 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          <span className="font-medium">{success}</span>
        </div>
      )}

      {isFormOpen && (
        <Card className="border-2 border-primary/20 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-lg">
                {editingItem ? 'Editar Ítem del Catálogo' : 'Nuevo Ítem de Catálogo'}
              </CardTitle>
              <CardDescription>
                Define el precio base que se sugerirá al armar un presupuesto.
              </CardDescription>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={closeForm} disabled={isSaving}>
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="cat-name">Nombre / Descripción *</Label>
                  <Input
                    id="cat-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Cambio de aceite 10W40, Kit de arrastre..."
                    required
                    disabled={isSaving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cat-type">Tipo *</Label>
                  <select
                    id="cat-type"
                    value={type}
                    onChange={(e) => setType(e.target.value as 'part' | 'labor')}
                    disabled={isSaving}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="part">Repuesto</option>
                    <option value="labor">Mano de Obra</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cat-price">Precio Base *</Label>
                  <Input
                    id="cat-price"
                    type="number"
                    min={0}
                    step="1"
                    value={defaultPrice}
                    onChange={(e) => setDefaultPrice(e.target.value)}
                    required
                    disabled={isSaving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cat-sku">Referencia / SKU (Opcional)</Label>
                  <Input
                    id="cat-sku"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="Ej. REP-001"
                    disabled={isSaving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cat-notes">Notas (Opcional)</Label>
                  <Input
                    id="cat-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Marca, compatibilidad..."
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={closeForm} disabled={isSaving}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {isSaving ? 'Guardando...' : editingItem ? 'Guardar Cambios' : 'Agregar Ítem'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, SKU o nota..."
            className="pl-9 bg-white"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start sm:self-auto">
          <Button
            type="button"
            variant={typeFilter === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTypeFilter('all')}
          >
            Todos ({items.length})
          </Button>
          <Button
            type="button"
            variant={typeFilter === 'part' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTypeFilter('part')}
          >
            Repuestos
          </Button>
          <Button
            type="button"
            variant={typeFilter === 'labor' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTypeFilter('labor')}
          >
            Mano de Obra
          </Button>
        </div>
      </div>

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[11px] text-muted-foreground uppercase bg-slate-50 border-b">
                <tr>
                  <th className="px-6 py-3 font-bold">Ítem</th>
                  <th className="px-4 py-3 font-bold">Tipo</th>
                  <th className="px-4 py-3 font-bold">SKU</th>
                  <th className="px-4 py-3 font-bold text-right">Precio Base</th>
                  <th className="px-6 py-3 font-bold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => {
                  const isRowDeleting = deletingId === item.id
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{item.name}</div>
                        {item.notes && (
                          <div className="text-xs text-muted-foreground">{item.notes}</div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <Badge
                          variant={item.type === 'labor' ? 'outline' : 'secondary'}
                          className="gap-1 text-xs"
                        >
                          {item.type === 'labor' ? (
                            <>
                              <Wrench className="w-3 h-3" /> Mano de Obra
                            </>
                          ) : (
                            <>
                              <Package className="w-3 h-3" /> Repuesto
                            </>
                          )}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 font-mono text-xs text-slate-500">
                        {item.sku || '—'}
                      </td>
                      <td className="px-4 py-4 text-right font-bold text-slate-900">
                        ${item.default_price.toLocaleString('es-CL')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {confirmDeleteId === item.id ? (
                          <div className="inline-flex items-center gap-1">
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              disabled={isRowDeleting}
                              onClick={() => handleDelete(item.id)}
                              className="h-8 px-2.5 text-xs"
                            >
                              {isRowDeleting ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                'Eliminar'
                              )}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={isRowDeleting}
                              onClick={() => setConfirmDeleteId(null)}
                              className="h-8 px-2 text-xs"
                            >
                              No
                            </Button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label="Editar ítem"
                              onClick={() => openEditForm(item)}
                              className="h-8 w-8 text-slate-600 hover:text-primary"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label="Eliminar ítem"
                              onClick={() => setConfirmDeleteId(item.id)}
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}

                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      {items.length === 0
                        ? 'Aún no tienes ítems en tu catálogo. Crea el primero con "Nuevo Ítem".'
                        : 'No se encontraron ítems que coincidan con tu búsqueda.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
