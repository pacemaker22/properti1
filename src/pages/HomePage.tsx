import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertCircle, ChevronDown, Home, RotateCcw, SlidersHorizontal } from 'lucide-react'
import { CtaBanner } from '../components/CtaBanner'
import { FilterBar } from '../components/FilterBar'
import { Hero } from '../components/Hero'
import { ListingCard } from '../components/ListingCard'
import { ListingGridSkeleton } from '../components/ListingCardSkeleton'
import { JsonLd } from '../components/JsonLd'
import { Seo } from '../components/Seo'
import { HOME_DESCRIPTION, HOME_TITLE, websiteJsonLd } from '../lib/seo'
import { initialFilters, matchesFilters, sortProperties, type Filters } from '../lib/filters'
import { useListings } from '../lib/listings'
import type { SortOption } from '../types/property'

const quickFilters = [
  { label: 'Semua', value: 'semua' },
  { label: 'Rumah', value: 'rumah' },
  { label: 'Apartemen', value: 'apartemen' },
  { label: 'Tanah', value: 'tanah' },
  { label: 'Ruko', value: 'ruko' },
  { label: 'Disewa', value: 'disewa' },
]

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'terbaru', label: 'Terbaru' },
  { value: 'termurah', label: 'Termurah' },
  { value: 'termahal', label: 'Termahal' },
  { value: 'terpopuler', label: 'Terpopuler' },
]

export function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState<Filters>(initialFilters)
  const [sort, setSort] = useState<SortOption>('terbaru')
  const [filterOpen, setFilterOpen] = useState(false)
  const { listings, loading, error, refreshListings } = useListings()

  const query = searchParams.get('q') ?? ''

  const setQuery = (value: string) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set('q', value)
    else next.delete('q')
    setSearchParams(next, { replace: true })
  }

  const filteredProperties = useMemo(
    () => sortProperties(listings.filter((property) => matchesFilters(property, filters, query)), sort),
    [filters, listings, query, sort],
  )
  const availableCities = useMemo(
    () => [...new Set(listings.map((property) => property.city))].sort(),
    [listings],
  )

  const activeFilterCount = Object.values(filters).filter(Boolean).length
  const locationLabel = filters.city || (query ? `"${query}"` : 'Jakarta dan sekitarnya')
  const activeQuickFilter = filters.status === 'disewa' ? 'disewa' : filters.type || 'semua'

  const resetFilters = () => setFilters(initialFilters)

  const applyQuickFilter = (value: string) => {
    setFilters((current) => {
      if (value === 'semua') return { ...current, type: '', status: '' }
      if (value === 'disewa') return { ...current, type: '', status: 'disewa' }
      return { ...current, type: value, status: '' }
    })
  }

  const scrollToList = () => {
    document.getElementById('daftar-properti')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <Seo title={HOME_TITLE} description={HOME_DESCRIPTION} path="/" />
      <JsonLd data={websiteJsonLd()} />
      <Hero query={query} onQueryChange={setQuery} onSearch={scrollToList} />

      <section className="border-b border-slate-200 bg-white">
        <div className="container-page flex gap-2 overflow-x-auto py-4 no-scrollbar" aria-label="Filter cepat">
          {quickFilters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => applyQuickFilter(filter.value)}
              aria-pressed={activeQuickFilter === filter.value}
              className={`h-11 shrink-0 rounded-xl border px-4 text-sm font-semibold transition ${
                activeQuickFilter === filter.value
                  ? 'border-primary-500 bg-primary-500 text-white'
                  : 'border-slate-200 bg-white text-navy hover:border-primary-500 hover:text-primary-600'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </section>

      <section className="sticky top-16 z-40 hidden border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur lg:block">
        <div className="container-page py-3">
          <div className="grid grid-cols-[1.1fr_0.9fr_1.2fr_0.9fr_0.9fr_auto] items-end gap-3">
            <FilterBar filters={filters} cities={availableCities} onChange={setFilters} onReset={resetFilters} />
            <div>
              <label htmlFor="desktop-sort" className="field-label">Urutkan</label>
              <select
                id="desktop-sort"
                value={sort}
                onChange={(event) => setSort(event.target.value as SortOption)}
                className="field-control"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>


      <section id="daftar-properti" className="container-page scroll-mt-24 py-10 sm:py-12">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold text-primary-600">Pilihan terbaik untuk Anda</p>
            <h2 className="mt-1 text-2xl font-bold text-navy">Properti Pilihan</h2>
            <p className="mt-2 text-sm text-text-grey">
              {loading
                ? 'Memuat properti…'
                : `Menampilkan ${filteredProperties.length} properti di ${locationLabel}`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={resetFilters}
                className="hidden h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-text-grey transition hover:border-primary-500 hover:text-primary-600 lg:inline-flex"
              >
                <RotateCcw size={16} aria-hidden="true" /> Reset Filter
              </button>
            )}
            <button
              type="button"
              onClick={() => setFilterOpen(true)}
              className="relative inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-navy shadow-card lg:hidden"
              aria-label="Buka filter properti"
            >
              <SlidersHorizontal size={17} aria-hidden="true" /> Filter
              {activeFilterCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-500 px-1.5 text-[11px] text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <div className="relative lg:hidden">
              <label htmlFor="mobile-sort" className="sr-only">Urutkan properti</label>
              <select
                id="mobile-sort"
                value={sort}
                onChange={(event) => setSort(event.target.value as SortOption)}
                className="h-11 appearance-none rounded-xl border border-slate-200 bg-white py-0 pl-4 pr-10 text-sm font-semibold text-navy shadow-card"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-grey"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>

        {error ? (
          <div className="mt-8 rounded-2xl border border-error-red/30 bg-red-50 px-6 py-10 text-center" role="alert">
            <AlertCircle size={32} className="mx-auto text-error-red" aria-hidden="true" />
            <h3 className="mt-4 text-lg font-bold text-navy">Gagal memuat properti</h3>
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
          <ListingGridSkeleton count={6} className="mt-7" />
        ) : filteredProperties.length > 0 ? (
          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProperties.map((property) => (
              <ListingCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-text-grey">
              <Home size={28} aria-hidden="true" />
            </span>
            <h3 className="mt-5 text-lg font-bold text-navy">Tidak ada properti ditemukan</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-text-grey">
              Coba ubah filter atau kata kunci pencarian Anda.
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery('')
                resetFilters()
              }}
              className="mt-6 inline-flex h-11 items-center rounded-xl bg-primary-500 px-4 text-sm font-bold text-white transition hover:bg-primary-600"
            >
              Reset Filter
            </button>
          </div>
        )}
      </section>

      <CtaBanner />

      {filterOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-end bg-slate-950/50 backdrop-blur-sm lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Filter properti"
        >
          <div className="w-full rounded-t-3xl bg-white">
            <FilterBar
              filters={filters}
              cities={availableCities}
              onChange={setFilters}
              onReset={resetFilters}
              mobile
              onClose={() => setFilterOpen(false)}
            />
            <div className="border-t border-slate-200 p-4">
              <button
                type="button"
                onClick={() => setFilterOpen(false)}
                className="h-12 w-full rounded-xl bg-primary-500 text-sm font-bold text-white"
              >
                Tampilkan {filteredProperties.length} Properti
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
