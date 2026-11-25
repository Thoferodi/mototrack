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

const DARK_INPUT_CLASS =
  'h-10 rounded-xl border-white/10 bg-[#0B0D13] text-white placeholder:text-slate-500 focus-visible:border-orange-500/60 focus-visible:ring-orange-500/30 focus-visible:ring-offset-0 [color-scheme:dark]'

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
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Historial Clínico de Vehículos
          </h1>
          <p className="text-slate-400 text-sm">
            Consulta las motocicletas registradas, sus propietarios y su historial de servicio.
          </p>
        </div>
        <Button
          type="button"
          onClick={openCreateForm}
          className="gap-2 h-11 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold shadow-[0_0_24px_rgba(249,115,22,0.28)] border border-orange-400/50"
        >
          <Plus className="w-4 h-4" />
          Registrar Vehículo
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
                {editingVehicle
                  ? `Editar Moto (${editingVehicle.license_plate})`
                  : 'Registrar Nueva Motocicleta'}
              </CardTitle>
              <CardDescription className="text-slate-400">
                Completa los datos técnicos del vehículo y asócialo a un propietario.
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
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="v-plate" className="text-xs font-semibold text-slate-300">
                    Placa *
                  </Label>
                  <Input
                    id="v-plate"
                    value={licensePlate}
                    onChange={(e) => setLicensePlate(e.target.value)}
                    placeholder="ABC123"
                    className={`${DARK_INPUT_CLASS} uppercase font-mono`}
                    required
                    disabled={isSaving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="v-brand" className="text-xs font-semibold text-slate-300">
                    Marca *
                  </Label>
                  <Input
                    id="v-brand"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Yamaha"
                    className={DARK_INPUT_CLASS}
                    required
                    disabled={isSaving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="v-model" className="text-xs font-semibold text-slate-300">
                    Modelo *
                  </Label>
                  <Input
                    id="v-model"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="FZ 2.0"
                    className={DARK_INPUT_CLASS}
                    required
                    disabled={isSaving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="v-year" className="text-xs font-semibold text-slate-300">
                    Año
                  </Label>
                  <Input
                    id="v-year"
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="2023"
                    className={DARK_INPUT_CLASS}
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Propietario
                  </Label>
                  {!editingVehicle && customers.length > 0 && (
                    <div className="inline-flex gap-1 rounded-xl border border-white/10 bg-[#0B0D13] p-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setCustomerMode('existing')}
                        disabled={isSaving}
                        className={
                          customerMode === 'existing'
                            ? 'h-7 rounded-lg bg-orange-500/15 text-orange-300 border border-orange-500/30 hover:bg-orange-500/20 hover:text-orange-200 text-xs font-semibold'
                            : 'h-7 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.04] text-xs font-semibold border border-transparent'
                        }
                      >
                        Cliente Existente
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setCustomerMode('new')}
                        disabled={isSaving}
                        className={
                          customerMode === 'new'
                            ? 'h-7 rounded-lg bg-orange-500/15 text-orange-300 border border-orange-500/30 hover:bg-orange-500/20 hover:text-orange-200 text-xs font-semibold'
                            : 'h-7 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.04] text-xs font-semibold border border-transparent'
                        }
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
                    className="flex h-10 w-full rounded-xl border border-white/10 bg-[#0B0D13] px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/25 [color-scheme:dark]"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id} className="bg-[#101218] text-white">
                        {c.full_name} {c.phone_whatsapp ? `(${c.phone_whatsapp})` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="c-name" className="text-xs font-semibold text-slate-300">
                        Nombre Propietario *
                      </Label>
                      <Input
                        id="c-name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className={DARK_INPUT_CLASS}
                        required
                        disabled={isSaving}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="c-phone" className="text-xs font-semibold text-slate-300">
                        WhatsApp / Teléfono *
                      </Label>
                      <Input
                        id="c-phone"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="+57 300 000 0000"
                        className={DARK_INPUT_CLASS}
                        required
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                )}
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
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por placa, marca, modelo o dueño..."
          className="h-10 pl-10 rounded-xl bg-[#101218] border-white/10 text-white placeholder:text-slate-500 focus-visible:border-orange-500/60 focus-visible:ring-orange-500/30 focus-visible:ring-offset-0 [color-scheme:dark]"
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
            <Card
              key={v.id}
              className="overflow-hidden rounded-2xl border border-white/10 bg-[#101218] text-slate-100 shadow-none transition-colors hover:border-orange-500/35"
            >
              <CardContent className="p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                      <Bike className="w-6 h-6" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <Badge
                          variant="outline"
                          className="font-mono text-sm font-bold tracking-wider rounded-lg border-orange-500/30 bg-orange-500/15 text-orange-300"
                        >
                          {v.license_plate}
                        </Badge>
                        <h3 className="font-bold text-white text-lg">
                          {v.brand} {v.model} {v.year ? `(${v.year})` : ''}
                        </h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          {v.customers?.full_name || 'Sin propietario'}
                        </span>
                        {v.customers?.phone_whatsapp && (
                          <span className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-500" />
                            {v.customers.phone_whatsapp}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5 font-semibold text-slate-200">
                          <History className="w-3.5 h-3.5 text-orange-400" />
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
                      className="gap-1.5 rounded-xl border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08] hover:text-white hover:border-orange-500/35"
                    >
                      <History className="w-4 h-4 text-orange-400" />
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
                      className="rounded-xl text-slate-400 hover:bg-white/[0.06] hover:text-orange-300"
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
                          className="h-8 rounded-lg px-2.5 text-xs bg-rose-600 hover:bg-rose-500 text-white"
                        >
                          {isRowDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Eliminar'}
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
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Eliminar vehículo"
                        onClick={() => setConfirmDeleteId(v.id)}
                        className="rounded-xl text-rose-400 hover:bg-rose-500/15 hover:text-rose-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Historial Clínico de Órdenes
                      </h4>
                    </div>

                    {sortedOrders.length === 0 ? (
                      <p className="text-sm text-slate-500 italic">
                        Este vehículo aún no tiene órdenes de trabajo registradas.
                      </p>
                    ) : (
                      <div className="divide-y divide-white/[0.07] rounded-xl border border-white/10 bg-[#0B0D13]">
                        {sortedOrders.map((ord) => {
                          const orderTotal = calcOrderTotal(ord.order_items)
                          return (
                            <div
                              key={ord.id}
                              className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm"
                            >
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-mono font-bold text-white">
                                    #{ord.order_number ?? ord.id.slice(0, 8)}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] border-white/15 bg-white/[0.06] text-slate-200"
                                  >
                                    {getWorkOrderStatusLabel(ord.status)}
                                  </Badge>
                                  {ord.created_at && (
                                    <span className="text-xs text-slate-400">
                                      {new Date(ord.created_at).toLocaleDateString('es-ES')}
                                    </span>
                                  )}
                                </div>
                                {ord.customer_notes && (
                                  <p className="text-xs text-slate-400 line-clamp-1">
                                    {ord.customer_notes}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-mono text-slate-400">
                                  {ord.mileage_in?.toLocaleString() ?? 0} km
                                </span>
                                <span className="font-mono font-bold text-orange-400">
                                  ${orderTotal.toLocaleString('es-CL')}
                                </span>
                                <Button
                                  asChild
                                  variant="outline"
                                  size="sm"
                                  className="h-7 rounded-lg text-xs gap-1 border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08] hover:border-orange-500/40 hover:text-white"
                                >
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
          <Card className="rounded-2xl border border-dashed border-white/10 bg-[#101218] shadow-none">
            <CardContent className="py-12 text-center text-slate-400">
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
