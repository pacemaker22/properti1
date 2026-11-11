import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  CheckCircle2,
  Edit3,
  Home,
  LogIn,
  MapPin,
  Phone,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react'
import { PropertyImage } from '../components/PropertyImage'
import { Seo } from '../components/Seo'
import { ListingRowSkeleton } from '../components/ListingCardSkeleton'
import { useFavorites } from '../lib/favorites'
import { formatRupiah, statusLabels } from '../lib/format'
import { useAuth } from '../lib/auth'
import { isSupabaseConfigured } from '../lib/supabase'
import { useListings } from '../lib/listings'
import { pageTitle } from '../lib/seo'
import type { Property } from '../types/property'

const MY_LISTINGS_DESCRIPTION =
  'Kelola iklan properti Anda di properti1.com: edit, hapus, atau tandai properti sebagai terjual.'

export function MyListingsPage() {
  const { myListings, deleteListing, setListingSold, loading, error, refreshListings } = useListings()
  const { removeFavorite } = useFavorites()
  const { user, authLoading, openAuthModal } = useAuth()
  const [listingToDelete, setListingToDelete] = useState<Property | null>(null)
  const [phoneFilter, setPhoneFilter] = useState('')
  const [actionError, setActionError] = useState('')

  const sortedListings = useMemo(
    () =>
      [...myListings]
        .filter((listing) => {
          const query = phoneFilter.replace(/\D/g, '')
          return !query || listing.whatsapp.replace(/\D/g, '').includes(query)
        })
        .sort((first, second) => {
          const firstSold = first.status === 'terjual'
          const secondSold = second.status === 'terjual'
          if (firstSold !== secondSold) return firstSold ? 1 : -1
          return (
            new Date(second.created_at).getTime() -
            new Date(first.created_at).getTime()
          )
        }),
    [myListings, phoneFilter],
  )

  const confirmDelete = async () => {
    if (!listingToDelete) return
    setActionError('')
    try {
      await deleteListing(listingToDelete.id)
      removeFavorite(listingToDelete.id)
      setListingToDelete(null)
    } catch (caughtError) {
      setActionError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Gagal menghapus iklan. Silakan coba lagi.',
      )
    }
  }

  const toggleSold = async (listing: Property, sold: boolean) => {
    setActionError('')
    try {
      await setListingSold(listing.id, sold)
    } catch (caughtError) {
      setActionError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Gagal mengubah status iklan. Silakan coba lagi.',
      )
    }
  }

  if (authLoading) {
    return (
      <section className="container-page py-16 text-center" role="status">
        <Seo title={pageTitle('Iklan Saya')} description={MY_LISTINGS_DESCRIPTION} path="/iklan-saya" noIndex />
        <div className="mx-auto h-12 w-12 animate-pulse rounded-2xl bg-slate-200" />
        <p className="mt-4 text-sm text-text-grey">Memuat akun Anda…</p>
      </section>
    )
  }

  if (isSupabaseConfigured && !user) {
    return (
      <section className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
        <Seo title={pageTitle('Iklan Saya')} description={MY_LISTINGS_DESCRIPTION} path="/iklan-saya" noIndex />
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-text-grey">
          <LogIn size={28} aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-2xl font-bold text-navy">Masuk untuk melihat iklan Anda</h1>
        <p className="mt-2 max-w-md text-sm leading-6 text-text-grey">
          Iklan yang Anda buat dan kelola hanya dapat dilihat setelah masuk sebagai penjual.
        </p>
        <button
          type="button"
          onClick={() => openAuthModal('login')}
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-primary-500 px-5 text-sm font-bold text-white transition hover:bg-primary-600"
        >
          <LogIn size={17} aria-hidden="true" /> Masuk sebagai Penjual
        </button>
      </section>
    )
  }

  return (
    <section className="container-page py-10 sm:py-12">
      <Seo title={pageTitle('Iklan Saya')} description={MY_LISTINGS_DESCRIPTION} path="/iklan-saya" noIndex />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold text-primary-600">Kelola properti Anda</p>
          <h1 className="mt-1 text-2xl font-bold text-navy sm:text-3xl">Iklan Saya</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-text-grey">
            Ubah, hapus, atau tandai properti yang sudah terjual. Perubahan pada iklan Anda tersimpan di Supabase.
          </p>
        </div>
        <Link to="/tambah-iklan" className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary-500 px-4 text-sm font-bold text-white transition hover:bg-primary-600">
          <Plus size={17} aria-hidden="true" /> Pasang Iklan Baru
        </Link>
      </div>

      <div className="mt-7 grid gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-card sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <p className="text-sm font-bold text-navy">Total {myListings.length} iklan</p>
          <p className="mt-1 text-xs text-text-grey">Iklan yang sudah terjual otomatis dipindahkan ke bagian bawah.</p>
          <div className="relative mt-3 max-w-sm">
            <label htmlFor="listing-phone-filter" className="sr-only">Filter nomor WhatsApp</label>
            <Phone size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-grey" aria-hidden="true" />
            <input
              id="listing-phone-filter"
              type="tel"
              inputMode="tel"
              value={phoneFilter}
              onChange={(event) => setPhoneFilter(event.target.value)}
              placeholder="Filter nomor WhatsApp"
              className="h-10 w-full rounded-xl border border-slate-200 bg-page-bg pl-9 pr-3 text-xs text-text-dark outline-none transition placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-slate-200"
            />
          </div>
        </div>
        <Link to="/" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-bold text-navy transition hover:border-primary-500">
          <Home size={15} aria-hidden="true" /> Lihat Beranda
        </Link>
      </div>

      {actionError && (
        <p className="mt-5 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-xs font-medium text-error-red" role="alert">
          <AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
          {actionError}
        </p>
      )}

      {error ? (
        <div className="mt-6 rounded-2xl border border-error-red/30 bg-red-50 px-6 py-8 text-center" role="alert">
          <AlertCircle size={30} className="mx-auto text-error-red" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-bold text-navy">Gagal memuat iklan Anda</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-text-grey">{error}</p>
          <button
            type="button"
            onClick={() => void refreshListings()}
            className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-primary-500 px-4 text-sm font-bold text-white transition hover:bg-primary-600"
          >
            <RotateCcw size={16} aria-hidden="true" /> Coba Lagi
          </button>
        </div>
      ) : loading ? (
        <ListingRowSkeleton count={3} className="mt-6" />
      ) : sortedListings.length > 0 ? (
        <div className="mt-6 space-y-4">
          {sortedListings.map((listing) => {
            const sold = listing.status === 'terjual'
            return (
              <article key={listing.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
                <div className="grid sm:grid-cols-[220px_1fr]">
                  <div className="relative aspect-[4/3] bg-slate-100 sm:aspect-auto sm:min-h-[210px]">
                    <PropertyImage src={listing.photos[0]} alt={listing.title} className="h-full w-full object-cover" />
                    <span className={`absolute left-3 top-3 rounded-lg px-2.5 py-1 text-xs font-bold text-white shadow-sm ${sold ? 'bg-badge-terjual' : listing.status === 'disewa' ? 'bg-badge-disewa' : 'bg-badge-dijual'}`}>
                      {statusLabels[listing.status]}
                    </span>
                    {sold && (
                      <span className="absolute inset-0 flex items-center justify-center bg-slate-900/45 text-lg font-extrabold tracking-widest text-white">
                        TERJUAL
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col justify-between gap-5 p-5 sm:p-6">
                    <div>
                      <p className="text-lg font-bold text-navy">{formatRupiah(listing.price)}</p>
                      <Link to={`/properti/${listing.id}`} className="mt-1 block text-base font-semibold leading-6 text-text-dark transition hover:text-primary-600">
                        {listing.title}
                      </Link>
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-text-grey">
                        <MapPin size={14} className="text-primary-500" aria-hidden="true" />
                        {listing.district}, {listing.city}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                      <Link to={`/tambah-iklan/${listing.id}`} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-bold text-navy transition hover:border-primary-500 hover:text-primary-600">
                        <Edit3 size={15} aria-hidden="true" /> Ubah
                      </Link>
                      {sold ? (
                        <button type="button" onClick={() => void toggleSold(listing, false)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-bold text-navy transition hover:border-primary-500 hover:text-primary-600">
                          <RotateCcw size={15} aria-hidden="true" /> Tandai Tersedia
                        </button>
                      ) : (
                        <button type="button" onClick={() => void toggleSold(listing, true)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-bold text-navy transition hover:border-primary-500 hover:text-primary-600">
                          <CheckCircle2 size={15} aria-hidden="true" /> Tandai Terjual
                        </button>
                      )}
                      <button type="button" onClick={() => setListingToDelete(listing)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-bold text-error-red transition hover:bg-slate-100">
                        <Trash2 size={15} aria-hidden="true" /> Hapus
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-text-grey">
            <Home size={28} aria-hidden="true" />
          </span>
          <h2 className="mt-5 text-lg font-bold text-navy">{phoneFilter ? 'Iklan tidak ditemukan' : 'Belum ada iklan'}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-text-grey">{phoneFilter ? 'Coba periksa kembali nomor WhatsApp yang dimasukkan.' : 'Pasang iklan pertama Anda dan mulai terima calon pembeli.'}</p>
          <Link to="/tambah-iklan" className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-primary-500 px-4 text-sm font-bold text-white transition hover:bg-primary-600">
            <Plus size={16} aria-hidden="true" /> Pasang Iklan Gratis
          </Link>
        </div>
      )}

      {listingToDelete && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 p-4" role="dialog" aria-modal="true" aria-labelledby="delete-listing-title">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-error-red">
                <Trash2 size={20} aria-hidden="true" />
              </span>
              <button type="button" onClick={() => setListingToDelete(null)} className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-text-grey transition hover:bg-slate-200" aria-label="Batal hapus iklan">
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <h2 id="delete-listing-title" className="mt-4 text-xl font-bold text-navy">Hapus iklan ini?</h2>
            <p className="mt-2 text-sm leading-6 text-text-grey">
              Iklan “{listingToDelete.title}” akan dihapus dari halaman beranda dan daftar iklan Anda. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setListingToDelete(null)} className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-bold text-navy transition hover:border-slate-300">
                Batal
              </button>
              <button type="button" onClick={() => void confirmDelete()} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-error-red px-4 text-sm font-bold text-white transition hover:opacity-90">
                <Trash2 size={16} aria-hidden="true" /> Ya, Hapus Iklan
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
