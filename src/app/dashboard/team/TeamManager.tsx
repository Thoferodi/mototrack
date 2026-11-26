'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  UserPlus,
  Search,
  Shield,
  ShieldAlert,
  Wrench,
  ClipboardCheck,
  Crown,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  RefreshCw,
  Copy,
  Check,
  Eye,
  EyeOff,
  Power,
  Mail,
  Calendar,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  AssignableRole,
  TeamMember,
  UserRole,
  createTeamMember,
  toggleMemberActive,
  updateMemberRole,
} from './actions'

interface TeamManagerProps {
  initialMembers: TeamMember[]
  currentUserId: string
  currentUserRole: UserRole
}

const DARK_INPUT_CLASS =
  'h-10 rounded-xl border-white/10 bg-[#0B0D13] text-white placeholder:text-slate-500 focus-visible:border-orange-500/60 focus-visible:ring-orange-500/30 focus-visible:ring-offset-0 [color-scheme:dark]'

const ROLE_META: Record<
  UserRole,
  {
    label: string
    badgeClass: string
    icon: React.ComponentType<{ className?: string }>
  }
> = {
  owner: {
    label: 'Propietario',
    badgeClass: 'border-amber-400/35 bg-amber-500/15 text-amber-300',
    icon: Crown,
  },
  admin: {
    label: 'Administrador',
    badgeClass: 'border-orange-500/35 bg-orange-500/15 text-orange-300',
    icon: Shield,
  },
  manager: {
    label: 'Gerente',
    badgeClass: 'border-sky-500/35 bg-sky-500/15 text-sky-300',
    icon: ShieldAlert,
  },
  receptionist: {
    label: 'Recepcionista',
    badgeClass: 'border-violet-500/35 bg-violet-500/15 text-violet-300',
    icon: ClipboardCheck,
  },
  mechanic: {
    label: 'Mecánico',
    badgeClass: 'border-emerald-500/35 bg-emerald-500/15 text-emerald-300',
    icon: Wrench,
  },
}

const ADMIN_ROLES = new Set<UserRole>(['owner', 'admin', 'manager'])

function generateSecurePassword(length = 14): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghijkmnopqrstuvwxyz'
  const digits = '23456789'
  const symbols = '!@#$%&*?'
  const all = upper + lower + digits + symbols

  const pick = (charset: string) => {
    const buf = new Uint32Array(1)
    window.crypto.getRandomValues(buf)
    return charset[buf[0] % charset.length]
  }

  const chars = [pick(upper), pick(lower), pick(digits), pick(symbols)]
  for (let i = chars.length; i < length; i++) {
    chars.push(pick(all))
  }

  // Fisher-Yates shuffle with CSPRNG
  for (let i = chars.length - 1; i > 0; i--) {
    const buf = new Uint32Array(1)
    window.crypto.getRandomValues(buf)
    const j = buf[0] % (i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }

  return chars.join('')
}

