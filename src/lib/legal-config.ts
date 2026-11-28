export interface LegalConfig {
  readonly brandName: string
  readonly legalEntityName: string
  readonly taxId: string
  readonly jurisdictionCity: string
  readonly supportEmail: string
  readonly privacyEmail: string
  readonly lastUpdated: string
  readonly mediaRetentionDays: number
  readonly sicUrl: string
  readonly trialDays: number
  readonly annualDiscountPercent: number
}

export const LEGAL_CONFIG: LegalConfig = {
  brandName: 'MotoTrack',
  legalEntityName:
    'MotoTrack (Operado en Colombia — pendiente de actualizar razón social/titular)',
  taxId: 'NIT / RUT en trámite de actualización',
  jurisdictionCity: 'Bogotá D.C., Colombia',
  supportEmail: 'soporte@mototrack.co',
  privacyEmail: 'privacidad@mototrack.co',
  lastUpdated: '27 de noviembre de 2026',
  mediaRetentionDays: 90,
  sicUrl: 'https://www.sic.gov.co',
  trialDays: 14,
  annualDiscountPercent: 30,
}
