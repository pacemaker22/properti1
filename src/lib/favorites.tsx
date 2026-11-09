import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

const STORAGE_KEY = 'properti1:favorites'

const readStoredFavorites = (): string[] => {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((id): id is string => typeof id === 'string')
  } catch {
    return []
  }
}

interface FavoritesContextValue {
  favoriteIds: string[]
  count: number
  isFavorite: (propertyId: string) => boolean
  toggleFavorite: (propertyId: string) => void
  clearFavorites: () => void
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null)

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favoriteIds, setFavoriteIds] = useState<string[]>(readStoredFavorites)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(favoriteIds))
    } catch {
      // Ignore storage failures (private mode / quota) and keep the in-memory state working.
    }
  }, [favoriteIds])

  const toggleFavorite = useCallback((propertyId: string) => {
    setFavoriteIds((current) =>
      current.includes(propertyId)
        ? current.filter((id) => id !== propertyId)
        : [...current, propertyId],
    )
  }, [])

  const value = useMemo<FavoritesContextValue>(
    () => ({
      favoriteIds,
      count: favoriteIds.length,
      isFavorite: (propertyId: string) => favoriteIds.includes(propertyId),
      toggleFavorite,
      clearFavorites: () => setFavoriteIds([]),
    }),
    [favoriteIds, toggleFavorite],
  )

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (!context) throw new Error('useFavorites must be used inside FavoritesProvider')
  return context
}
