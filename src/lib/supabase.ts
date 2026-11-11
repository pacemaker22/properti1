import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const configuredUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const configuredAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

const isPlaceholderUrl = configuredUrl === 'https://your-project-ref.supabase.co'
const isPlaceholderKey = configuredAnonKey === 'your-anon-or-publishable-key'

export const isSupabaseConfigured = Boolean(
  configuredUrl &&
    configuredAnonKey &&
    !isPlaceholderUrl &&
    !isPlaceholderKey,
)

/**
 * The placeholder client keeps the application renderable before environment
 * variables are configured. Read operations use the local demo feed in that
 * state; seller mutations still require a configured Supabase project.
 */
export const supabase = createClient<Database>(
  configuredUrl || 'https://placeholder.supabase.co',
  configuredAnonKey || 'missing-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
)

export const PROPERTY_PHOTOS_BUCKET = 'property-photos'
