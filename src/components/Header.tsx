import { useState, type FormEvent } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Building2, Heart, Menu, Search, X } from 'lucide-react'
import { getPlatformWhatsAppUrl, LISTING_ENQUIRY_MESSAGE } from '../lib/contact'
import { useFavorites } from '../lib/favorites'

const platformWhatsAppUrl = getPlatformWhatsAppUrl(LISTING_ENQUIRY_MESSAGE)

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const { count } = useFavorites()
  const navigate = useNavigate()

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const query = searchValue.trim()
    navigate(query ? `/?q=${encodeURIComponent(query)}` : '/')
    setMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="container-page flex h-16 items-center gap-4">
        <Link to="/" className="flex shrink-0 items-center gap-2" aria-label="Beranda properti1.com">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500 text-white shadow-sm">
            <Building2 size={20} strokeWidth={2.5} />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-navy">
            properti<span className="text-primary-500">1</span>.com
          </span>
        </Link>

        <form onSubmit={handleSearch} role="search" className="mx-auto hidden w-full max-w-sm lg:block">
          <label htmlFor="header-search" className="sr-only">Cari properti</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-grey" aria-hidden="true" />
            <input
              id="header-search"
              type="search"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Cari lokasi, nama perumahan..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-page-bg pl-11 pr-4 text-sm text-text-dark outline-none transition placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
        </form>

        <nav className="ml-auto hidden items-center gap-3 lg:flex" aria-label="Navigasi utama">
          <NavLink
            to="/favorit"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-navy transition hover:border-primary-500 hover:text-primary-600"
          >
            <Heart size={18} className="text-heart-active" aria-hidden="true" />
            Favorit
            {count > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-500 px-1.5 text-[11px] font-bold text-white">
                {count}
              </span>
            )}
          </NavLink>
          <a
            href={platformWhatsAppUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 items-center rounded-xl bg-primary-500 px-4 text-sm font-bold text-white transition hover:bg-primary-600"
          >
            Pasang Iklan Gratis
          </a>
        </nav>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="ml-auto inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-700 lg:hidden"
          aria-label={menuOpen ? 'Tutup menu' : 'Buka menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-slate-100 bg-white px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-3" aria-label="Navigasi seluler">
            <form onSubmit={handleSearch} role="search">
              <label htmlFor="mobile-header-search" className="sr-only">Cari properti</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-grey" aria-hidden="true" />
                <input
                  id="mobile-header-search"
                  type="search"
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder="Cari lokasi, nama perumahan..."
                  className="h-12 w-full rounded-xl border border-slate-200 bg-page-bg pl-11 pr-4 text-sm text-text-dark outline-none transition placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
            </form>

            <NavLink
              to="/favorit"
              onClick={() => setMenuOpen(false)}
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-navy"
            >
              <Heart size={18} className="text-heart-active" aria-hidden="true" />
              Favorit Saya
              {count > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-500 px-1.5 text-[11px] font-bold text-white">
                  {count}
                </span>
              )}
            </NavLink>

            <a
              href={platformWhatsAppUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-primary-500 px-4 text-sm font-bold text-white"
            >
              Pasang Iklan Gratis
            </a>
          </nav>
        </div>
      )}
    </header>
  )
}
