'use client'

import { useState } from 'react'
import { LogOut, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { signOut } from '@/app/login/actions'

export function MechanicSignOutButton({ compact = false }: { compact?: boolean }) {
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    setError(null)
    try {
      await signOut()
    } catch (err: any) {
      if (err?.digest?.startsWith('NEXT_REDIRECT')) {
        return
      }
      setError('No se pudo cerrar sesión')
      setIsSigningOut(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="outline"
        onClick={handleSignOut}
        disabled={isSigningOut}
        aria-label="Cerrar Sesión"
        className={`h-14 rounded-2xl border-2 border-slate-600 bg-slate-900/80 text-slate-100 hover:bg-red-950/60 hover:border-red-500/60 hover:text-red-200 font-bold active:scale-95 transition-transform ${
          compact ? 'px-3.5' : 'px-4 gap-2'
        }`}
      >
        {isSigningOut ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <LogOut className="w-5 h-5" />
        )}
        {!compact && (
          <span className="text-xs font-black uppercase tracking-wider">
            {isSigningOut ? 'Saliendo...' : 'Salir'}
          </span>
        )}
      </Button>
      {error && (
        <span className="text-[11px] font-semibold text-red-400">{error}</span>
      )}
    </div>
  )
}
