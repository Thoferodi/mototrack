'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Bike,
  Plus,
  Search,
  Pencil,
  Trash2,
  User,
  Phone,
  History,
  ChevronDown,
  ChevronUp,
  ExternalLink,
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
import { Database } from '@/types/database.types'
import { getWorkOrderStatusLabel } from '@/lib/workorder-status'
import { createVehicle, updateVehicle, deleteVehicle } from './actions'

type OrderItemSummary = Pick<
  Database['public']['Tables']['order_items']['Row'],
  'quantity' | 'unit_price' | 'approved'
>

type WorkOrderSummary = Pick<
  Database['public']['Tables']['work_orders']['Row'],
  'id' | 'order_number' | 'status' | 'mileage_in' | 'customer_notes' | 'created_at'
> & {
  order_items?: OrderItemSummary[]
}

export type VehicleWithHistory = Database['public']['Tables']['motorcycles']['Row'] & {
  customers: Pick<
    Database['public']['Tables']['customers']['Row'],
    'id' | 'full_name' | 'phone_whatsapp'
  > | null
  work_orders: WorkOrderSummary[]
}

export type CustomerOption = Pick<
  Database['public']['Tables']['customers']['Row'],
  'id' | 'full_name' | 'phone_whatsapp'
>

function calcOrderTotal(items?: OrderItemSummary[]): number {
  if (!items || items.length === 0) return 0
  return items.reduce((acc, item) => {
    if (item.approved === false) return acc
    return acc + Number(item.quantity ?? 1) * Number(item.unit_price ?? 0)
  }, 0)
}

