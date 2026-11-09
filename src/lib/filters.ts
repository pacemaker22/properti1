import type { Property, SortOption } from '../types/property'

export interface Filters {
  city: string
  type: string
  priceRange: string
  bedrooms: string
  status: string
}

export const initialFilters: Filters = {
  city: '',
  type: '',
  priceRange: '',
  bedrooms: '',
  status: '',
}

/**
 * Price buckets are half-open so a listing never appears in two ranges.
 * Rp 0 – 500 juta | 500 juta – 1 miliar | 1 – 2 miliar | 2 miliar ke atas.
 */
export const priceRanges: Record<string, { min: number; max: number }> = {
  'under-500': { min: 0, max: 500_000_000 },
  '500-1000': { min: 500_000_000, max: 1_000_000_000 },
  '1000-2000': { min: 1_000_000_000, max: 2_000_000_000 },
  'over-2000': { min: 2_000_000_000, max: Number.MAX_SAFE_INTEGER },
}

const matchesPriceRange = (price: number, priceRange: string) => {
  if (!priceRange) return true
  const bounds = priceRanges[priceRange]
  if (!bounds) return true
  return price >= bounds.min && price < bounds.max
}

export const matchesFilters = (property: Property, filters: Filters, query: string) => {
  const normalizedQuery = query.trim().toLocaleLowerCase('id-ID')
  const bedroomCount = Number(filters.bedrooms) || 0

  const searchText = [
    property.title,
    property.city,
    property.district,
    property.type,
    property.description,
  ]
    .join(' ')
    .toLocaleLowerCase('id-ID')

  const matchesQuery = !normalizedQuery || searchText.includes(normalizedQuery)
  const matchesCity = !filters.city || property.city === filters.city
  const matchesType = !filters.type || property.type === filters.type
  const matchesStatus = !filters.status || property.status === filters.status
  const matchesBedrooms =
    !bedroomCount || (bedroomCount === 4 ? property.bedrooms >= 4 : property.bedrooms === bedroomCount)
  const matchesPrice = matchesPriceRange(property.price, filters.priceRange)

  return matchesQuery && matchesCity && matchesType && matchesStatus && matchesBedrooms && matchesPrice
}

export const sortProperties = (list: Property[], sort: SortOption) => {
  const sorted = [...list]
  switch (sort) {
    case 'termurah':
      return sorted.sort((first, second) => first.price - second.price)
    case 'termahal':
      return sorted.sort((first, second) => second.price - first.price)
    case 'terpopuler':
      return sorted.sort((first, second) => second.view_count - first.view_count)
    default:
      return sorted.sort(
        (first, second) =>
          new Date(second.created_at).getTime() - new Date(first.created_at).getTime(),
      )
  }
}
