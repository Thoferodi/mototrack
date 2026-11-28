import type * as React from 'react'

export const DEFAULT_BRAND_HEX = '#F97316'

export interface WorkshopTheme {
  hex: string
  rgb: string
  fg: '#09090B' | '#FFFFFF'
  textOnDark: string
  glowRgb: string
  cssVars: React.CSSProperties
}

/**
 * Normaliza un color hexadecimal (#RGB o #RRGGBB) a formato #RRGGBB en mayúsculas.
 * Si el valor no es válido, devuelve el fallback (#F97316).
 */
export function normalizeHexColor(
  input?: string | null,
  fallback: string = DEFAULT_BRAND_HEX
): string {
  const raw = (input || '').trim()
  if (/^#[0-9a-fA-F]{6}$/.test(raw)) {
    return raw.toUpperCase()
  }
  if (/^#[0-9a-fA-F]{3}$/.test(raw)) {
    const r = raw[1]
    const g = raw[2]
    const b = raw[3]
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase()
  }
  return fallback.toUpperCase()
}

export function hexToRgbTuple(hex: string): [number, number, number] {
  const normalized = normalizeHexColor(hex)
  const r = parseInt(normalized.slice(1, 3), 16)
  const g = parseInt(normalized.slice(3, 5), 16)
  const b = parseInt(normalized.slice(5, 7), 16)
  return [r, g, b]
}

function srgbToLinear(channel255: number): number {
  const s = channel255 / 255
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
}

export function getRelativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgbTuple(hex)
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b)
}

export function getContrastRatio(hexA: string, hexB: string): number {
  const l1 = getRelativeLuminance(hexA)
  const l2 = getRelativeLuminance(hexB)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Calcula si el color de marca requiere texto oscuro (#09090B) o blanco (#FFFFFF)
 * sobre botones sólidos maximizando la razón de contraste WCAG 2.1.
 */
export function getContrastForeground(hex: string): '#09090B' | '#FFFFFF' {
  const darkContrast = getContrastRatio(hex, '#09090B')
  const whiteContrast = getContrastRatio(hex, '#FFFFFF')
  return darkContrast >= whiteContrast ? '#09090B' : '#FFFFFF'
}

function mixRgbWithWhite(
  [r, g, b]: [number, number, number],
  whiteWeight: number
): [number, number, number] {
  const w = Math.min(1, Math.max(0, whiteWeight))
  return [
    Math.round(r + (255 - r) * w),
    Math.round(g + (255 - g) * w),
    Math.round(b + (255 - b) * w),
  ]
}

function rgbTupleToHex([r, g, b]: [number, number, number]): string {
  const toHex = (n: number) => Math.min(255, Math.max(0, n)).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase()
}

/**
 * Si un taller elige un color muy oscuro (ej. #111827), evita que textos,
 * bordes luminosos o halos desaparezcan sobre el lienzo oscuro #08090C.
 */
function resolveAccessibleAccentOnDark(hex: string): {
  textOnDark: string
  glowRgb: string
} {
  const rgb = hexToRgbTuple(hex)
  const contrastOnSurface = getContrastRatio(hex, '#101218')

  if (contrastOnSurface >= 4.5) {
    return {
      textOnDark: hex,
      glowRgb: `${rgb[0]}, ${rgb[1]}, ${rgb[2]}`,
    }
  }

  // Aclara progresivamente hasta superar contraste WCAG AA (4.5:1) sobre #101218
  for (const step of [0.28, 0.44, 0.6, 0.76, 0.88]) {
    const mixed = mixRgbWithWhite(rgb, step)
    const candidate = rgbTupleToHex(mixed)
    if (getContrastRatio(candidate, '#101218') >= 4.5) {
      return {
        textOnDark: candidate,
        glowRgb: `${mixed[0]}, ${mixed[1]}, ${mixed[2]}`,
      }
    }
  }

  return {
    textOnDark: '#F8FAFC',
    glowRgb: '249, 115, 22',
  }
}

export function getWorkshopTheme(primaryColor?: string | null): WorkshopTheme {
  const hex = normalizeHexColor(primaryColor, DEFAULT_BRAND_HEX)
  const [r, g, b] = hexToRgbTuple(hex)
  const rgb = `${r}, ${g}, ${b}`
  const fg = getContrastForeground(hex)
  const { textOnDark, glowRgb } = resolveAccessibleAccentOnDark(hex)

  const cssVars = {
    '--brand-hex': hex,
    '--brand-rgb': rgb,
    '--brand-fg': fg,
    '--brand-text': textOnDark,
    '--brand-glow-rgb': glowRgb,
  } as React.CSSProperties

  return {
    hex,
    rgb,
    fg,
    textOnDark,
    glowRgb,
    cssVars,
  }
}

export function getWorkshopMonogram(name: string): string {
  const words = name
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0)

  if (words.length === 0) return 'MT'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return `${words[0][0]}${words[1][0]}`.toUpperCase()
}

export function cleanWhatsAppPhone(phone?: string | null): string {
  return (phone || '').replace(/\D/g, '')
}

export function formatWhatsAppDisplay(phone?: string | null): string {
  const digits = cleanWhatsAppPhone(phone)
  if (!digits) return ''
  if (digits.startsWith('57') && digits.length === 12) {
    return `+57 ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
  }
  return phone?.trim() || digits
}
