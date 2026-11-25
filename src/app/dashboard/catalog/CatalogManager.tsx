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
  CatalogItemType,
  createCatalogItem,
  updateCatalogItem,
  deleteCatalogItem,
} from './actions'

const DARK_INPUT_CLASS =
  'h-10 rounded-xl border-white/10 bg-[#0B0D13] text-white placeholder:text-slate-500 focus-visible:border-orange-500/60 focus-visible:ring-orange-500/30 focus-visible:ring-offset-0 [color-scheme:dark]'

export function CatalogManager({ initialItems }: { initialItems: CatalogItem[] }) {
  const [items, setItems] = React.useState<CatalogItem[]>(initialItems)
  const [search, setSearch] = React.useState('')
  const [typeFilter, setTypeFilter] = React.useState<'all' | CatalogItemType>('all')

  const [isFormOpen, setIsFormOpen] = React.useState(false)
  const [editingItem, setEditingItem] = React.useState<CatalogItem | null>(null)

  const [name, setName] = React.useState('')
  const [type, setType] = React.useState<CatalogItemType>('spare_part')
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
    setType('spare_part')
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
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Catálogo de Repuestos y Mano de Obra
          </h1>
          <p className="text-slate-400 text-sm">
            Administra tus ítems frecuentes para agilizar la creación de presupuestos.
          </p>
        </div>
        <Button
          type="button"
          onClick={openCreateForm}
          className="gap-2 h-11 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold shadow-[0_0_24px_rgba(249,115,22,0.28)] border border-orange-400/50"
        >
          <Plus className="w-4 h-4" />
          Nuevo Ítem
        </Button>
      </div>

      {error && (
        <div
          role="alert"
          className="bg-rose-500/10 border border-rose-500/30 text-rose-200 text-sm p-4 rounded-xl flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-sm p-4 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          <span className="font-medium">{success}</span>
        </div>
      )}

      {isFormOpen && (
        <Card className="rounded-2xl border border-orange-500/35 bg-[#101218] text-slate-100 shadow-[0_24px_60px_rgba(0,0,0,0.65)]">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-white/[0.07]">
            <div>
              <CardTitle className="text-lg text-white">
                {editingItem ? 'Editar Ítem del Catálogo' : 'Nuevo Ítem de Catálogo'}
              </CardTitle>
              <CardDescription className="text-slate-400">
                Define el precio base que se sugerirá al armar un presupuesto.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={closeForm}
              disabled={isSaving}
              className="rounded-xl text-slate-400 hover:bg-white/[0.06] hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="pt-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="cat-name" className="text-xs font-semibold text-slate-300">
                    Nombre / Descripción *
                  </Label>
                  <Input
                    id="cat-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Cambio de aceite 10W40, Kit de arrastre..."
                    className={DARK_INPUT_CLASS}
                    required
                    disabled={isSaving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cat-type" className="text-xs font-semibold text-slate-300">
                    Tipo *
                  </Label>
                  <select
                    id="cat-type"
                    value={type}
                    onChange={(e) => setType(e.target.value as CatalogItemType)}
                    disabled={isSaving}
                    className="flex h-10 w-full rounded-xl border border-white/10 bg-[#0B0D13] px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/25 [color-scheme:dark]"
                  >
                    <option value="spare_part" className="bg-[#101218] text-white">
                      Repuesto
                    </option>
                    <option value="labor" className="bg-[#101218] text-white">
                      Mano de Obra
                    </option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cat-price" className="text-xs font-semibold text-slate-300">
                    Precio Base *
                  </Label>
                  <Input
                    id="cat-price"
                    type="number"
                    min={0}
                    step="1"
                    value={defaultPrice}
                    onChange={(e) => setDefaultPrice(e.target.value)}
                    className={`${DARK_INPUT_CLASS} font-mono`}
                    required
                    disabled={isSaving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cat-sku" className="text-xs font-semibold text-slate-300">
                    Referencia / SKU (Opcional)
                  </Label>
                  <Input
                    id="cat-sku"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="Ej. REP-001"
                    className={`${DARK_INPUT_CLASS} font-mono`}
                    disabled={isSaving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cat-notes" className="text-xs font-semibold text-slate-300">
                    Notas (Opcional)
                  </Label>
                  <Input
                    id="cat-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Marca, compatibilidad..."
                    className={DARK_INPUT_CLASS}
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeForm}
                  disabled={isSaving}
                  className="rounded-xl border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.08] hover:text-white"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold"
                >
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
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, SKU o nota..."
            className="h-10 pl-10 rounded-xl bg-[#101218] border-white/10 text-white placeholder:text-slate-500 focus-visible:border-orange-500/60 focus-visible:ring-orange-500/30 focus-visible:ring-offset-0 [color-scheme:dark]"
          />
        </div>

        <div className="inline-flex items-center gap-1 bg-[#101218] border border-white/10 p-1 rounded-xl self-start sm:self-auto">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setTypeFilter('all')}
            className={
              typeFilter === 'all'
                ? 'h-8 rounded-lg bg-orange-500/15 text-orange-300 border border-orange-500/30 hover:bg-orange-500/20 hover:text-orange-200 text-xs font-semibold'
                : 'h-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.04] text-xs font-semibold border border-transparent'
            }
          >
            Todos ({items.length})
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setTypeFilter('spare_part')}
            className={
              typeFilter === 'spare_part'
                ? 'h-8 rounded-lg bg-orange-500/15 text-orange-300 border border-orange-500/30 hover:bg-orange-500/20 hover:text-orange-200 text-xs font-semibold'
                : 'h-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.04] text-xs font-semibold border border-transparent'
            }
          >
            Repuestos
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setTypeFilter('labor')}
            className={
              typeFilter === 'labor'
                ? 'h-8 rounded-lg bg-orange-500/15 text-orange-300 border border-orange-500/30 hover:bg-orange-500/20 hover:text-orange-200 text-xs font-semibold'
                : 'h-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.04] text-xs font-semibold border border-transparent'
            }
          >
            Mano de Obra
          </Button>
        </div>
      </div>

      {/* Tabla */}
      <Card className="rounded-2xl border border-white/10 bg-[#101218] text-slate-100 shadow-none overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto [color-scheme:dark] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-[#0B0D12] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/15 hover:[&::-webkit-scrollbar-thumb]:bg-orange-500/40">
            <table className="w-full text-sm text-left">
              <thead className="text-[11px] text-slate-400 uppercase tracking-wider bg-[#0B0D13] border-b border-white/10">
                <tr>
                  <th className="px-6 py-3.5 font-bold">Ítem</th>
                  <th className="px-4 py-3.5 font-bold">Tipo</th>
                  <th className="px-4 py-3.5 font-bold">SKU</th>
                  <th className="px-4 py-3.5 font-bold text-right">Precio Base</th>
                  <th className="px-6 py-3.5 font-bold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {filteredItems.map((item) => {
                  const isRowDeleting = deletingId === item.id
                  return (
                    <tr key={item.id} className="transition-colors hover:bg-white/[0.03]">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white">{item.name}</div>
                        {item.notes && <div className="text-xs text-slate-400 mt-0.5">{item.notes}</div>}
                      </td>
                      <td className="px-4 py-4">
                        <Badge
                          variant="outline"
                          className={
                            item.type === 'labor'
                              ? 'gap-1.5 text-xs border-sky-500/30 bg-sky-500/15 text-sky-300'
                              : 'gap-1.5 text-xs border-orange-500/30 bg-orange-500/15 text-orange-300'
                          }
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
                      <td className="px-4 py-4 font-mono text-xs text-slate-400">
                        {item.sku || '—'}
                      </td>
                      <td className="px-4 py-4 text-right font-mono font-bold text-white">
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
                              className="h-8 rounded-lg px-2.5 text-xs bg-rose-600 hover:bg-rose-500 text-white"
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
                              className="h-8 rounded-lg px-2 text-xs text-slate-300 hover:bg-white/[0.06] hover:text-white"
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
                              className="h-8 w-8 rounded-lg text-slate-400 hover:bg-white/[0.06] hover:text-orange-300"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label="Eliminar ítem"
                              onClick={() => setConfirmDeleteId(item.id)}
                              className="h-8 w-8 rounded-lg text-rose-400 hover:bg-rose-500/15 hover:text-rose-300"
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
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
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
