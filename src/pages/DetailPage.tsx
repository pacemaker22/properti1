import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  Bath,
  BedDouble,
  Building2,
  CalendarDays,
  Car,
  ChevronRight,
  FileBadge,
  Flag,
  Home,
  LandPlot,
  Layers3,
  MapPin,
  Maximize2,
  MessageCircle,
  PlugZap,
  RotateCcw,
  Share2,
  ShieldCheck,
} from 'lucide-react'
import { AgentCard } from '../components/AgentCard'
import { FavoriteButton } from '../components/FavoriteButton'
import { ListingCard } from '../components/ListingCard'
import { PropertyGallery } from '../components/PropertyGallery'
import { getWhatsAppUrl } from '../lib/contact'
import { formatArea, formatDate, formatRupiah, statusLabels, typeLabels } from '../lib/format'
import { getSimilarProperties } from '../lib/properties'
import { useListings } from '../lib/listings'
import type { Property } from '../types/property'

export function DetailPage() {
  const { id } = useParams()
  const { getListing, listings, loading, error, refreshListings } = useListings()
  const property = getListing(id)

  useEffect(() => {
    if (property) document.title = `${property.title} - properti1.com`
    return () => {
      document.title = 'Cari Rumah Impianmu - properti1.com'
    }
  }, [property])

  if (loading && !property) {
    return (
      <section className="container-page py-16" aria-label="Memuat detail properti" role="status">
        <div className="aspect-video animate-pulse rounded-2xl bg-slate-200" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="h-64 animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-64 animate-pulse rounded-2xl bg-slate-200" />
        </div>
      </section>
    )
  }

  if (error && !property) {
    return (
      <section className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
        <AlertCircle size={36} className="text-error-red" aria-hidden="true" />
        <h1 className="mt-4 text-3xl font-bold text-navy">Gagal memuat properti</h1>
        <p className="mt-3 max-w-lg text-text-grey">{error}</p>
        <button
          type="button"
          onClick={() => void refreshListings()}
          className="mt-6 inline-flex h-12 items-center gap-2 rounded-xl bg-primary-500 px-5 text-sm font-bold text-white transition hover:bg-primary-600"
        >
          <RotateCcw size={17} aria-hidden="true" /> Coba Lagi
        </button>
      </section>
    )
  }

  if (!property) {
    return (
      <section className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-100 text-text-grey">
          <Home size={36} aria-hidden="true" />
        </span>
        <h1 className="mt-6 text-3xl font-bold text-navy">Properti tidak ditemukan</h1>
        <p className="mt-3 text-text-grey">Listing yang Anda cari mungkin sudah tidak tersedia.</p>
        <Link
          to="/"
          className="mt-6 inline-flex h-12 items-center gap-2 rounded-xl bg-primary-500 px-5 text-sm font-bold text-white transition hover:bg-primary-600"
        >
          <ArrowLeft size={18} aria-hidden="true" /> Lihat Semua Properti
        </Link>
      </section>
    )
  }

  const specs = [
    { label: 'Tipe Properti', value: typeLabels[property.type], icon: Building2 },
    { label: 'Status', value: statusLabels[property.status], icon: ShieldCheck },
    { label: 'Kamar Tidur', value: property.bedrooms > 0 ? `${property.bedrooms} kamar` : 'Tidak ada', icon: BedDouble },
    { label: 'Kamar Mandi', value: property.bathrooms > 0 ? `${property.bathrooms} kamar` : 'Tidak ada', icon: Bath },
    { label: 'Luas Tanah', value: formatArea(property.land_area), icon: LandPlot },
    { label: 'Luas Bangunan', value: formatArea(property.building_area), icon: Maximize2 },
    { label: 'Sertifikat', value: property.certificate, icon: FileBadge },
    { label: 'Jumlah Lantai', value: property.floors > 0 ? `${property.floors} lantai` : 'Tidak ada', icon: Layers3 },
    { label: 'Garasi / Carport', value: property.parking > 0 ? `${property.parking} mobil` : 'Tidak ada', icon: Car },
    { label: 'Tahun Dibangun', value: property.year_built > 0 ? String(property.year_built) : 'Tidak ada', icon: CalendarDays },
    { label: 'Perabot', value: property.furnished ? 'Tersedia' : 'Tidak tersedia', icon: Home },
    { label: 'Daya Listrik', value: property.electricity > 0 ? `${property.electricity} watt` : 'Tidak ada', icon: PlugZap },
  ]

  const whatsappUrl = getWhatsAppUrl(property)
  const similarProperties = getSimilarProperties(property, 3, listings)

  const shareProperty = async () => {
    const url = window.location.href
    const shareData = {
      title: property.title,
      text: `${property.title} - ${formatRupiah(property.price)} di properti1.com`,
      url,
    }
    if (navigator.share) {
      await navigator.share(shareData).catch(() => undefined)
      return
    }
    await navigator.clipboard?.writeText(url)
  }

  return (
    <>
      <div className="border-b border-slate-200 bg-white">
        <div className="container-page py-4">
          <nav className="flex items-center gap-1.5 overflow-hidden text-xs font-medium text-text-grey sm:text-sm" aria-label="Navigasi breadcrumbs">
            <Link to="/" className="shrink-0 hover:text-primary-600">Beranda</Link>
            <ChevronRight size={14} className="shrink-0" aria-hidden="true" />
            <Link to="/" className="shrink-0 hover:text-primary-600">{property.city}</Link>
            <ChevronRight size={14} className="shrink-0" aria-hidden="true" />
            <span className="truncate text-text-dark">{property.title}</span>
          </nav>
        </div>
      </div>

      <section className="container-page pb-28 pt-6 sm:pt-8 lg:pb-16">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/"
            className="inline-flex h-11 items-center gap-2 text-sm font-bold text-text-grey hover:text-primary-600"
          >
            <ArrowLeft size={17} aria-hidden="true" /> Kembali ke daftar properti
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={shareProperty}
              aria-label="Bagikan properti ini"
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-navy transition hover:border-primary-500 hover:text-primary-600"
            >
              <Share2 size={17} aria-hidden="true" /> <span className="hidden sm:inline">Bagikan</span>
            </button>
            <FavoriteButton
              propertyId={property.id}
              propertyTitle={property.title}
              className="h-11 w-11 border border-slate-200 bg-white"
            />
          </div>
        </div>


        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)] lg:gap-10">
          <div className="lg:col-start-1 lg:row-start-1">
            <PropertyGallery property={property} />
          </div>

          <aside className="lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:sticky lg:top-24">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
              <p className="text-sm font-bold text-primary-600">{typeLabels[property.type]} di {property.city}</p>
              <p className="mt-4 text-[28px] font-bold leading-tight text-navy">
                {formatRupiah(property.price)}
                {property.status === 'disewa' && <span className="text-sm font-medium text-text-grey"> / bulan</span>}
              </p>
              <h1 className="mt-2 text-xl font-bold leading-7 text-navy">{property.title}</h1>
              <p className="mt-3 flex items-center gap-1.5 text-sm text-text-grey">
                <MapPin size={17} className="shrink-0 text-primary-500" aria-hidden="true" /> {property.district}, {property.city}
              </p>
            </div>
            <div className="mt-4">
              <AgentCard property={property} />
            </div>
          </aside>

          <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-6 lg:col-start-1 lg:row-start-2">
            <p className="text-sm font-bold text-primary-600">Tentang properti</p>
            <h2 className="mt-1 text-2xl font-bold text-navy">Deskripsi Lengkap</h2>
            <p className="mt-4 whitespace-pre-line text-sm leading-7 text-text-grey">{property.description}</p>
            <p className="mt-5 text-xs text-slate-400">Diterbitkan {formatDate(property.created_at)}</p>
            <button
              type="button"
              onClick={() => {
                const report = `Halo, saya ingin melaporkan iklan "${property.title}" (${window.location.href}).`
                window.open(
                  `https://wa.me/6281234567890?text=${encodeURIComponent(report)}`,
                  '_blank',
                  'noopener,noreferrer',
                )
              }}
              className="mt-4 inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-text-grey transition hover:text-error-red"
            >
              <Flag size={15} aria-hidden="true" /> Laporkan Iklan
            </button>
          </section>

          <section className="mt-6 lg:col-start-1 lg:row-start-3">
            <h2 className="text-xl font-bold text-navy">Spesifikasi Properti</h2>
            <dl className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {specs.map((spec) => {
                const Icon = spec.icon
                return (
                  <div key={spec.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
                    <Icon size={20} className="text-primary-500" aria-hidden="true" />
                    <dt className="mt-3 text-xs text-text-grey">{spec.label}</dt>
                    <dd className="mt-1 text-sm font-bold text-navy">{spec.value}</dd>
                  </div>
                )
              })}
            </dl>
          </section>
        </div>
      </section>

      {similarProperties.length > 0 && (
        <section className="container-page pb-12">
          <h2 className="text-xl font-bold text-navy sm:text-2xl">Properti Serupa</h2>
          <p className="mt-2 text-sm text-text-grey">
            Pilihan lain di {property.city} dan range harga serupa.
          </p>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {similarProperties.map((similar: Property) => (
              <ListingCard key={similar.id} property={similar} />
            ))}
          </div>
        </section>
      )}

      {property.status !== 'terjual' && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 p-3 shadow-card-hover backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-[1200px] items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-navy">{formatRupiah(property.price)}</p>
              <p className="truncate text-[11px] text-text-grey">{property.title}</p>
            </div>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="Chat WhatsApp dengan penjual"
              className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary-500 px-4 text-sm font-bold text-white"
            >
              <MessageCircle size={19} aria-hidden="true" /> WhatsApp
            </a>
          </div>
        </div>
      )}
    </>
  )
}
