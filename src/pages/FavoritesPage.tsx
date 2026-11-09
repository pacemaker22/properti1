import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Search } from 'lucide-react'
import { ListingCard } from '../components/ListingCard'
import { useFavorites } from '../lib/favorites'
import { properties } from '../lib/properties'

export function FavoritesPage() {
  const { favoriteIds, clearFavorites } = useFavorites()

  const savedProperties = useMemo(
    () => properties.filter((property) => favoriteIds.includes(property.id)),
    [favoriteIds],
  )

  return (
    <section className="container-page py-10 sm:py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold text-primary-600">Simpan untuk dibandingkan</p>
          <h1 className="mt-1 text-2xl font-bold text-navy sm:text-3xl">Favorit Saya</h1>
          <p className="mt-2 text-sm text-text-grey">
            {savedProperties.length > 0
              ? `Anda memiliki ${savedProperties.length} properti tersimpan.`
              : 'Properti yang Anda simpan akan muncul di sini.'}
          </p>
        </div>

        {savedProperties.length > 0 && (
          <button
            type="button"
            onClick={clearFavorites}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-bold text-text-grey transition hover:border-error-red hover:text-error-red"
          >
            Hapus Semua Favorit
          </button>
        )}
      </div>

      {savedProperties.length > 0 ? (
        <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {savedProperties.map((property) => (
            <ListingCard key={property.id} property={property} />
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-heart-active">
            <Heart size={28} aria-hidden="true" />
          </span>
          <h2 className="mt-5 text-lg font-bold text-navy">Belum ada favorit</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-text-grey">
            Klik hati di listing untuk menyimpan properti yang Anda sukai.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-primary-500 px-4 text-sm font-bold text-white transition hover:bg-primary-600"
          >
            <Search size={16} aria-hidden="true" /> Jelajahi Properti
          </Link>
        </div>
      )}
    </section>
  )
}
