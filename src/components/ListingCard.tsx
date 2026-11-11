import { Link } from 'react-router-dom'
import { ArrowRight, Bath, BedDouble, MapPin, Maximize2 } from 'lucide-react'
import { formatRupiah, statusLabels } from '../lib/format'
import { isNewListing } from '../lib/properties'
import { CARD_IMAGE_SIZES, CARD_IMAGE_WIDTHS } from '../lib/image'
import type { Property } from '../types/property'
import { FavoriteButton } from './FavoriteButton'
import { PropertyImage } from './PropertyImage'

interface ListingCardProps {
  property: Property
}

const statusBadgeClass = {
  dijual: 'bg-badge-dijual',
  disewa: 'bg-badge-disewa',
  terjual: 'bg-badge-terjual',
}

export function ListingCard({ property }: ListingCardProps) {
  return (
    <article className="group relative flex max-h-[420px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card transition duration-300 hover:-translate-y-0.5 hover:shadow-card-hover">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <PropertyImage
          src={property.photos[0]}
          alt={property.title}
          widths={CARD_IMAGE_WIDTHS}
          sizes={CARD_IMAGE_SIZES}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span className={`rounded-lg px-2.5 py-1 text-xs font-bold text-white shadow-sm ${statusBadgeClass[property.status]}`}>
            {statusLabels[property.status]}
          </span>
        </div>
        {isNewListing(property) && property.status !== 'terjual' && (
          <span className="absolute bottom-3 left-3 rounded-lg bg-badge-baru px-2.5 py-1 text-xs font-bold text-white shadow-sm">
            Baru
          </span>
        )}
        {property.status === 'terjual' && (
          <span className="absolute inset-0 flex items-center justify-center bg-slate-900/45 text-xl font-extrabold tracking-widest text-white">
            TERJUAL
          </span>
        )}
        <FavoriteButton
          propertyId={property.id}
          propertyTitle={property.title}
          className="absolute right-3 top-3 z-10"
        />
      </div>

      <Link to={`/properti/${property.id}`} className="flex flex-1 flex-col p-4" aria-label={`Lihat ${property.title}`}>
        <p className="text-lg font-bold text-navy">
          {formatRupiah(property.price)}
          {property.status === 'disewa' && <span className="text-xs font-medium text-text-grey"> / bulan</span>}
        </p>
        <h2 className="mt-1.5 line-clamp-2 text-base font-semibold leading-6 text-text-dark transition group-hover:text-primary-600">
          {property.title}
        </h2>
        <p className="mt-2 flex items-center gap-1.5 text-[13px] text-text-grey">
          <MapPin size={15} className="shrink-0 text-primary-500" aria-hidden="true" />
          <span className="truncate">{property.district}, {property.city}</span>
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-200 pt-4 text-xs font-medium text-text-grey">
          <span className="inline-flex items-center gap-1.5">
            <BedDouble size={16} className="shrink-0 text-slate-400" aria-hidden="true" /> {property.bedrooms} Tidur
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Bath size={16} className="shrink-0 text-slate-400" aria-hidden="true" /> {property.bathrooms} Mandi
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Maximize2 size={16} className="shrink-0 text-slate-400" aria-hidden="true" /> {property.land_area} m²
          </span>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <p className="truncate text-xs text-text-grey">
            Agen: <span className="font-semibold text-text-dark">{property.agent_name}</span>
          </p>
          <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-primary-600">
            Lihat Detail <ArrowRight size={14} aria-hidden="true" />
          </span>
        </div>
      </Link>
    </article>
  )
}
