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
  /** Review trail written by the admin panel (20261113000000_admin_security.sql). */
  reviewed_by?: string | null
  reviewed_at?: string | null
  review_note?: string
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
  reviewed_by?: string | null
  reviewed_at?: string | null
  review_note?: string
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
  status: 'baru' | 'pending' | 'selesai' | 'ditolak'
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}

/**
 * One approve/reject decision for a listing, stored in property_moderation
 * (live schema: id, property_id, admin_id, action, review_note, created_at).
 * The moderation queue is every property that has no row here yet.
 */
export type ModerationAction = 'approved' | 'rejected'

export type PropertyModerationRow = {
  id: string
  property_id: string
  admin_id: string
  action: ModerationAction
  review_note: string
  created_at: string
}

export type PropertyModerationInsert = {
  id?: string
  property_id: string
  admin_id: string
  action: ModerationAction
  review_note?: string
  created_at?: string
}

/**
 * One row per auth user (migration 20261113000000_admin_security.sql).
 * `is_admin` is the single source of truth for the admin role. It is SELECT-only
 * for app roles - no column grant exists - so the type deliberately has no way
 * to write it; profiles are created by the auth trigger, never by the client.
 */
export type ProfileRow = {
  id: string
  email: string
  full_name: string
  phone: string
  is_admin: boolean
  created_at: string
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
        Relationships: [
          {
            foreignKeyName: 'reports_property_id_fkey'
            columns: ['property_id']
            isOneToOne: false
            referencedRelation: 'properties'
            referencedColumns: ['id']
          },
        ]
      }
      property_moderation: {
        Row: PropertyModerationRow
        Insert: PropertyModerationInsert
        Update: {
          review_note?: string
        }
        Relationships: []
      }
      profiles: {
        Row: ProfileRow
        // Profile rows are created by the auth trigger; the client never inserts.
        Insert: {
          id: string
          email?: string
          full_name?: string
          phone?: string
          created_at?: string
          updated_at?: string
        }
        // Only full_name / phone are granted to app roles - is_admin is immutable.
        Update: {
          full_name?: string
          phone?: string
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
