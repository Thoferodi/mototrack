'use client'

import * as React from 'react'
import {
  AlertCircle,
  Bike,
  Clock,
  ExternalLink,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  User,
  Wrench,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cleanWhatsAppPhone, formatWhatsAppDisplay } from '@/lib/workshop-theme'
import type { PublicServiceItem } from './types'

interface WhatsAppQuoteSectionProps {
  workshopName: string
  address?: string | null
  phoneWhatsapp?: string | null
  services: PublicServiceItem[]
  selectedService: string
  onSelectedServiceChange: (serviceName: string) => void
}

const CUSTOM_SERVICE_OPTION = 'Otro servicio / Diagnóstico general'

export function WhatsAppQuoteSection({
  workshopName,
  address,
  phoneWhatsapp,
  services,
  selectedService,
  onSelectedServiceChange,
}: WhatsAppQuoteSectionProps) {
  const [bikeModel, setBikeModel] = React.useState('')
  const [notes, setNotes] = React.useState('')
  const [riderName, setRiderName] = React.useState('')
  const [validationError, setValidationError] = React.useState<string | null>(null)

  const cleanPhone = cleanWhatsAppPhone(phoneWhatsapp)
  const formattedPhone = formatWhatsAppDisplay(phoneWhatsapp)
  const cleanAddress = address?.trim() || ''
  const mapsUrl = cleanAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanAddress)}`
    : null

  const serviceOptions = React.useMemo(() => {
    const names = services.map((s) => s.name)
    if (!names.includes(CUSTOM_SERVICE_OPTION)) {
      names.push(CUSTOM_SERVICE_OPTION)
    }
    return names
  }, [services])

  const activeService = selectedService || serviceOptions[0] || CUSTOM_SERVICE_OPTION

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!cleanPhone) return

    const trimmedBike = bikeModel.trim()
    if (!trimmedBike) {
      setValidationError('Indícanos la marca o modelo de tu moto para preparar la cotización.')
      return
    }

    setValidationError(null)

    const lines = [
      `Hola equipo de *${workshopName}*, me gustaría agendar una cita o cotizar un servicio:`,
      '',
      `• *Servicio:* ${activeService}`,
      `• *Moto:* ${trimmedBike}`,
      notes.trim() ? `• *Cilindraje / Detalle:* ${notes.trim()}` : null,
      riderName.trim() ? `• *Nombre:* ${riderName.trim()}` : null,
      '',
      'Solicitud enviada desde su sitio web oficial en MotoTrack.',
    ].filter((line): line is string => line !== null)

    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(lines.join('\n'))}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <section
      id="agendar"
      className="relative overflow-x-clip border-t border-white/[0.06] bg-[#090B10] py-20 lg:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl space-y-3 mb-10">
          <span
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-widest"
            style={{
              borderColor: 'rgba(var(--brand-glow-rgb), 0.35)',
              backgroundColor: 'rgba(var(--brand-glow-rgb), 0.1)',
              color: 'var(--brand-text)',
            }}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Cotizador y Citas
          </span>
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Agenda tu cita o cotiza por WhatsApp
          </h2>
          <p className="text-sm sm:text-base text-slate-400">
            Completa los datos básicos de tu motocicleta y envía una solicitud ordenada directo al
            WhatsApp de {workshopName}.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
          {/* Izquierda: Cotizador interactivo */}
          <div className="min-w-0 lg:col-span-7">
            <div className="relative rounded-2xl border border-white/10 bg-[#101218] p-5 sm:p-7 shadow-[0_24px_70px_rgba(0,0,0,0.65)]">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-8 -top-px h-px"
                style={{
                  background:
                    'linear-gradient(90deg, transparent 0%, rgba(var(--brand-glow-rgb), 0.8) 50%, transparent 100%)',
                }}
              />

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="quote-service" className="text-xs font-semibold text-slate-300">
                    Servicio de interés
                  </Label>
                  <div className="relative">
                    <Wrench className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <select
                      id="quote-service"
                      value={activeService}
                      onChange={(e) => onSelectedServiceChange(e.target.value)}
                      disabled={!cleanPhone}
                      className="flex h-11 w-full rounded-xl border border-white/10 bg-[#08090C] pl-10 pr-4 text-sm text-white focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/25 disabled:opacity-50 [color-scheme:dark]"
                    >
                      {serviceOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="quote-bike" className="text-xs font-semibold text-slate-300">
                      Marca y modelo de tu moto *
                    </Label>
                    <div className="relative">
                      <Bike className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                      <Input
                        id="quote-bike"
                        value={bikeModel}
                        onChange={(e) => {
                          setBikeModel(e.target.value)
                          if (validationError) setValidationError(null)
                        }}
                        placeholder="Ej. Yamaha FZ 25 / Pulsar NS200"
                        disabled={!cleanPhone}
                        className="h-11 rounded-xl border-white/10 bg-[#08090C] pl-10 text-white placeholder:text-slate-500 focus-visible:border-white/30 focus-visible:ring-1 focus-visible:ring-white/25 focus-visible:ring-offset-0 [color-scheme:dark]"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quote-name" className="text-xs font-semibold text-slate-300">
                      Tu nombre (opcional)
                    </Label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                      <Input
                        id="quote-name"
                        value={riderName}
                        onChange={(e) => setRiderName(e.target.value)}
                        placeholder="Ej. Andrés Felipe"
                        disabled={!cleanPhone}
                        className="h-11 rounded-xl border-white/10 bg-[#08090C] pl-10 text-white placeholder:text-slate-500 focus-visible:border-white/30 focus-visible:ring-1 focus-visible:ring-white/25 focus-visible:ring-offset-0 [color-scheme:dark]"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quote-notes" className="text-xs font-semibold text-slate-300">
                    Cilindraje o comentario breve (opcional)
                  </Label>
                  <textarea
                    id="quote-notes"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={!cleanPhone}
                    placeholder="Ej. 250 cc, 18.000 km. Quisiera disponibilidad para esta semana en la mañana."
                    className="w-full rounded-xl border border-white/10 bg-[#08090C] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/25 disabled:opacity-50 [color-scheme:dark]"
                  />
                </div>

                {validationError && (
                  <div
                    role="alert"
                    className="flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-medium text-rose-200"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                    <span>{validationError}</span>
                  </div>
                )}

                {!cleanPhone && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-200">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                    <span>
                      Este taller aún no tiene un número de WhatsApp público configurado. Puedes
                      acercarte directamente a su sede o consultar el estado de tu moto arriba.
                    </span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={!cleanPhone}
                  className="h-12 w-full rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-transform duration-150 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100"
                  style={{
                    backgroundColor: 'var(--brand-hex)',
                    color: 'var(--brand-fg)',
                    boxShadow: cleanPhone
                      ? '0 0 28px rgba(var(--brand-glow-rgb), 0.3)'
                      : 'none',
                  }}
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Enviar solicitud por WhatsApp
                </Button>
              </form>
            </div>
          </div>

          {/* Derecha: Ubicación y Contacto */}
          <div className="min-w-0 lg:col-span-5 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-[#101218] p-5 sm:p-6 space-y-5">
              <div className="border-b border-white/[0.08] pb-4">
                <h3 className="text-lg font-bold text-white">Ubicación y Contacto</h3>
                <p className="mt-1 text-xs text-slate-400">
                  Información directa de sede para recepción y entrega de motocicletas.
                </p>
              </div>

              <div className="space-y-4">
                {/* Dirección */}
                <div className="flex items-start gap-3.5">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
                    style={{
                      borderColor: 'rgba(var(--brand-glow-rgb), 0.3)',
                      backgroundColor: 'rgba(var(--brand-glow-rgb), 0.12)',
                      color: 'var(--brand-text)',
                    }}
                  >
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Dirección del Taller
                    </p>
                    <p className="text-sm font-medium text-white break-words">
                      {cleanAddress || 'Consultar dirección directamente con el taller'}
                    </p>
                    {mapsUrl && (
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-3.5 py-1.5 text-xs font-semibold text-slate-100 transition-colors hover:border-white/30 hover:bg-white/[0.08]"
                      >
                        <Navigation className="h-3.5 w-3.5" style={{ color: 'var(--brand-text)' }} />
                        Cómo llegar en Google Maps
                        <ExternalLink className="h-3 w-3 text-slate-400" />
                      </a>
                    )}
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="flex items-start gap-3.5">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
                    style={{
                      borderColor: 'rgba(var(--brand-glow-rgb), 0.3)',
                      backgroundColor: 'rgba(var(--brand-glow-rgb), 0.12)',
                      color: 'var(--brand-text)',
                    }}
                  >
                    <Phone className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      WhatsApp de Atención
                    </p>
                    <p className="font-mono text-sm font-semibold text-white">
                      {formattedPhone || 'No disponible públicamente'}
                    </p>
                  </div>
                </div>

                {/* Horario sugerido */}
                <div className="flex items-start gap-3.5">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
                    style={{
                      borderColor: 'rgba(var(--brand-glow-rgb), 0.3)',
                      backgroundColor: 'rgba(var(--brand-glow-rgb), 0.12)',
                      color: 'var(--brand-text)',
                    }}
                  >
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Horarios Sugeridos de Atención
                    </p>
                    <p className="text-xs sm:text-sm text-slate-300">
                      Lunes a Viernes: 8:00 a.m. – 6:00 p.m.
                    </p>
                    <p className="text-xs sm:text-sm text-slate-300">
                      Sábados: 8:00 a.m. – 2:00 p.m.
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Confirma disponibilidad al agendar tu cita.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
