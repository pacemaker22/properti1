import propertiesData from '../data/properties.json'
import type { Property } from '../types/property'

export const properties = propertiesData as Property[]

export const cities = [...new Set(properties.map((property) => property.city))].sort()

export const NEW_LISTING_WINDOW_DAYS = 7

const newestListingTimestamp = Math.max(
  ...properties.map((property) => new Date(property.created_at).getTime()),
)

/**
 * The newest listing in the mock dataset is treated as "today" so the "Baru"
 * badge stays meaningful no matter when the demo is opened.
 */
export const isNewListing = (property: Property) =>
  newestListingTimestamp - new Date(property.created_at).getTime() <
  NEW_LISTING_WINDOW_DAYS * 24 * 60 * 60 * 1000

export const getPropertyById = (id?: string) =>
  properties.find((property) => property.id === id)

const PRICE_BANDS = [
  { min: 0, max: 500_000_000 },
  { min: 500_000_000, max: 1_000_000_000 },
  { min: 1_000_000_000, max: 2_000_000_000 },
  { min: 2_000_000_000, max: Number.POSITIVE_INFINITY },
]

export const getSimilarProperties = (property: Property, count = 3) => {
  const candidates = properties.filter(
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
