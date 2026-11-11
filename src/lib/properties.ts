import type { Property } from '../types/property'

export const listingCities = [
  'Jakarta Selatan',
  'Jakarta Timur',
  'Jakarta Barat',
  'Jakarta Utara',
  'Jakarta Pusat',
  'Bekasi',
  'Tangerang',
  'Depok',
  'Bogor',
  'Bandung',
  'Surabaya',
]

export const NEW_LISTING_WINDOW_DAYS = 7

export const isNewListing = (property: Property) =>
  Date.now() - new Date(property.created_at).getTime() <
  NEW_LISTING_WINDOW_DAYS * 24 * 60 * 60 * 1000

const PRICE_BANDS = [
  { min: 0, max: 500_000_000 },
  { min: 500_000_000, max: 1_000_000_000 },
  { min: 1_000_000_000, max: 2_000_000_000 },
  { min: 2_000_000_000, max: Number.POSITIVE_INFINITY },
]

export const getSimilarProperties = (
  property: Property,
  count = 3,
  source: Property[] = [],
) => {
  const candidates = source.filter(
    (item) => item.id !== property.id && item.status !== 'terjual',
  )

  const band = PRICE_BANDS.find(
    (item) => property.price >= item.min && property.price <= item.max,
  ) ?? PRICE_BANDS[0]

  const score = (item: Property) => {
    const sameCity = item.city === property.city ? 0 : 1
    const sameType = item.type === property.type ? 0 : 1
    const sameBand = item.price >= band.min && item.price <= band.max ? 0 : 1
    return sameCity * 100 + sameType * 10 + sameBand
  }

  return [...candidates]
    .sort((first, second) => score(first) - score(second) || first.price - second.price)
    .slice(0, count)
}
