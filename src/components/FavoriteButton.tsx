import { Heart } from 'lucide-react'
import { useFavorites } from '../lib/favorites'

interface FavoriteButtonProps {
  propertyId: string
  propertyTitle: string
  className?: string
}

export function FavoriteButton({ propertyId, propertyTitle, className = '' }: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const saved = isFavorite(propertyId)

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        toggleFavorite(propertyId)
      }}
      aria-pressed={saved}
      aria-label={saved ? `Hapus ${propertyTitle} dari favorit` : `Simpan ${propertyTitle} ke favorit`}
      title={saved ? 'Hapus dari favorit' : 'Simpan ke favorit'}
      className={`flex h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow-sm transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${className}`}
    >
      <Heart
        size={20}
        aria-hidden="true"
        className={saved ? 'fill-heart-active text-heart-active' : 'text-text-grey'}
      />
    </button>
  )
}