function formatDateEs(value: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'U'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

export function TeamManager({
  initialMembers,
  currentUserId,
  currentUserRole,
}: TeamManagerProps) {
  const router = useRouter()
  const [members, setMembers] = React.useState<TeamMember[]>(initialMembers)
  const [search, setSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'active' | 'inactive'>('all')

  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)

  // Modal Agregar Miembro
  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [fullName, setFullName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(true)
  const [copiedPassword, setCopiedPassword] = React.useState(false)
  const [role, setRole] = React.useState<AssignableRole>('mechanic')
  const [isCreating, setIsCreating] = React.useState(false)
  const [modalError, setModalError] = React.useState<string | null>(null)

  // Acciones por fila
  const [updatingRoleId, setUpdatingRoleId] = React.useState<string | null>(null)
  const [confirmToggleMember, setConfirmToggleMember] = React.useState<TeamMember | null>(null)
  const [togglingId, setTogglingId] = React.useState<string | null>(null)

  React.useEffect(() => {
    setMembers(initialMembers)
  }, [initialMembers])

  const isOwner = currentUserRole === 'owner'

  const assignableRoles: { value: AssignableRole; label: string }[] = React.useMemo(() => {
    const base: { value: AssignableRole; label: string }[] = [
      { value: 'mechanic', label: 'Mecánico' },
      { value: 'receptionist', label: 'Recepcionista' },
    ]
    if (isOwner) {
      base.push(
        { value: 'manager', label: 'Gerente' },
        { value: 'admin', label: 'Administrador' }
      )
    }
    return base
  }, [isOwner])

  const activeAdminCount = React.useMemo(
    () => members.filter((m) => m.active && ADMIN_ROLES.has(m.role)).length,
    [members]
  )

  const stats = React.useMemo(() => {
    const total = members.length
    const active = members.filter((m) => m.active).length
    const inactive = total - active
    const mechanics = members.filter((m) => m.role === 'mechanic' && m.active).length
    return { total, active, inactive, mechanics }
  }, [members])

  const filteredMembers = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    return members.filter((m) => {
      if (statusFilter === 'active' && !m.active) return false
      if (statusFilter === 'inactive' && m.active) return false
      if (!q) return true
      const roleLabel = ROLE_META[m.role]?.label.toLowerCase() || ''
      return (
        m.full_name.toLowerCase().includes(q) ||
        (m.email || '').toLowerCase().includes(q) ||
        roleLabel.includes(q)
      )
    })
  }, [members, search, statusFilter])

  const openAddModal = () => {
    setFullName('')
    setEmail('')
    setPassword(generateSecurePassword())
    setShowPassword(true)
    setCopiedPassword(false)
    setRole('mechanic')
    setModalError(null)
    setIsAddOpen(true)
  }

  const closeAddModal = () => {
    if (isCreating) return
    setIsAddOpen(false)
    setModalError(null)
  }

  const handleGeneratePassword = () => {
    setPassword(generateSecurePassword())
    setCopiedPassword(false)
    setShowPassword(true)
  }

  const handleCopyPassword = async () => {
    if (!password) return
    try {
      await navigator.clipboard.writeText(password)
      setCopiedPassword(true)
      setTimeout(() => setCopiedPassword(false), 2000)
    } catch {
      setModalError('No se pudo copiar al portapapeles. Cópiala manualmente.')
    }
  }

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault()
    setModalError(null)
    setError(null)
    setSuccess(null)

    if (fullName.trim().length < 2) {
      setModalError('Ingresa el nombre completo del miembro.')
      return
    }
    if (!email.trim()) {
      setModalError('Ingresa el correo electrónico.')
      return
    }
    if (password.length < 8) {
      setModalError('La contraseña temporal debe tener al menos 8 caracteres.')
      return
    }

    setIsCreating(true)
    try {
      const res = await createTeamMember({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
      })

      if (!res.success || !res.member) {
        setModalError(res.error || 'No se pudo crear el miembro del equipo.')
        return
      }

      setMembers((prev) => [...prev, res.member!])
      setSuccess(
        `${res.member.full_name} fue agregado al equipo como ${ROLE_META[res.member.role].label}.`
      )
      setIsAddOpen(false)
      router.refresh()
    } catch (err: any) {
      setModalError(err?.message || 'Error inesperado al crear el miembro.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleRoleChange = async (member: TeamMember, nextRole: AssignableRole) => {
    if (member.role === nextRole) return
    setError(null)
    setSuccess(null)
    setUpdatingRoleId(member.id)

    try {
      const res = await updateMemberRole({ memberId: member.id, role: nextRole })
      if (!res.success) {
        setError(res.error || 'No se pudo actualizar el rol.')
        return
      }

      setMembers((prev) =>
        prev.map((m) => (m.id === member.id ? { ...m, role: nextRole } : m))
      )
      setSuccess(
        `Rol de ${member.full_name} actualizado a ${ROLE_META[nextRole].label}.`
      )
      router.refresh()
    } catch (err: any) {
      setError(err?.message || 'Error inesperado al actualizar el rol.')
    } finally {
      setUpdatingRoleId(null)
    }
  }

  const handleConfirmToggleActive = async () => {
    if (!confirmToggleMember) return
    const target = confirmToggleMember
    const nextActive = !target.active

    setError(null)
    setSuccess(null)
    setTogglingId(target.id)

    try {
      const res = await toggleMemberActive({
        memberId: target.id,
        active: nextActive,
      })

      if (!res.success) {
        setError(res.error || 'No se pudo actualizar el estado del miembro.')
        setConfirmToggleMember(null)
        return
      }

      setMembers((prev) =>
        prev.map((m) => (m.id === target.id ? { ...m, active: nextActive } : m))
      )
      setSuccess(
        nextActive
          ? `${target.full_name} fue reactivado y ya puede iniciar sesión.`
          : `${target.full_name} fue desactivado y sus sesiones quedaron bloqueadas.`
      )
      setConfirmToggleMember(null)
      router.refresh()
    } catch (err: any) {
      setError(err?.message || 'Error inesperado al cambiar el estado.')
      setConfirmToggleMember(null)
    } finally {
      setTogglingId(null)
    }
  }

  const canEditMemberRole = (member: TeamMember): { allowed: boolean; reason?: string } => {
    if (member.role === 'owner') {
      return { allowed: false, reason: 'El rol del propietario no se puede modificar' }
    }
    if (!isOwner && (member.role === 'admin' || member.role === 'manager')) {
      return {
        allowed: false,
        reason: 'Solo el propietario puede modificar administradores o gerentes',
      }
    }
    return { allowed: true }
  }

  const canToggleMemberStatus = (member: TeamMember): { allowed: boolean; reason?: string } => {
    if (member.id === currentUserId) {
      return { allowed: false, reason: 'No puedes desactivar tu propia cuenta' }
    }
    if (member.role === 'owner') {
      return { allowed: false, reason: 'No se puede desactivar al propietario' }
    }
    if (!isOwner && (member.role === 'admin' || member.role === 'manager')) {
      return {
        allowed: false,
        reason: 'Solo el propietario puede gestionar administradores o gerentes',
      }
    }
    if (member.active && ADMIN_ROLES.has(member.role) && activeAdminCount <= 1) {
      return {
        allowed: false,
        reason: 'Debe quedar al menos un administrador activo',
      }
    }
    return { allowed: true }
  }

  const renderRoleBadge = (memberRole: UserRole) => {
    const meta = ROLE_META[memberRole] || ROLE_META.mechanic
    const Icon = meta.icon
    return (
      <Badge variant="outline" className={`gap-1.5 text-xs ${meta.badgeClass}`}>
        <Icon className="w-3 h-3" />
        {meta.label}
      </Badge>
    )
  }

  const renderStatusBadge = (isActive: boolean) => (
    <Badge
      variant="outline"
      className={
        isActive
          ? 'border-emerald-500/35 bg-emerald-500/15 text-emerald-300 text-xs'
          : 'border-rose-500/35 bg-rose-500/15 text-rose-300 text-xs'
      }
    >
      <span
        className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
          isActive ? 'bg-emerald-400' : 'bg-rose-400'
        }`}
      />
      {isActive ? 'Activo' : 'Inactivo'}
    </Badge>
  )

  const renderRoleSelect = (member: TeamMember) => {
    const permission = canEditMemberRole(member)
    const isSelfOnlyAdmin =
      member.id === currentUserId &&
      member.active &&
      ADMIN_ROLES.has(member.role) &&
      activeAdminCount <= 1

    if (!permission.allowed) {
      return (
        <div title={permission.reason} className="inline-flex items-center">
          {renderRoleBadge(member.role)}
        </div>
      )
    }

    const isUpdating = updatingRoleId === member.id

    return (
      <div className="relative inline-flex items-center gap-2">
        <select
          aria-label={`Cambiar rol de ${member.full_name}`}
          value={member.role}
          disabled={isUpdating}
          onChange={(e) => handleRoleChange(member, e.target.value as AssignableRole)}
          className="h-9 rounded-xl border border-white/10 bg-[#0B0D13] px-3 py-1.5 text-xs font-semibold leading-normal text-white focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/25 disabled:opacity-60 [color-scheme:dark]"
        >
          {assignableRoles.map((opt) => {
            const optionBlocked =
              isSelfOnlyAdmin && !ADMIN_ROLES.has(opt.value)
            return (
              <option
                key={opt.value}
                value={opt.value}
                disabled={optionBlocked}
                className="bg-[#101218] text-white"
              >
                {opt.label}
                {optionBlocked ? ' (único admin)' : ''}
              </option>
            )
          })}
        </select>
        {isUpdating && <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-400" />}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Gestión de Equipo</h1>
          <p className="text-slate-400 text-sm">
            Administra los accesos, roles y estado operativo del personal de tu taller.
          </p>
        </div>
        <Button
          type="button"
          onClick={openAddModal}
          className="gap-2 h-11 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold shadow-[0_0_24px_rgba(249,115,22,0.28)] border border-orange-400/50 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          Agregar Miembro
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-white/10 bg-[#101218] p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Total Equipo</span>
            <Users className="w-4 h-4 text-orange-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white tabular-nums">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#101218] p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Cuentas Activas</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-300 tabular-nums">{stats.active}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#101218] p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Desactivadas</span>
            <Power className="w-4 h-4 text-rose-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-rose-300 tabular-nums">{stats.inactive}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#101218] p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Mecánicos Activos</span>
            <Wrench className="w-4 h-4 text-sky-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white tabular-nums">{stats.mechanics}</p>
        </div>
      </div>

      {/* Feedback Banners */}
      {error && (
        <div
          role="alert"
          className="bg-rose-500/10 border border-rose-500/30 text-rose-200 text-sm p-4 rounded-xl flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          <span className="font-medium flex-1">{error}</span>
          <button
            type="button"
            aria-label="Cerrar alerta"
            onClick={() => setError(null)}
            className="text-rose-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-sm p-4 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          <span className="font-medium flex-1">{success}</span>
          <button
            type="button"
            aria-label="Cerrar notificación"
            onClick={() => setSuccess(null)}
            className="text-emerald-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, correo o rol..."
            className="h-10 pl-10 rounded-xl bg-[#101218] border-white/10 text-white placeholder:text-slate-500 focus-visible:border-orange-500/60 focus-visible:ring-orange-500/30 focus-visible:ring-offset-0 [color-scheme:dark]"
          />
        </div>

        <div className="inline-flex items-center gap-1 bg-[#101218] border border-white/10 p-1 rounded-xl self-start sm:self-auto">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setStatusFilter('all')}
            className={
              statusFilter === 'all'
                ? 'h-8 rounded-lg bg-orange-500/15 text-orange-300 border border-orange-500/30 hover:bg-orange-500/20 hover:text-orange-200 text-xs font-semibold'
                : 'h-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.04] text-xs font-semibold border border-transparent'
            }
          >
            Todos ({stats.total})
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setStatusFilter('active')}
            className={
              statusFilter === 'active'
                ? 'h-8 rounded-lg bg-orange-500/15 text-orange-300 border border-orange-500/30 hover:bg-orange-500/20 hover:text-orange-200 text-xs font-semibold'
                : 'h-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.04] text-xs font-semibold border border-transparent'
            }
          >
            Activos ({stats.active})
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setStatusFilter('inactive')}
            className={
              statusFilter === 'inactive'
                ? 'h-8 rounded-lg bg-orange-500/15 text-orange-300 border border-orange-500/30 hover:bg-orange-500/20 hover:text-orange-200 text-xs font-semibold'
                : 'h-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.04] text-xs font-semibold border border-transparent'
            }
          >
            Inactivos ({stats.inactive})
          </Button>
        </div>
      </div>

      {/* Desktop Table */}
      <Card className="hidden md:block rounded-2xl border border-white/10 bg-[#101218] text-slate-100 shadow-none overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto [color-scheme:dark]">
            <table className="w-full text-sm text-left">
              <thead className="text-[11px] text-slate-400 uppercase tracking-wider bg-[#0B0D13] border-b border-white/10">
                <tr>
                  <th className="px-6 py-3.5 font-bold">Miembro</th>
                  <th className="px-4 py-3.5 font-bold">Correo</th>
                  <th className="px-4 py-3.5 font-bold">Rol</th>
                  <th className="px-4 py-3.5 font-bold">Estado</th>
                  <th className="px-4 py-3.5 font-bold">Fecha de Alta</th>
                  <th className="px-6 py-3.5 font-bold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {filteredMembers.map((member) => {
                  const isSelf = member.id === currentUserId
                  const togglePerm = canToggleMemberStatus(member)

                  return (
                    <tr
                      key={member.id}
                      className={`transition-colors hover:bg-white/[0.03] ${
                        !member.active ? 'opacity-75' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-xs font-bold text-orange-300 shrink-0">
                            {getInitials(member.full_name)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white truncate">
                                {member.full_name}
                              </span>
                              {isSelf && (
                                <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-orange-300">
                                  Tú
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 font-mono text-xs text-slate-300">
                        {member.email || (
                          <span className="text-slate-500 italic">No disponible</span>
                        )}
                      </td>
                      <td className="px-4 py-4">{renderRoleSelect(member)}</td>
                      <td className="px-4 py-4">{renderStatusBadge(member.active)}</td>
                      <td className="px-4 py-4 text-xs text-slate-400 tabular-nums">
                        {formatDateEs(member.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={!togglePerm.allowed || togglingId === member.id}
                          title={togglePerm.reason}
                          onClick={() => setConfirmToggleMember(member)}
                          className={
                            member.active
                              ? 'h-8 rounded-lg border-white/10 bg-white/[0.03] text-xs font-semibold text-slate-300 hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-40'
                              : 'h-8 rounded-lg border-emerald-500/30 bg-emerald-500/10 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 hover:text-emerald-200 disabled:opacity-40'
                          }
                        >
                          <Power className="w-3.5 h-3.5 mr-1.5" />
                          {member.active ? 'Desactivar' : 'Reactivar'}
                        </Button>
                      </td>
                    </tr>
                  )
                })}

                {filteredMembers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      No se encontraron miembros que coincidan con tu búsqueda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filteredMembers.map((member) => {
          const isSelf = member.id === currentUserId
          const togglePerm = canToggleMemberStatus(member)

          return (
            <div
              key={member.id}
              className={`rounded-2xl border border-white/10 bg-[#101218] p-4 space-y-3 ${
                !member.active ? 'opacity-80' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-xs font-bold text-orange-300 shrink-0">
                    {getInitials(member.full_name)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-white truncate">{member.full_name}</p>
                      {isSelf && (
                        <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-orange-300">
                          Tú
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-mono text-slate-400 flex items-center gap-1.5 mt-0.5 min-w-0">
                      <Mail className="w-3 h-3 shrink-0 text-slate-500" />
                      <span className="truncate">{member.email || 'No disponible'}</span>
                    </p>
                  </div>
                </div>
                {renderStatusBadge(member.active)}
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/[0.07]">
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>Alta: {formatDateEs(member.created_at)}</span>
                </div>
                {renderRoleSelect(member)}
              </div>

              <div className="pt-1 flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!togglePerm.allowed || togglingId === member.id}
                  title={togglePerm.reason}
                  onClick={() => setConfirmToggleMember(member)}
                  className={
                    member.active
                      ? 'w-full h-9 rounded-xl border-white/10 bg-white/[0.03] text-xs font-semibold text-slate-300 hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-40'
                      : 'w-full h-9 rounded-xl border-emerald-500/30 bg-emerald-500/10 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 hover:text-emerald-200 disabled:opacity-40'
                  }
                >
                  <Power className="w-3.5 h-3.5 mr-1.5" />
                  {member.active ? 'Desactivar Cuenta' : 'Reactivar Cuenta'}
                </Button>
              </div>
            </div>
          )
        })}

        {filteredMembers.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-[#101218] p-8 text-center text-sm text-slate-400">
            No se encontraron miembros que coincidan con tu búsqueda.
          </div>
        )}
      </div>

      {/* Modal: Agregar Miembro */}
      {isAddOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-member-title"
        >
          <div className="relative w-full max-w-lg rounded-2xl border border-white/15 bg-[#101218] text-slate-100 shadow-[0_24px_80px_rgba(0,0,0,0.85)] overflow-hidden">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-orange-400/80 to-transparent"
            />
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
              <div>
                <h2 id="add-member-title" className="text-lg font-bold text-white">
                  Agregar Miembro al Taller
                </h2>
                <p className="text-xs text-slate-400">
                  La cuenta se creará activa y lista para iniciar sesión de inmediato.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Cerrar modal"
                onClick={closeAddModal}
                disabled={isCreating}
                className="rounded-xl text-slate-400 hover:bg-white/[0.06] hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form onSubmit={handleCreateMember} className="p-6 space-y-4">
              {modalError && (
                <div
                  role="alert"
                  className="bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs p-3.5 rounded-xl flex items-center gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span className="font-medium">{modalError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="member-name" className="text-xs font-semibold text-slate-300">
                  Nombre Completo *
                </Label>
                <Input
                  id="member-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej. Carlos Mendoza"
                  className={DARK_INPUT_CLASS}
                  required
                  disabled={isCreating}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="member-email" className="text-xs font-semibold text-slate-300">
                  Correo Electrónico *
                </Label>
                <Input
                  id="member-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="carlos@mitaller.com"
                  className={DARK_INPUT_CLASS}
                  required
                  disabled={isCreating}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="member-password" className="text-xs font-semibold text-slate-300">
                    Contraseña Temporal *
                  </Label>
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleGeneratePassword}
                      disabled={isCreating}
                      className="h-7 px-2 rounded-lg text-[11px] font-semibold text-orange-300 hover:bg-orange-500/15 hover:text-orange-200 gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Generar segura
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyPassword}
                      disabled={isCreating || !password}
                      className="h-7 px-2 rounded-lg text-[11px] font-semibold text-slate-300 hover:bg-white/[0.08] hover:text-white gap-1"
                    >
                      {copiedPassword ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-300">Copiada</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copiar</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                <div className="relative">
                  <Input
                    id="member-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className={`${DARK_INPUT_CLASS} font-mono pr-10`}
                    required
                    minLength={8}
                    disabled={isCreating}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Comparte esta contraseña de forma segura con el colaborador.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="member-role" className="text-xs font-semibold text-slate-300">
                  Rol en el Taller *
                </Label>
                <select
                  id="member-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as AssignableRole)}
                  disabled={isCreating}
                  className="flex h-10 w-full rounded-xl border border-white/10 bg-[#0B0D13] px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/25 [color-scheme:dark]"
                >
                  {assignableRoles.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-[#101218] text-white">
                      {opt.label}
                    </option>
                  ))}
                </select>
                {!isOwner && (
                  <p className="text-[11px] text-slate-500">
                    Solo el propietario puede asignar roles de Administrador o Gerente.
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.08]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeAddModal}
                  disabled={isCreating}
                  className="rounded-xl border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.08] hover:text-white"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isCreating}
                  className="rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold"
                >
                  {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {isCreating ? 'Creando cuenta...' : 'Crear Miembro'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Activar / Desactivar */}
      {confirmToggleMember && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="toggle-member-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#101218] p-6 text-slate-100 shadow-[0_24px_80px_rgba(0,0,0,0.85)] space-y-4">
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                  confirmToggleMember.active
                    ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                    : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                }`}
              >
                <Power className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h2 id="toggle-member-title" className="text-base font-bold text-white">
                  {confirmToggleMember.active
                    ? `¿Desactivar a ${confirmToggleMember.full_name}?`
                    : `¿Reactivar a ${confirmToggleMember.full_name}?`}
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {confirmToggleMember.active
                    ? 'Se bloquearán sus credenciales de acceso y cualquier sesión activa será cerrada de inmediato.'
                    : 'El colaborador recuperará el acceso al sistema con su rol actual asignado.'}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#0B0D13] px-3.5 py-2.5 text-xs text-slate-300 flex items-center justify-between gap-2">
              <span className="font-mono truncate">
                {confirmToggleMember.email || confirmToggleMember.full_name}
              </span>
              {renderRoleBadge(confirmToggleMember.role)}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={Boolean(togglingId)}
                onClick={() => setConfirmToggleMember(null)}
                className="rounded-xl border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.08] hover:text-white"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={Boolean(togglingId)}
                onClick={handleConfirmToggleActive}
                className={
                  confirmToggleMember.active
                    ? 'rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold'
                    : 'rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold'
                }
              >
                {togglingId && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {confirmToggleMember.active ? 'Sí, desactivar' : 'Sí, reactivar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
