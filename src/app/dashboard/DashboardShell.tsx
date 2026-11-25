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

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* Branding */}
      <div className="p-5 border-b border-slate-100 flex items-center gap-3">
        {workshop.logoUrl ? (
          <img
            src={workshop.logoUrl}
            alt={workshop.name}
            className="w-10 h-10 rounded-xl object-contain bg-slate-50 border shrink-0"
          />
        ) : (
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
            style={{ backgroundColor: workshop.primaryColor }}
          >
            <Wrench className="w-5 h-5" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-bold text-slate-900 truncate leading-tight">{workshop.name}</p>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            MotoTrack Panel
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.matchPrefix}/`)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          )
        })}

        {workshop.slug && (
          <div className="pt-4 mt-4 border-t border-slate-100">
            <a
              href={`/t/${workshop.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <span>Ver Micrositio Público</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            </a>
          </div>
        )}
      </nav>

      {/* User & Sign Out */}
      <div className="p-3 border-t border-slate-100 space-y-2 bg-slate-50/50">
        <div className="px-3 py-2">
          <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            {ROLE_LABELS[user.role] || user.role}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="w-full justify-start gap-2 text-slate-700 hover:text-destructive hover:border-destructive/40 hover:bg-destructive/5"
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
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50/50">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-30 h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          {workshop.logoUrl ? (
            <img
              src={workshop.logoUrl}
              alt={workshop.name}
              className="w-8 h-8 rounded-lg object-contain bg-slate-50 border shrink-0"
            />
          ) : (
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
              style={{ backgroundColor: workshop.primaryColor }}
            >
              <Wrench className="w-4 h-4" />
            </div>
          )}
          <span className="font-bold text-slate-900 truncate">{workshop.name}</span>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => setMobileOpen((prev) => !prev)}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full z-50">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:pl-64 min-w-0">{children}</main>
    </div>
  )
}
