import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useListings } from './listings'
import { useAuth } from './auth'
import { useNotices } from './notices'
import { isSupabaseConfigured, supabase } from './supabase'

/** Sign-in prompt shown when a guest taps the heart. */
export const FAVORITE_LOGIN_PROMPT = 'Login untuk menyimpan favorit'
const FAVORITES_TABLE = 'favorites'
const FAVORITE_SAVE_MESSAGE = 'Gagal menyimpan favorit. Silakan coba lagi.'
const FAVORITE_REMOVE_MESSAGE = 'Gagal menghapus favorit. Silakan coba lagi.'
/** Buyer-facing confirmation once the row is accepted; a console log is not UI. */
const FAVORITE_SAVED_TOAST = 'Favorit disimpan'
const FAVORITE_REMOVED_TOAST = 'Favorit dihapus'

/** Loads the signed-in buyer's hearts. RLS returns only his own rows. */
const loadFavorites = async (userId: string): Promise<string[]> => {
  const { data, error: queryError } = await supabase
    .from(FAVORITES_TABLE)
    .select('property_id')
    .eq('user_id', userId)

  if (queryError) {
    console.warn('[favorites] Gagal memuat favorit:', queryError.message)
    return []
  }

  return (data ?? []).map((row) => row.property_id)
}

interface FavoritesContextValue {
  favoriteIds: string[]
  count: number
  isFavorite: (propertyId: string) => boolean
  toggleFavorite: (propertyId: string) => void
  removeFavorite: (propertyId: string) => void
  clearFavorites: () => void
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null)

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { listings, loading, error } = useListings()
  const { user, authLoading } = useAuth()
  const { requireLogin, toFriendlyMessage, notify, notifyError } = useNotices()
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])
  const userId = user?.id ?? null
  const listingIds = useMemo(
    () => new Set(listings.map((listing) => listing.id)),
    [listings],
  )

  useEffect(() => {
    if (authLoading) return

    if (!userId) {
      setFavoriteIds([])
      return
    }

    if (!isSupabaseConfigured) return

    let active = true

    void loadFavorites(userId).then((ids) => {
      if (active) setFavoriteIds(ids)
    })

    return () => {
      active = false
    }
  }, [authLoading, userId])

  useEffect(() => {
    if (loading || error) return
    setFavoriteIds((current) => {
      const validIds = current.filter((id) => listingIds.has(id))
      return validIds.length === current.length ? current : validIds
    })
  }, [listingIds, loading, error])
  const toggleFavorite = useCallback(
    (propertyId: string) => {
      // Guests get the prompt toast plus the auth modal, and nothing is written.
      if (!requireLogin(FAVORITE_LOGIN_PROMPT) || !user) return

      const saved = favoriteIds.includes(propertyId)

      setFavoriteIds((current) =>
        saved ? current.filter((id) => id !== propertyId) : [...current, propertyId],
      )

      const request = saved
        ? supabase.from(FAVORITES_TABLE).delete().eq('user_id', user.id).eq('property_id', propertyId)
        : supabase.from(FAVORITES_TABLE).insert({ user_id: user.id, property_id: propertyId })

      void request.then(({ error: writeError }) => {
        if (!writeError) {
          notify(saved ? FAVORITE_REMOVED_TOAST : FAVORITE_SAVED_TOAST)
          return
        }

        // Roll the optimistic heart back; the DB refused the row.
        setFavoriteIds((current) =>
          saved ? [...current, propertyId] : current.filter((id) => id !== propertyId),
        )

        // 42501 becomes "Akun Anda belum memiliki izin...", never raw Postgres text.
        notifyError(
          toFriendlyMessage(writeError, saved ? FAVORITE_REMOVE_MESSAGE : FAVORITE_SAVE_MESSAGE),
        )
      })
    },
    [favoriteIds, user, requireLogin, toFriendlyMessage, notify, notifyError],
  )

  const value = useMemo<FavoritesContextValue>(
    () => ({
      favoriteIds,
      count: favoriteIds.length,
      isFavorite: (propertyId: string) => favoriteIds.includes(propertyId),
      toggleFavorite,
      removeFavorite: (propertyId: string) =>
        setFavoriteIds((current) => current.filter((id) => id !== propertyId)),
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
