import { useState } from 'react'
import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react'
import { statusLabels } from '../lib/format'
import type { Property } from '../types/property'
import { PropertyImage } from './PropertyImage'

interface PropertyGalleryProps {
  property: Property
}

export function PropertyGallery({ property }: PropertyGalleryProps) {
  const [activePhoto, setActivePhoto] = useState(0)
  const [expanded, setExpanded] = useState(false)

  const showPrevious = () => setActivePhoto((current) => (current === 0 ? property.photos.length - 1 : current - 1))
  const showNext = () => setActivePhoto((current) => (current === property.photos.length - 1 ? 0 : current + 1))

  return (
    <>
      <div className="relative -mx-4 lg:mx-0">
        <div className="flex snap-x snap-mandatory overflow-x-auto no-scrollbar lg:hidden">
          {property.photos.map((photo, index) => (
            <PropertyImage key={photo} src={photo} alt={`${property.title} — foto ${index + 1}`} loading={index === 0 ? 'eager' : 'lazy'} className="aspect-[4/3] w-full shrink-0 snap-center bg-slate-100 object-cover" />
          ))}
        </div>
        {property.status === 'terjual' && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-900/45 text-xl font-extrabold tracking-widest text-white lg:hidden">
            TERJUAL
          </span>
        )}
      </div>

      <div className="hidden lg:block">
        <button type="button" onClick={() => setExpanded(true)} aria-label={`Perbesar foto ${activePhoto + 1}`} className="group relative block w-full overflow-hidden rounded-2xl bg-slate-100 shadow-card">
          <PropertyImage src={property.photos[activePhoto]} alt={`${property.title} — foto ${activePhoto + 1}`} loading="eager" className="aspect-video w-full object-cover transition duration-300 group-hover:scale-[1.02]" />
          <span className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-navy shadow-sm"><Expand size={19} aria-hidden="true" /></span>
          {property.status === 'terjual' && <span className="absolute inset-0 flex items-center justify-center bg-slate-900/45 text-2xl font-extrabold tracking-widest text-white">TERJUAL</span>}
        </button>

        <div className="mt-3 grid grid-cols-4 gap-3">
          {property.photos.map((photo, index) => (
            <button key={photo} type="button" onClick={() => setActivePhoto(index)} aria-label={`Tampilkan foto ${index + 1}`} className={`overflow-hidden rounded-xl border-2 bg-slate-100 transition ${activePhoto === index ? 'border-primary-500' : 'border-transparent hover:border-slate-300'}`}>
              <PropertyImage src={photo} alt={`Thumbnail ${property.title} ${index + 1}`} className="aspect-square w-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      {expanded && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/95 p-4" role="dialog" aria-modal="true" aria-label="Pratinjau foto properti">
          <button type="button" onClick={() => setExpanded(false)} aria-label="Tutup pratinjau foto" className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"><X size={23} /></button>
          <button type="button" onClick={showPrevious} aria-label="Foto sebelumnya" className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:left-6"><ChevronLeft size={26} /></button>
          <PropertyImage src={property.photos[activePhoto]} alt={`${property.title} — foto ${activePhoto + 1}`} loading="eager" className="max-h-[85vh] max-w-5xl rounded-xl object-contain" />
          <button type="button" onClick={showNext} aria-label="Foto berikutnya" className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:right-6"><ChevronRight size={26} /></button>
          <span className="absolute bottom-5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white">{activePhoto + 1} / {property.photos.length} — {statusLabels[property.status]}</span>
        </div>
      )}
    </>
  )
}
