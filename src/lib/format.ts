export type PerformancePeriod = 'this_month' | 'last_month' | 'last_90d' | 'all'

export const PERFORMANCE_PERIOD_LABELS: Record<PerformancePeriod, string> = {
  this_month: 'Este mes',
  last_month: 'Mes anterior',
  last_90d: 'Últimos 90 días',
  all: 'Todo el historial',
}

export function normalizePerformancePeriod(value?: string | null): PerformancePeriod {
  if (value === 'last_month' || value === 'last_90d' || value === 'all') {
    return value
  }
  return 'this_month'
}

export function formatCOP(amount: number): string {
  const safeAmount = Number.isFinite(amount) ? Math.round(amount) : 0
  return `$${safeAmount.toLocaleString('es-CO')}`
}

/**
 * Devuelve año, mes (1-12) y día (1-31) actuales en America/Bogota (UTC-5 fijo).
 */
export function getBogotaDateParts(reference: Date = new Date()): {
  year: number
  month: number
  day: number
} {
  const formatted = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(reference)

  const [yearStr, monthStr, dayStr] = formatted.split('-')
  return {
    year: Number(yearStr),
    month: Number(monthStr),
    day: Number(dayStr),
  }
}

function bogotaMonthStartMs(year: number, month: number): number {
  // Colombia (America/Bogota) es UTC-5 todo el año (00:00 COT == 05:00 UTC)
  return Date.UTC(year, month - 1, 1, 5, 0, 0, 0)
}

export function getBogotaPeriodRange(
  period: PerformancePeriod,
  reference: Date = new Date()
): { startMs: number | null; endMs: number | null; label: string } {
  const { year, month } = getBogotaDateParts(reference)
  const currentMonthStart = bogotaMonthStartMs(year, month)
  const nextMonthYear = month === 12 ? year + 1 : year
  const nextMonth = month === 12 ? 1 : month + 1
  const nextMonthStart = bogotaMonthStartMs(nextMonthYear, nextMonth)

  if (period === 'this_month') {
    return {
      startMs: currentMonthStart,
      endMs: nextMonthStart,
      label: formatBogotaMonthName(year, month),
    }
  }

  if (period === 'last_month') {
    const prevMonthYear = month === 1 ? year - 1 : year
    const prevMonth = month === 1 ? 12 : month - 1
    return {
      startMs: bogotaMonthStartMs(prevMonthYear, prevMonth),
      endMs: currentMonthStart,
      label: formatBogotaMonthName(prevMonthYear, prevMonth),
    }
  }

  if (period === 'last_90d') {
    return {
      startMs: reference.getTime() - 90 * 24 * 60 * 60 * 1000,
      endMs: null,
      label: 'Últimos 90 días',
    }
  }

  return {
    startMs: null,
    endMs: null,
    label: 'Todo el historial',
  }
}

export function isTimestampInRange(
  isoString: string | null | undefined,
  startMs: number | null,
  endMs: number | null
): boolean {
  if (!isoString) return startMs === null && endMs === null
  const ms = Date.parse(isoString)
  if (Number.isNaN(ms)) return false
  if (startMs !== null && ms < startMs) return false
  if (endMs !== null && ms >= endMs) return false
  return true
}

function formatBogotaMonthName(year: number, month: number): string {
  const midMonthUtc = new Date(Date.UTC(year, month - 1, 15, 12, 0, 0))
  const text = new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    month: 'long',
    year: 'numeric',
  }).format(midMonthUtc)
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function formatBogotaDate(isoString: string | null | undefined): string {
  if (!isoString) return '—'
  const d = new Date(isoString)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

export function formatBogotaDateTime(isoString: string | null | undefined): string {
  if (!isoString) return '—'
  const d = new Date(isoString)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}
