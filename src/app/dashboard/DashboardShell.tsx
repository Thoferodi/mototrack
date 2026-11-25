'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ClipboardList,
  Bike,
  Package,
  Settings,
  LogOut,
  Menu,
  X,
  Wrench,
  ExternalLink,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { signOut } from '@/app/login/actions'

interface DashboardShellProps {
  children: React.ReactNode
  workshop: {
    name: string
    slug: string
    logoUrl: string | null
    primaryColor: string
  }
  user: {
    name: string
    role: string
  }
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  owner: 'Propietario',
  manager: 'Administrador',
  receptionist: 'Recepción',
  mechanic: 'Mecánico',
}

const NAV_ITEMS = [
  {
    href: '/dashboard/orders',
    label: 'Órdenes',
    icon: ClipboardList,
    matchPrefix: '/dashboard/orders',
  },
  {
    href: '/dashboard/vehicles',
    label: 'Vehículos',
    icon: Bike,
    matchPrefix: '/dashboard/vehicles',
  },
  {
    href: '/dashboard/catalog',
    label: 'Catálogo',
    icon: Package,
    matchPrefix: '/dashboard/catalog',
  },
  {
    href: '/dashboard/settings',
    label: 'Configuración',
    icon: Settings,
    matchPrefix: '/dashboard/settings',
  },
]

export function DashboardShell({ children, workshop, user }: DashboardShellProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [isSigningOut, setIsSigningOut] = React.useState(false)

  React.useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  React.useEffect(() => {
    const prev = document.documentElement.style.colorScheme
    document.documentElement.style.colorScheme = 'dark'
    return () => {
      document.documentElement.style.colorScheme = prev
    }
  }, [])

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOut()
    } catch (err: any) {
      if (err?.digest?.startsWith('NEXT_REDIRECT')) {
        return
      }
      setIsSigningOut(false)
    }
  }

  const SidebarContent = ({ onClose }: { onClose?: () => void }) => (
    <div className="flex flex-col h-full bg-[#0B0D12] border-r border-white/10 text-slate-100">
      {/* Branding */}
      <div className="p-5 border-b border-white/10 flex items-center gap-3">
        {workshop.logoUrl ? (
          <div className="w-10 h-10 rounded-xl bg-white/95 p-1 ring-1 ring-white/20 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
            <img
              src={workshop.logoUrl}
              alt={workshop.name}
              className="w-full h-full object-contain"
            />
          </div>
        ) : (
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-[0_0_18px_rgba(249,115,22,0.35)] ring-1 ring-white/15"
            style={{ backgroundColor: workshop.primaryColor }}
          >
            <Wrench className="w-5 h-5" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-bold text-white truncate leading-tight">{workshop.name}</p>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            MotoTrack Panel
          </p>
        </div>
        {onClose && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Cerrar menú lateral"
            onClick={onClose}
            className="h-8 w-8 rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white shrink-0"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.matchPrefix}/`)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold border transition-all',
                isActive
                  ? 'bg-orange-500/10 text-orange-400 border-orange-500/20 shadow-[0_0_20px_rgba(249,115,22,0.08)]'
                  : 'border-transparent text-slate-400 hover:bg-white/[0.04] hover:text-slate-100'
              )}
            >
              <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-orange-400' : 'text-slate-400')} />
              <span>{item.label}</span>
            </Link>
          )
        })}

        {workshop.slug && (
          <div className="pt-4 mt-4 border-t border-white/10">
            <a
              href={`/t/${workshop.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-xs font-semibold text-slate-300 hover:border-orange-500/35 hover:bg-orange-500/10 hover:text-white transition-all"
            >
              <span>Ver Micrositio Público</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0 text-orange-400" />
            </a>
          </div>
        )}
      </nav>

      {/* User & Sign Out */}
      <div className="p-3 border-t border-white/10 space-y-2 bg-[#08090C]/70">
        <div className="px-3 py-2">
          <p className="text-sm font-bold text-white truncate">{user.name}</p>
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            {ROLE_LABELS[user.role] || user.role}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="w-full justify-start gap-2 rounded-xl border-white/10 bg-white/[0.03] text-slate-300 hover:text-rose-300 hover:border-rose-500/40 hover:bg-rose-500/10"
        >
          {isSigningOut ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <LogOut className="w-4 h-4" />
          )}
          <span>{isSigningOut ? 'Cerrando sesión...' : 'Cerrar Sesión'}</span>
        </Button>
      </div>
    </div>
  )

  return (
    <div className="relative min-h-screen flex flex-col md:flex-row bg-[#08090C] text-slate-100 [color-scheme:dark] selection:bg-orange-500/30 selection:text-orange-100">
      {/* Glow ambiental sutil superior */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div
          className="absolute left-1/2 -top-40 h-[360px] w-[720px] -translate-x-1/2 rounded-full opacity-20 blur-[120px]"
          style={{
            background:
              'radial-gradient(ellipse at 50% 45%, rgba(249,115,22,0.32) 0%, rgba(56,189,248,0.16) 55%, rgba(8,9,12,0) 80%)',
          }}
        />
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-30 h-14 bg-[#0B0D12]/90 backdrop-blur-xl border-b border-white/10 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          {workshop.logoUrl ? (
            <div className="w-8 h-8 rounded-lg bg-white/95 p-0.5 ring-1 ring-white/20 flex items-center justify-center shrink-0 overflow-hidden">
              <img
                src={workshop.logoUrl}
                alt={workshop.name}
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 ring-1 ring-white/15"
              style={{ backgroundColor: workshop.primaryColor }}
            >
              <Wrench className="w-4 h-4" />
            </div>
          )}
          <span className="font-bold text-white truncate">{workshop.name}</span>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => setMobileOpen((prev) => !prev)}
          className="h-9 w-9 rounded-xl border border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08] hover:text-white"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full z-50 shadow-2xl">
            <SidebarContent onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="relative z-10 flex-1 md:pl-64 min-w-0">{children}</main>
    </div>
  )
}
