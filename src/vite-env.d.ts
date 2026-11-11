/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  /** Public site URL used for canonical / OG / sitemap links. Falls back to the current origin. */
  readonly VITE_SITE_URL?: string
  /** Absolute URL of the default social share image. Falls back to /og-image.svg. */
  readonly VITE_OG_IMAGE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
