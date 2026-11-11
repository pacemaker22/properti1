import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, Heart, RotateCcw, Search } from 'lucide-react'
import { ListingCard } from '../components/ListingCard'
import { ListingGridSkeleton } from '../components/ListingCardSkeleton'
import { Seo } from '../components/Seo'
import { pageTitle } from '../lib/seo'
import { useFavorites } from '../lib/favorites'
import { useListings } from '../lib/listings'

export function FavoritesPage() {
  const { favoriteIds, clearFavorites } = useFavorites()
  const { listings, loading, error, refreshListings } = useListings()

  const savedProperties = useMemo(
    () => listings.filter((property) => favoriteIds.includes(property.id)),
    [favoriteIds, listings],
  )

  return (
    <section className="container-page py-10 sm:py-12">
      <Seo
        title={pageTitle('Favorit Saya')}
        description="Daftar properti yang Anda simpan di properti1.com untuk dibandingkan sebelum menghubungi penjual lewat WhatsApp."
        path="/favorit"
        noIndex
      />
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

      {error ? (
        <div className="mt-8 rounded-2xl border border-error-red/30 bg-red-50 px-6 py-10 text-center" role="alert">
          <AlertCircle size={32} className="mx-auto text-error-red" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-bold text-navy">Gagal memuat favorit</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-text-grey">{error}</p>
          <button
            type="button"
            onClick={() => void refreshListings()}
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-primary-500 px-4 text-sm font-bold text-white transition hover:bg-primary-600"
          >
            <RotateCcw size={16} aria-hidden="true" /> Coba Lagi
          </button>
        </div>
      ) : loading ? (
        <ListingGridSkeleton count={3} className="mt-7" />
      ) : savedProperties.length > 0 ? (
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
