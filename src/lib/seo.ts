import { formatRupiah, statusLabels, typeLabels } from './format'
import type { Property } from '../types/property'

/**
 * SEO helpers: canonical URLs, social meta tags and schema.org data.
 *
 * All values are derived from environment variables so the same build works on
 * a Vercel preview URL, a staging alias and the production domain.
 */

const normalizeBase = (value: string) => value.trim().replace(/\/+$/, '')

export const HOME_DESCRIPTION =
  'Cari rumah, apartemen, tanah, dan ruko di Jakarta, Bekasi, Tangerang, Depok, Bogor, dan Bandung. Chat langsung dengan penjual lewat WhatsApp tanpa daftar.'

const FALLBACK_BASE = 'https://properti1.com'

export const SITE_NAME = 'properti1.com'
export const SITE_TAGLINE = 'Cari Rumah Impianmu'

/** Home page <title>. */
export const HOME_TITLE = 'Cari Rumah Impianmu - properti1.com'

/** Builds a <title> in the "Page - properti1.com" convention. */
export const pageTitle = (page: string) => page + ' - ' + SITE_NAME

const readBaseUrl = (): string => {
  const configured = normalizeBase(import.meta.env.VITE_SITE_URL ?? '')
  if (configured) return configured
  if (typeof window !== 'undefined') return normalizeBase(window.location.origin)
  return FALLBACK_BASE
}

export const siteBaseUrl = () => readBaseUrl()

/** Absolute URL for a route path such as `/properti/abc`. */
export const absoluteUrl = (path = '/') => {
  const route = path.startsWith('/') ? path : `/${path}`
  return `${readBaseUrl()}${route === '/' ? '' : route}`
}

export const DEFAULT_OG_IMAGE_URL =
  import.meta.env.VITE_OG_IMAGE_URL?.trim() || absoluteUrl('/og-image.svg')

/** Trims text to a meta-description friendly length on whole words. */
export const truncate = (text: string, max = 158) => {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(' ')
  return `${cut.slice(0, lastSpace > 60 ? lastSpace : cut.length)}…`
}

const describeSpecs = (property: Property) => {
  const parts = [
    `${typeLabels[property.type]} ${statusLabels[property.status].toLowerCase()}`,
  ]
  if (property.bedrooms > 0) parts.push(`${property.bedrooms} kamar tidur`)
  if (property.bathrooms > 0) parts.push(`${property.bathrooms} kamar mandi`)
  if (property.land_area > 0) parts.push(`LT ${property.land_area} m²`)
  if (property.building_area > 0) parts.push(`LB ${property.building_area} m²`)
  return parts.join(' • ')
}

export const listingUrl = (propertyId: string) => absoluteUrl(`/properti/${propertyId}`)

export const listingMetaDescription = (property: Property) =>
  truncate(
    `${property.title} di ${property.district}, ${property.city}. Harga ${formatRupiah(property.price)}. ` +
      `${describeSpecs(property)}. Sertifikat ${property.certificate}. Chat langsung dengan agen via WhatsApp.`,
  )

const availabilityFor = (property: Property) =>
  property.status === 'terjual'
    ? 'https://schema.org/SoldOut'
    : 'https://schema.org/InStock'

/** schema.org RealEstateListing for the detail page. */
export const propertyJsonLd = (property: Property) => ({
  '@context': 'https://schema.org',
  '@type': 'RealEstateListing',
  name: property.title,
  description: property.description,
  url: listingUrl(property.id),
  image: property.photos.slice(0, 6),
  datePosted: property.created_at,
  offers: {
    '@type': 'Offer',
    price: property.price,
    priceCurrency: 'IDR',
    availability: availabilityFor(property),
    url: listingUrl(property.id),
  },
  address: {
    '@type': 'PostalAddress',
    addressLocality: property.city,
    addressRegion: property.district,
    addressCountry: 'ID',
  },
})

/** schema.org WebSite + SearchAction, used on the homepage for sitelinks search. */
export const websiteJsonLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  alternateName: 'properti1',
  url: absoluteUrl('/'),
  inLanguage: 'id-ID',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: absoluteUrl('/?q={search_term_string}'),
    },
    'query-input': 'required name=search_term_string',
  },
})

