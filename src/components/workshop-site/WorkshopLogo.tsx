'use client'

import * as React from 'react'
import { getWorkshopMonogram } from '@/lib/workshop-theme'
import { cn } from '@/lib/utils'

interface WorkshopLogoProps {
  name: string
  logoUrl?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function WorkshopLogo({
  name,
  logoUrl,
  size = 'md',
  className,
}: WorkshopLogoProps) {
  const [imgError, setImgError] = React.useState(false)
  const monogram = getWorkshopMonogram(name)

  const sizeMap = {
    sm: { box: 'h-8 w-8 rounded-lg', text: 'text-xs' },
    md: { box: 'h-10 w-10 rounded-xl', text: 'text-sm' },
    lg: { box: 'h-12 w-12 rounded-2xl', text: 'text-base' },
  }[size]

  if (logoUrl && !imgError) {
    return (
      <div
        className={cn(
          'relative flex shrink-0 items-center justify-center overflow-hidden bg-white/95 p-1 ring-1 ring-white/20 shadow-sm',
          sizeMap.box,
          className
        )}
      >
        <img
          src={logoUrl}
          alt={`Logo de ${name}`}
          onError={() => setImgError(true)}
          className="h-full w-full object-contain"
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden font-black tracking-tight ring-1 ring-white/20',
        sizeMap.box,
        sizeMap.text,
        className
      )}
      style={{
        backgroundColor: 'var(--brand-hex)',
        color: 'var(--brand-fg)',
        boxShadow: '0 0 22px rgba(var(--brand-glow-rgb), 0.35)',
      }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 40 40"
        className="pointer-events-none absolute inset-0 h-full w-full opacity-20"
        fill="none"
      >
        <path
          d="M4 32 L18 8 L24 8 L10 32 Z M22 32 L32 14 L36 14 L26 32 Z"
          fill="currentColor"
        />
      </svg>
      <span className="relative z-10">{monogram}</span>
    </div>
  )
}
