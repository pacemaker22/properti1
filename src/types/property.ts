export type PropertyType =
  | 'rumah'
  | 'apartemen'
  | 'tanah'
  | 'ruko'
  | 'kost'
  | 'villa'
  | 'lainnya'
export type PropertyStatus = 'dijual' | 'disewa' | 'terjual'

export interface Property {
  id: string
  title: string
  price: number
  type: PropertyType
  status: PropertyStatus
  city: string
  district: string
  bedrooms: number
  bathrooms: number
  land_area: number
  building_area: number
  certificate: string
  floors: number
  parking: number
  year_built: number
  furnished: boolean
  electricity: number
  description: string
  photos: string[]
  agent_name: string
  agent_photo: string
  whatsapp: string
  private_address?: string
  seller_id?: string | null
  is_sold: boolean
  is_featured: boolean
  view_count: number
  created_at: string
}

export type SortOption = 'terbaru' | 'termurah' | 'termahal' | 'terpopuler'
