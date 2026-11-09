import { RotateCcw, SlidersHorizontal, X } from 'lucide-react'
import { statusLabels, typeLabels } from '../lib/format'
import { initialFilters, type Filters } from '../lib/filters'
import type { PropertyStatus, PropertyType } from '../types/property'

export { initialFilters }
export type { Filters }

interface FilterBarProps {
  filters: Filters
  cities: string[]
  onChange: (filters: Filters) => void
  onReset: () => void
  mobile?: boolean
  onClose?: () => void
}

export function FilterBar({ filters, cities, onChange, onReset, mobile = false, onClose }: FilterBarProps) {
  const update = (key: keyof Filters, value: string) => onChange({ ...filters, [key]: value })
  const hasActiveFilter = Object.values(filters).some(Boolean)
  const idPrefix = mobile ? 'mobile' : 'desktop'

  return (
    <div className={mobile ? 'flex max-h-[85vh] flex-col' : 'contents'}>
      {mobile && (
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="flex items-center gap-2 font-bold text-navy">
            <SlidersHorizontal size={19} aria-hidden="true" /> Filter Properti
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-600"
            aria-label="Tutup filter"
          >
            <X size={19} aria-hidden="true" />
          </button>
        </div>
      )}

      <div className={mobile ? 'overflow-y-auto px-5 py-5' : 'contents'}>
        <div>
          <label htmlFor={`${idPrefix}-city`} className="field-label">Kota</label>
          <select
            id={`${idPrefix}-city`}
            value={filters.city}
            onChange={(event) => update('city', event.target.value)}
            className="field-control"
          >
            <option value="">Semua kota</option>
            {cities.map((city) => <option key={city} value={city}>{city}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor={`${idPrefix}-type`} className="field-label">Tipe Properti</label>
          <select
            id={`${idPrefix}-type`}
            value={filters.type}
            onChange={(event) => update('type', event.target.value)}
            className="field-control"
          >
            <option value="">Semua tipe</option>
            {(Object.keys(typeLabels) as PropertyType[]).map((type) => (
              <option key={type} value={type}>{typeLabels[type]}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${idPrefix}-price-range`} className="field-label">Harga</label>
          <select
            id={`${idPrefix}-price-range`}
            value={filters.priceRange}
            onChange={(event) => update('priceRange', event.target.value)}
            className="field-control"
          >
            <option value="">Semua harga</option>
            <option value="under-500">Sampai Rp 500 juta</option>
            <option value="500-1000">Rp 500 juta – Rp 1 miliar</option>
            <option value="1000-2000">Rp 1 – 2 miliar</option>
            <option value="over-2000">Di atas Rp 2 miliar</option>
          </select>
        </div>
        <div>
          <label htmlFor={`${idPrefix}-bedrooms`} className="field-label">Kamar Tidur</label>
          <select
            id={`${idPrefix}-bedrooms`}
            value={filters.bedrooms}
            onChange={(event) => update('bedrooms', event.target.value)}
            className="field-control"
          >
            <option value="">Semua</option>
            <option value="1">1 kamar</option>
            <option value="2">2 kamar</option>
            <option value="3">3 kamar</option>
            <option value="4">4+ kamar</option>
          </select>
        </div>
        <div>
          <label htmlFor={`${idPrefix}-status`} className="field-label">Status</label>
          <select
            id={`${idPrefix}-status`}
            value={filters.status}
            onChange={(event) => update('status', event.target.value)}
            className="field-control"
          >
            <option value="">Semua status</option>
            {(Object.keys(statusLabels) as PropertyStatus[])
              .filter((status) => status !== 'terjual')
              .map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
          </select>
        </div>
      </div>

      {mobile && (
        <div className="sticky bottom-0 border-t border-slate-200 bg-white px-5 py-4">
          <button
            type="button"
            onClick={onReset}
            disabled={!hasActiveFilter}
            aria-label="Atur ulang semua filter"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-primary-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw size={16} aria-hidden="true" /> Atur Ulang Filter
          </button>
        </div>
      )}
    </div>
  )
}
