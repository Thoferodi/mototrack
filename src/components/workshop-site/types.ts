export type ServiceCategoryKey =
  | 'preventive'
  | 'injection'
  | 'brakes'
  | 'suspension'
  | 'drivetrain'
  | 'electrical'
  | 'general'

export interface PublicWorkshopData {
  id: string
  name: string
  slug: string
  logo_url: string | null
  address: string | null
  phone_whatsapp: string | null
  primary_color: string | null
}

export interface PublicServiceItem {
  id: string
  name: string
  description: string
  default_price: number | null
  sku: string | null
  isFallback: boolean
  categoryKey: ServiceCategoryKey
}

export interface WorkshopPublicStats {
  orderCount: number
}
