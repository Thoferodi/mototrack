import * as React from 'react'
import { cn } from '@/lib/utils'

export interface MotoTrackBrandProps {
  variant?: 'horizontal' | 'stacked'
  theme?: 'dark' | 'light'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  badge?: string
  className?: string
}

const STACKED_HEIGHT_CLASSES: Record<NonNullable<MotoTrackBrandProps['size']>, string> = {
  xs: 'h-10 w-auto',
  sm: 'h-16 w-auto',
  md: 'h-20 w-auto',
  lg: 'h-24 sm:h-28 w-auto',
}

const HORIZONTAL_CLASSES: Record<
  NonNullable<MotoTrackBrandProps['size']>,
  { icon: string; text: string; badge: string; gap: string }
> = {
  xs: {
    icon: 'h-5 w-5 rounded-[5px]',
    text: 'text-xs',
    badge: 'px-1.5 py-0.5 text-[8px]',
    gap: 'gap-1.5',
  },
  sm: {
    icon: 'h-8 w-8 rounded-[9px]',
    text: 'text-base',
    badge: 'px-1.5 py-0.5 text-[9px]',
    gap: 'gap-2',
  },
  md: {
    icon: 'h-9 w-9 rounded-[10px]',
    text: 'text-lg',
    badge: 'px-1.5 py-0.5 text-[9px]',
    gap: 'gap-2.5',
  },
  lg: {
    icon: 'h-11 w-11 rounded-xl',
    text: 'text-xl',
    badge: 'px-2 py-0.5 text-[10px]',
    gap: 'gap-3',
  },
}

export function MotoTrackBrand({
  variant = 'horizontal',
  theme = 'dark',
  size = 'md',
  badge,
  className,
}: MotoTrackBrandProps) {
  if (variant === 'stacked') {
    const logoSrc =
      theme === 'dark' ? '/brand/mototrack-logo-dark.png' : '/brand/mototrack-logo-light.png'

    return (
      <span className={cn('inline-flex flex-col items-center justify-center shrink-0', className)}>
        <img
          src={logoSrc}
          alt="MotoTrack — Software de Seguimiento"
          width={987}
          height={642}
          className={cn('object-contain select-none', STACKED_HEIGHT_CLASSES[size])}
        />
      </span>
    )
  }

  const sizeStyles = HORIZONTAL_CLASSES[size]

  return (
    <span className={cn('inline-flex items-center shrink-0', sizeStyles.gap, className)}>
      <img
        src="/brand/mototrack-icon.png"
        alt="MotoTrack"
        width={256}
        height={256}
        className={cn(
          'shrink-0 object-cover select-none transition-transform duration-200 group-hover:scale-105',
          size === 'xs'
            ? 'shadow-[0_0_10px_rgba(255,81,31,0.28)]'
            : 'shadow-[0_0_18px_rgba(255,81,31,0.38)]',
          sizeStyles.icon
        )}
      />
      <span className="inline-flex items-baseline gap-1.5 whitespace-nowrap">
        <span className={cn('font-bold tracking-tight leading-none', sizeStyles.text)}>
          <span className={theme === 'dark' ? 'text-white' : 'text-[#002E49]'}>Moto</span>
          <span className="text-[#FF511F]">Track</span>
        </span>
        {badge && (
          <span
            className={cn(
              'hidden sm:inline-block rounded-full border font-bold uppercase tracking-wider',
              theme === 'dark'
                ? 'border-orange-500/30 bg-orange-500/10 text-orange-400'
                : 'border-orange-500/30 bg-orange-50 text-orange-600',
              sizeStyles.badge
            )}
          >
            {badge}
          </span>
        )}
      </span>
    </span>
  )
}
