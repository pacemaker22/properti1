/**
 * Moderation status of a listing. Sellers always insert `pending`; only an
 * admin panel may flip the row to `approved` (or `rejected`). Buyer pages read
 * `approved` rows only.
 */
export type ListingModerationStatus = 'pending' | 'approved' | 'rejected'

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
  admin_status: ListingModerationStatus
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
  admin_status?: ListingModerationStatus
}

export type PropertyUpdate = Partial<Omit<PropertyInsert, 'id'>>

export type PropertyPrivateDetailsRow = {
  property_id: string
  seller_id: string
  private_address: string
  updated_at: string
}

/**
 * A saved listing (the heart). Created by migration
 * 20261113000000_admin_security.sql. `user_id` defaults to `auth.uid()` and is
 * pinned by RLS, so the client only ever sends its own session.
 */
export type FavoriteRow = {
  id: string
  user_id: string
  property_id: string
  created_at: string
}

/** The reasons the reports table accepts (CHECK constraint in the migration). */
export type ReportReason =
  | 'spam'
  | 'foto_meniru'
  | 'data_palsu'
  | 'sudah_terjual'
  | 'tidak_sesuai_iklan'
  | 'lainnya'

export type ReportRow = {
  id: string
  property_id: string
  reporter_id: string
  reporter_email: string
  reason: ReportReason
  reason_note: string
  status: 'baru' | 'diterima' | 'ditolak'
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
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
      favorites: {
        Row: FavoriteRow
        Insert: {
          id?: string
          user_id: string
          property_id: string
          created_at?: string
        }
        Update: {
          property_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: ReportRow
        Insert: {
          id?: string
          property_id: string
          reporter_id: string
          reporter_email: string
          reason: ReportReason
          reason_note?: string
          status?: ReportRow['status']
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
        }
        Update: {
          status?: ReportRow['status']
          reviewed_by?: string | null
          reviewed_at?: string | null
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
