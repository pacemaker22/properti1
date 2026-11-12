import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const configuredUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const configuredAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

const isPlaceholderUrl =
  configuredUrl === 'https://your-project-ref.supabase.co' ||
  configuredUrl === 'https://placeholder.supabase.co'
const isPlaceholderKey =
  configuredAnonKey === 'your-anon-or-publishable-key' ||
  configuredAnonKey === 'missing-anon-key'

export const isSupabaseConfigured = Boolean(
  configuredUrl &&
    configuredAnonKey &&
    !isPlaceholderUrl &&
    !isPlaceholderKey,
)

if (!isSupabaseConfigured) {
  const missing = [
    !configuredUrl ? 'VITE_SUPABASE_URL' : null,
    !configuredAnonKey ? 'VITE_SUPABASE_ANON_KEY' : null,
  ].filter((name): name is string => Boolean(name))

  console.error(
    `[Supabase] Koneksi database belum dikonfigurasi. ` +
      `${missing.length > 0 ? `Variabel berikut kosong: ${missing.join(', ')}.` : 'Nilai yang terisi masih placeholder.'} ` +
      'Salin .env.example menjadi .env.local lalu isi dari Supabase > Project Settings > API, ' +
      'kemudian jalankan ulang npm run dev. Tidak ada key yang di-hardcode di kode sumber.',
  )
}

/**
 * The client below uses the values from import.meta.env. When they are missing
 * the requests fail instead of silently reading a bundled mock dataset, so a
 * broken .env.local is always visible in the console.
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
