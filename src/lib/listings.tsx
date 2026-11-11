import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from './auth'
import { isSupabaseConfigured } from './supabase'

import {
  createProperty,
  deleteProperty,
  fetchProperties,
  setPropertySold,
  updateProperty,
  type ListingDraft,
} from './property-api'
import type { Property, PropertyStatus } from '../types/property'

export type { ListingDraft } from './property-api'

interface ListingsContextValue {
  listings: Property[]
  myListings: Property[]
  loading: boolean
  error: string | null
  getListing: (id?: string) => Property | undefined
  addListing: (draft: ListingDraft) => Promise<Property>
  updateListing: (
    id: string,
    draft: ListingDraft,
  ) => Promise<Property | undefined>
  deleteListing: (id: string) => Promise<void>
  setListingSold: (id: string, sold: boolean) => Promise<void>
  refreshListings: () => Promise<void>
}

const ListingsContext = createContext<ListingsContextValue | null>(null)

export function ListingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()

  const [listings, setListings] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [previousStatuses, setPreviousStatuses] = useState<
    Record<string, Exclude<PropertyStatus, 'terjual'>>
  >({})

  const refreshListings = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const nextListings = await fetchProperties(user?.id)
      setListings(nextListings)
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : 'Gagal memuat properti.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    void refreshListings()
  }, [refreshListings])

  const getListing = useCallback(
    (id?: string) => listings.find((listing) => listing.id === id),
    [listings],
  )

  const addListing = useCallback(
    async (draft: ListingDraft) => {
      const listing = await createProperty(draft, user?.id ?? 'local-seller')
      setListings((current) => [listing, ...current])
      return listing
    },
    [user],
  )

  const updateListing = useCallback(
    async (id: string, draft: ListingDraft) => {
      const existing = listings.find((listing) => listing.id === id)
      if (!existing) return undefined
      const listing = await updateProperty(existing, draft, user?.id ?? 'local-seller')
      setListings((current) =>
        current.map((item) => (item.id === id ? listing : item)),
      )
      return listing
    },
    [listings, user],
  )

  const deleteListing = useCallback(
    async (id: string) => {
      const existing = listings.find((listing) => listing.id === id)
      if (!existing) return
      await deleteProperty(existing, user?.id ?? 'local-seller')
      setListings((current) => current.filter((listing) => listing.id !== id))
    },
    [listings, user],
  )

  const setListingSold = useCallback(
    async (id: string, sold: boolean) => {
      const listing = listings.find((item) => item.id === id)
      if (!listing) return

      let previousStatus: Exclude<PropertyStatus, 'terjual'> = 'dijual'
      if (sold) {
        previousStatus =
          listing.status === 'terjual'
            ? previousStatuses[id] ?? 'dijual'
            : listing.status
        setPreviousStatuses((current) => ({ ...current, [id]: previousStatus }))
      } else {
        previousStatus = previousStatuses[id] ?? 'dijual'
        setPreviousStatuses((current) => {
          const next = { ...current }
          delete next[id]
          return next
        })
      }

      const updated = await setPropertySold(
        listing,
        sold,
        user?.id ?? 'local-seller',
        previousStatus,
      )
      setListings((current) =>
        current.map((item) => (item.id === id ? updated : item)),
      )
    },
    [listings, previousStatuses, user],
  )

  const myListings = useMemo(() => {
    if (!isSupabaseConfigured) return listings
    return user
      ? listings.filter((listing) => listing.seller_id === user.id)
      : []
  }, [listings, user])

  const value = useMemo<ListingsContextValue>(
    () => ({
      listings,
      myListings,
      loading,
      error,
      getListing,
      addListing,
      updateListing,
      deleteListing,
      setListingSold,
      refreshListings,
    }),
    [
      listings,
      myListings,
      loading,
      error,
      getListing,
      addListing,
      updateListing,
      deleteListing,
      setListingSold,
      refreshListings,
    ],
  )

  return <ListingsContext.Provider value={value}>{children}</ListingsContext.Provider>
}

export function useListings() {
  const context = useContext(ListingsContext)
  if (!context) throw new Error('useListings must be used inside ListingsProvider')
  return context
}
