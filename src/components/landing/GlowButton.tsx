'use client'

import * as React from 'react'
import Link from 'next/link'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { cn } from '@/lib/utils'

interface GlowButtonProps {
  children: React.ReactNode
  href?: string
  onClick?: () => void
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  external?: boolean
  ariaLabel?: string
}

export function GlowButton({
  children,
  href,
  onClick,
  variant = 'primary',
  size = 'md',
  className,
  external = false,
  ariaLabel,
}: GlowButtonProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const rawX = useMotionValue(96)
  const springX = useSpring(rawX, { stiffness: 320, damping: 28, mass: 0.4 })
  const [hovered, setHovered] = React.useState(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    rawX.set(x)
  }

  const handleMouseLeave = () => {
    setHovered(false)
    const rect = containerRef.current?.getBoundingClientRect()
    if (rect) {
      rawX.set(rect.width * 0.72)
    }
  }

  const sizeClasses = {
    sm: 'h-9 px-4 text-[11px]',
    md: 'h-11 px-6 text-xs',
    lg: 'h-12 px-7 text-xs sm:text-[13px]',
  }[size]

  const innerContent =
    variant === 'primary' ? (
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={handleMouseLeave}
        className={cn(
          'group relative inline-flex items-center justify-center overflow-hidden rounded-full border border-white/60 bg-[#D9D9DC] font-bold uppercase tracking-[0.04em] text-[#3B1706] shadow-[0_0_28px_rgba(249,115,22,0.28)] transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]',
          sizeClasses,
          className
        )}
      >
        {/* Resplandor radial cálido que sigue el cursor (estilo Huly adaptado a MotoTrack) */}
        <motion.div
          aria-hidden="true"
          style={{ x: springX }}
          className="pointer-events-none absolute left-0 top-1/2 -z-0 h-[140px] w-[200px] -translate-x-1/2 -translate-y-1/2"
        >
          <div
            className={cn(
              'absolute left-1/2 top-1/2 h-[116px] w-[116px] -translate-x-1/2 -translate-y-1/2 rounded-full transition-opacity duration-300',
              hovered ? 'opacity-100' : 'opacity-90'
            )}
            style={{
              background:
                'radial-gradient(50% 50% at 50% 50%, #FFFBEB 5%, #FDBA74 28%, #F97316 52%, rgba(249,115,22,0.35) 72%, rgba(249,115,22,0) 95%)',
            }}
          />
          <div
            className="absolute left-1/2 top-1/2 h-[98px] w-[196px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[6px]"
            style={{
              background:
                'radial-gradient(45% 45% at 50% 50%, #FFFFFF 22%, #FEF3C7 48%, #FDBA74 68%, rgba(249,115,22,0) 100%)',
            }}
          />
        </motion.div>
        <span className="relative z-10 inline-flex items-center gap-2 whitespace-nowrap">
          {children}
        </span>
      </div>
    ) : (
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={handleMouseLeave}
        className={cn(
          'group relative inline-flex items-center justify-center overflow-hidden rounded-full border border-white/15 bg-[#0C0E14] font-semibold uppercase tracking-[0.04em] text-slate-100 transition-all duration-200 hover:border-orange-400/45 hover:bg-[#131620]',
          sizeClasses,
          className
        )}
      >
        <motion.div
          aria-hidden="true"
          style={{ x: springX }}
          className={cn(
            'pointer-events-none absolute left-0 top-1/2 h-24 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full transition-opacity duration-300',
            hovered ? 'opacity-100' : 'opacity-0'
          )}
        >
          <div
            className="h-full w-full rounded-full blur-md"
            style={{
              background:
                'radial-gradient(50% 50% at 50% 50%, rgba(249,115,22,0.38) 0%, rgba(56,189,248,0.16) 55%, rgba(0,0,0,0) 100%)',
            }}
          />
        </motion.div>
        <span className="relative z-10 inline-flex items-center gap-2 whitespace-nowrap">
          {children}
        </span>
      </div>
    )

  if (href) {
    if (external) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={ariaLabel}
          className="inline-flex focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-full"
        >
          {innerContent}
        </a>
      )
    }

    return (
      <Link
        href={href}
        aria-label={ariaLabel}
        className="inline-flex focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-full"
      >
        {innerContent}
      </Link>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="inline-flex focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-full"
    >
      {innerContent}
    </button>
  )
}
