export type PropertyRow = {
  id: string
  title: string
  price: number
  type: string
  status: string
  city: string
  district: string
  bedrooms: number
  bathrooms: number
  land_area: number
  building_area: number
  certificate: string
  description: string
  photos: string[]
  agent_name: string
  whatsapp: string
  is_sold: boolean
  created_at: string
  is_featured: boolean
  seller_id: string | null
  floors: number
  parking: number
  year_built: number
  furnished: boolean
  electricity: number
  agent_photo: string
  view_count: number
}

export type PropertyInsert = {
  id?: string
  title: string
  price: number
  type: string
  status: string
  city: string
  district: string
  bedrooms: number
  bathrooms: number
  land_area: number
  building_area: number
  certificate: string
  description: string
  photos: string[]
  agent_name: string
  whatsapp: string
  is_sold?: boolean
  created_at?: string
  is_featured?: boolean
  seller_id: string
  floors?: number
  parking?: number
  year_built?: number
  furnished?: boolean
  electricity?: number
  agent_photo?: string
  view_count?: number
}

export type PropertyUpdate = Partial<Omit<PropertyInsert, 'id'>>

export type PropertyPrivateDetailsRow = {
  property_id: string
  seller_id: string
  private_address: string
  updated_at: string
}

export type Database = {
  public: {
    Tables: {
      properties: {
        Row: PropertyRow
        Insert: PropertyInsert
        Update: PropertyUpdate
        Relationships: []
      }
      property_private_details: {
        Row: PropertyPrivateDetailsRow
        Insert: {
          property_id: string
          seller_id: string
          private_address?: string
          updated_at?: string
        }
        Update: {
          private_address?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
