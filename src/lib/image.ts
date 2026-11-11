/**
 * Image URL helpers.
 *
 * Photos come from Unsplash (mock data) and Supabase Storage (seller uploads).
 * Both accept size hints through the URL, so we never serve a full-size image
 * to a small phone screen.
 *
 * Keep this file framework-free: scripts/generate-sitemap.mjs imports it from
 * Node to resolve photo URLs for the image sitemap.
 */

/** Widths used by the card grid (1 column mobile -> 3 columns desktop). */
export const CARD_IMAGE_WIDTHS = [320, 480, 640, 800]
/** Widths used by the detail hero, which is full width on mobile. */
export const HERO_IMAGE_WIDTHS = [640, 960, 1280, 1600]

export const CARD_IMAGE_SIZES = '(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 380px'
export const HERO_IMAGE_SIZES = '(max-width: 1024px) 100vw, 800px'

const atWidth = (url: string, width: number): string => {
  try {
    const parsed = new URL(url)

    if (parsed.hostname === 'images.unsplash.com') {
      parsed.searchParams.set('auto', 'format')
      parsed.searchParams.set('fit', 'crop')
      parsed.searchParams.set('w', String(width))
      parsed.searchParams.set('q', '75')
      return parsed.toString()
    }

    if (
      parsed.pathname.includes('/storage/v1/object/public/') &&
      parsed.searchParams.has('width')
    ) {
      parsed.searchParams.set('width', String(width))
    }

    return parsed.toString()
  } catch {
    return url
  }
}

const getWidthCandidates = (url: string, widths: readonly number[]): readonly number[] | null => {
  try {
    const parsed = new URL(url)
    if (!/^https?:$/.test(parsed.protocol)) return null

    // A Supabase transform URL is already sized.
    if (Number(parsed.searchParams.get('width')) > 0) return widths

    if (parsed.hostname === 'images.unsplash.com') return widths

    // Uploaded originals / custom CDN: serve as-is, no srcSet.
    return null
  } catch {
    return null
  }
}

interface ImageSources {
  src: string
  srcSet?: string
  sizes?: string
}

/**
 * Returns a `src` plus an optional responsive `srcSet` for a photo.
 * Hosts that cannot resize on the fly simply get the original URL back.
 */
export const buildImageSources = (
  url: string | undefined,
  widths: readonly number[],
  sizes: string,
): ImageSources | null => {
  if (!url) return null

  const candidates = getWidthCandidates(url, widths)
  if (!candidates || candidates.length === 0) return { src: url }

  return {
    src: atWidth(url, candidates[0]),
    srcSet: candidates.map((w) => `${atWidth(url, w)} ${w}w`).join(', '),
    sizes,
  }
}