export function VehiclesManager({
  vehicles,
  customers,
}: {
  vehicles: VehicleWithHistory[]
  customers: CustomerOption[]
}) {
  const router = useRouter()
  const [search, setSearch] = React.useState('')
  const [expandedId, setExpandedId] = React.useState<string | null>(null)

  const [isFormOpen, setIsFormOpen] = React.useState(false)
  const [editingVehicle, setEditingVehicle] = React.useState<VehicleWithHistory | null>(null)

  const [licensePlate, setLicensePlate] = React.useState('')
  const [brand, setBrand] = React.useState('')
  const [model, setModel] = React.useState('')
  const [year, setYear] = React.useState('')
  const [customerMode, setCustomerMode] = React.useState<'existing' | 'new'>('new')
  const [selectedCustomerId, setSelectedCustomerId] = React.useState('')
  const [customerName, setCustomerName] = React.useState('')
  const [customerPhone, setCustomerPhone] = React.useState('')

  const [isSaving, setIsSaving] = React.useState(false)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)

  const openCreateForm = () => {
    setEditingVehicle(null)
    setLicensePlate('')
    setBrand('')
    setModel('')
    setYear('')
    setCustomerMode(customers.length > 0 ? 'existing' : 'new')
    setSelectedCustomerId(customers[0]?.id || '')
    setCustomerName('')
    setCustomerPhone('')
    setError(null)
    setSuccess(null)
    setIsFormOpen(true)
  }

  const openEditForm = (v: VehicleWithHistory) => {
    setEditingVehicle(v)
    setLicensePlate(v.license_plate)
    setBrand(v.brand)
    setModel(v.model)
    setYear(v.year ? String(v.year) : '')
    setCustomerMode('existing')
    setSelectedCustomerId(v.customer_id)
    setCustomerName(v.customers?.full_name || '')
    setCustomerPhone(v.customers?.phone_whatsapp || '')
    setError(null)
    setSuccess(null)
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingVehicle(null)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setIsSaving(true)

    try {
      const payload = {
        license_plate: licensePlate.replace(/\s+/g, '').toUpperCase(),
        brand: brand.trim(),
        model: model.trim(),
        year: year ? Number(year) : undefined,
        customer_id:
          editingVehicle || customerMode === 'existing' ? selectedCustomerId : undefined,
        customer_name:
          editingVehicle || customerMode === 'new' ? customerName.trim() : undefined,
        customer_phone:
          editingVehicle || customerMode === 'new' ? customerPhone.trim() : undefined,
      }

      const res = editingVehicle
        ? await updateVehicle(editingVehicle.id, payload)
        : await createVehicle(payload)

      if (!res.success) {
        setError(res.error || 'Error al guardar el vehículo.')
      } else {
        setSuccess(
          editingVehicle
            ? 'Vehículo actualizado correctamente.'
            : 'Vehículo registrado correctamente.'
        )
        closeForm()
        router.refresh()
      }
    } catch (err: any) {
      setError(err?.message || 'Error inesperado al guardar el vehículo.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (vehicleId: string) => {
    setError(null)
    setSuccess(null)
    setDeletingId(vehicleId)
    try {
      const res = await deleteVehicle(vehicleId)
      if (!res.success) {
        setError(res.error || 'No se pudo eliminar el vehículo.')
      } else {
        setConfirmDeleteId(null)
        setSuccess('Vehículo eliminado correctamente.')
        router.refresh()
      }
    } catch (err: any) {
      setError(err?.message || 'Error inesperado al eliminar.')
    } finally {
      setDeletingId(null)
    }
  }

  const filteredVehicles = vehicles.filter((v) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      v.license_plate.toLowerCase().includes(q) ||
      v.brand.toLowerCase().includes(q) ||
      v.model.toLowerCase().includes(q) ||
      (v.customers?.full_name || '').toLowerCase().includes(q) ||
      (v.customers?.phone_whatsapp || '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Historial Clínico de Vehículos</h1>
          <p className="text-muted-foreground text-sm">
            Consulta las motocicletas registradas, sus propietarios y su historial de servicio.
          </p>
        </div>
        <Button type="button" onClick={openCreateForm} className="gap-2 h-11">
          <Plus className="w-4 h-4" />
          Registrar Vehículo
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
                {editingVehicle
                  ? `Editar Moto (${editingVehicle.license_plate})`
                  : 'Registrar Nueva Motocicleta'}
              </CardTitle>
              <CardDescription>
                Completa los datos técnicos del vehículo y asócialo a un propietario.
              </CardDescription>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={closeForm} disabled={isSaving}>
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="v-plate">Placa *</Label>
                  <Input
                    id="v-plate"
                    value={licensePlate}
                    onChange={(e) => setLicensePlate(e.target.value)}
                    placeholder="ABC123"
                    className="uppercase"
                    required
                    disabled={isSaving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="v-brand">Marca *</Label>
                  <Input
                    id="v-brand"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Yamaha"
                    required
                    disabled={isSaving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="v-model">Modelo *</Label>
                  <Input
                    id="v-model"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="FZ 2.0"
                    required
                    disabled={isSaving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="v-year">Año</Label>
                  <Input
                    id="v-year"
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="2023"
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div className="pt-2 border-t space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase text-slate-500">Propietario</Label>
                  {!editingVehicle && customers.length > 0 && (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={customerMode === 'existing' ? 'default' : 'outline'}
                        onClick={() => setCustomerMode('existing')}
                        disabled={isSaving}
                        className="h-7 text-xs"
                      >
                        Cliente Existente
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={customerMode === 'new' ? 'default' : 'outline'}
                        onClick={() => setCustomerMode('new')}
                        disabled={isSaving}
                        className="h-7 text-xs"
                      >
                        Nuevo Cliente
                      </Button>
                    </div>
                  )}
                </div>

                {!editingVehicle && customerMode === 'existing' && customers.length > 0 ? (
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    disabled={isSaving}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.full_name} {c.phone_whatsapp ? `(${c.phone_whatsapp})` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="c-name">Nombre Propietario *</Label>
                      <Input
                        id="c-name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        required
                        disabled={isSaving}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="c-phone">WhatsApp / Teléfono *</Label>
                      <Input
                        id="c-phone"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="+57 300 000 0000"
                        required
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={closeForm} disabled={isSaving}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {isSaving
                    ? 'Guardando...'
                    : editingVehicle
                    ? 'Actualizar Vehículo'
                    : 'Registrar Vehículo'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Buscador */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por placa, marca, modelo o dueño..."
          className="pl-9 bg-white"
        />
      </div>

      {/* Lista de Vehículos */}
      <div className="grid grid-cols-1 gap-4">
        {filteredVehicles.map((v) => {
          const isExpanded = expandedId === v.id
          const sortedOrders = [...(v.work_orders || [])].sort(
            (a, b) =>
              new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
          )
          const isRowDeleting = deletingId === v.id

          return (
            <Card key={v.id} className="overflow-hidden">
              <CardContent className="p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Bike className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="font-mono text-sm tracking-wider">{v.license_plate}</Badge>
                        <h3 className="font-bold text-slate-900 text-lg">
                          {v.brand} {v.model} {v.year ? `(${v.year})` : ''}
                        </h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          {v.customers?.full_name || 'Sin propietario'}
                        </span>
                        {v.customers?.phone_whatsapp && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5" />
                            {v.customers.phone_whatsapp}
                          </span>
                        )}
                        <span className="flex items-center gap-1 font-semibold text-slate-700">
                          <History className="w-3.5 h-3.5" />
                          {sortedOrders.length} servicio(s)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setExpandedId(isExpanded ? null : v.id)}
                      className="gap-1.5"
                    >
                      <History className="w-4 h-4" />
                      Historial
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Editar vehículo"
                      onClick={() => openEditForm(v)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    {confirmDeleteId === v.id ? (
                      <div className="inline-flex items-center gap-1">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          disabled={isRowDeleting}
                          onClick={() => handleDelete(v.id)}
                          className="h-8 px-2.5 text-xs"
                        >
                          {isRowDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Eliminar'}
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
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Eliminar vehículo"
                        onClick={() => setConfirmDeleteId(v.id)}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Historial Clínico de Órdenes
                      </h4>
                    </div>

                    {sortedOrders.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">
                        Este vehículo aún no tiene órdenes de trabajo registradas.
                      </p>
                    ) : (
                      <div className="divide-y divide-slate-100 rounded-lg border bg-slate-50/50">
                        {sortedOrders.map((ord) => {
                          const orderTotal = calcOrderTotal(ord.order_items)
                          return (
                            <div
                              key={ord.id}
                              className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm"
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-slate-700">
                                    #{ord.order_number ?? ord.id.slice(0, 8)}
                                  </span>
                                  <Badge variant="outline" className="text-[10px]">
                                    {getWorkOrderStatusLabel(ord.status)}
                                  </Badge>
                                  {ord.created_at && (
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(ord.created_at).toLocaleDateString('es-ES')}
                                    </span>
                                  )}
                                </div>
                                {ord.customer_notes && (
                                  <p className="text-xs text-slate-600 line-clamp-1">
                                    {ord.customer_notes}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-slate-500">
                                  {ord.mileage_in?.toLocaleString() ?? 0} km
                                </span>
                                <span className="font-bold text-slate-900">
                                  ${orderTotal.toLocaleString('es-CL')}
                                </span>
                                <Button asChild variant="outline" size="sm" className="h-7 text-xs gap-1">
                                  <Link href={`/dashboard/orders/${ord.id}`}>
                                    Ver <ExternalLink className="w-3 h-3" />
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}

        {filteredVehicles.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {vehicles.length === 0
                ? 'Aún no hay vehículos registrados en este taller.'
                : 'No se encontraron vehículos que coincidan con tu búsqueda.'}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
