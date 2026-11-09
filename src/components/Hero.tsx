import { ArrowRight, CheckCircle2, MapPin, Search, ShieldCheck, X } from 'lucide-react'

interface HeroProps {
  query: string
  onQueryChange: (value: string) => void
  onSearch: () => void
}

export function Hero({ query, onQueryChange, onSearch }: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-navy">
      <div className="absolute inset-0 opacity-20" aria-hidden="true">
        <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full bg-primary-500 blur-3xl" />
        <div className="absolute -bottom-40 left-10 h-72 w-72 rounded-full bg-primary-500/40 blur-3xl" />
      </div>

      <div className="container-page relative py-12 sm:py-16 lg:py-20">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-bold text-white backdrop-blur">
          <CheckCircle2 size={15} aria-hidden="true" /> Pilihan properti terkurasi di Indonesia
        </div>
        <h1 className="mt-6 max-w-2xl text-[32px] font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
          Cari Rumah <span className="text-primary-500">Impianmu</span>
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
          Jual & Beli Rumah, Apartemen, Tanah, Ruko di Indonesia - Langsung Chat WhatsApp
        </p>

        <div className="mt-7 max-w-2xl rounded-2xl bg-white p-2 shadow-2xl shadow-black/20">
          <label htmlFor="hero-search" className="sr-only">Cari properti</label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-grey"
                aria-hidden="true"
              />
              <input
                id="hero-search"
                type="search"
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') onSearch()
                }}
                placeholder="Cari lokasi, nama perumahan..."
                className="h-12 w-full rounded-xl pl-12 pr-10 text-sm font-medium text-text-dark outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-slate-200"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => onQueryChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-grey hover:text-navy"
                  aria-label="Hapus kata kunci pencarian"
                >
                  <X size={17} aria-hidden="true" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={onSearch}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary-500 px-6 text-sm font-bold text-white transition hover:bg-primary-600"
            >
              Cari <ArrowRight size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-xs text-slate-300 sm:text-sm">
          <span className="inline-flex items-center gap-2">
            <ShieldCheck size={17} className="text-primary-500" aria-hidden="true" /> Data agen terverifikasi
          </span>
          <span className="inline-flex items-center gap-2">
            <MapPin size={17} className="text-primary-500" aria-hidden="true" /> Lokasi sesuai kecamatan
          </span>
          <span className="inline-flex items-center gap-2">
            <Search size={17} className="text-primary-500" aria-hidden="true" /> Pencarian praktis
          </span>
        </div>
      </div>
    </section>
  )
}
