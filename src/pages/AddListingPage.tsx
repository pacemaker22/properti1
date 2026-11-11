import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  FileText,
  MapPin,
  Phone,
  ShieldCheck,
  Upload,
} from 'lucide-react'
import { PhotoUploader, type PhotoPreview } from '../components/PhotoUploader'
import { isValidWhatsAppNumber } from '../lib/contact'
import { listingCities } from '../lib/properties'
import { type ListingDraft, useListings } from '../lib/listings'
import { useAuth } from '../lib/auth'
import { isSupabaseConfigured } from '../lib/supabase'
import type { PropertyStatus, PropertyType } from '../types/property'

interface ListingFormValues {
  title: string
  type: PropertyType | ''
  status: PropertyStatus
  price: string
  city: string
  district: string
  privateAddress: string
  bedrooms: string
  bathrooms: string
  landArea: string
  buildingArea: string
  certificate: string
  description: string
  agentName: string
  whatsapp: string
  agreement: boolean
}

type FormField = keyof ListingFormValues | 'photos'
type FormErrors = Partial<Record<FormField, string>>

const emptyForm: ListingFormValues = {
  title: '',
  type: '',
  status: 'dijual',
  price: '',
  city: '',
  district: '',
  privateAddress: '',
  bedrooms: '',
  bathrooms: '',
  landArea: '',
  buildingArea: '',
  certificate: '',
  description: '',
  agentName: '',
  whatsapp: '',
  agreement: false,
}

const formatPriceInput = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 15)
  return digits ? Number(digits).toLocaleString('id-ID') : ''
}

const validateForm = (
  values: ListingFormValues,
  photos: PhotoPreview[],
): FormErrors => {
  const errors: FormErrors = {}

  if (!values.title.trim()) errors.title = 'Judul iklan wajib diisi.'
  else if (values.title.trim().length > 80)
    errors.title = 'Judul iklan maksimal 80 karakter.'

  if (!values.type) errors.type = 'Tipe properti wajib dipilih.'
  if (!values.price.trim()) errors.price = 'Harga wajib diisi.'
  else if (Number(values.price) <= 0) errors.price = 'Harga harus lebih besar dari 0.'
  if (!values.city) errors.city = 'Kota wajib dipilih.'
  if (!values.district.trim()) errors.district = 'Kecamatan wajib diisi.'

  const numericFields: Array<{
    field: 'bedrooms' | 'bathrooms' | 'landArea' | 'buildingArea'
    label: string
  }> = [
    { field: 'bedrooms', label: 'Jumlah kamar tidur' },
    { field: 'bathrooms', label: 'Jumlah kamar mandi' },
    { field: 'landArea', label: 'Luas tanah' },
    { field: 'buildingArea', label: 'Luas bangunan' },
  ]

  numericFields.forEach(({ field, label }) => {
    if (!values[field].trim()) errors[field] = `${label} wajib diisi.`
    else if (Number(values[field]) < 0) errors[field] = `${label} tidak boleh negatif.`
  })

  if (!values.certificate) errors.certificate = 'Sertifikat wajib dipilih.'
  if (!values.description.trim()) errors.description = 'Deskripsi wajib diisi.'
  else if (values.description.trim().length < 100)
    errors.description = 'Deskripsi minimal 100 karakter.'
  if (!values.agentName.trim()) errors.agentName = 'Nama agen atau penjual wajib diisi.'
  if (!values.whatsapp.trim()) errors.whatsapp = 'Nomor WhatsApp wajib diisi.'
  else if (!isValidWhatsAppNumber(values.whatsapp))
    errors.whatsapp = 'Gunakan format 08... atau +62 dengan 10–13 digit.'
  if (photos.length === 0) errors.photos = 'Tambahkan minimal 1 foto properti.'
  if (!values.agreement)
    errors.agreement = 'Anda harus menyetujui bahwa iklan ini benar dan Anda pemilik atau agen resmi.'

  return errors
}

const getErrorClass = (hasError: boolean) =>
  hasError
    ? 'border-error-red focus:border-error-red focus:ring-slate-200'
    : 'border-slate-200 focus:border-primary-500 focus:ring-slate-200'

const FieldError = ({ message, id }: { message?: string; id: string }) =>
  message ? (
    <p id={id} className="mt-1.5 flex items-start gap-1 text-xs font-medium text-error-red">
      <AlertCircle size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
      {message}
    </p>
  ) : null

const FormSection = ({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Building2
  title: string
  description: string
  children: ReactNode
}) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
    <div className="flex items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-primary-600">
        <Icon size={20} aria-hidden="true" />
      </span>
      <div>
        <h2 className="font-bold text-navy">{title}</h2>
        <p className="mt-1 text-xs leading-5 text-text-grey">{description}</p>
      </div>
    </div>
    <div className="mt-5 space-y-4">{children}</div>
  </section>
)

const toFormValues = (listing: {
  title: string
  price: number
  type: PropertyType
  status: PropertyStatus
  city: string
  district: string
  private_address?: string
  bedrooms: number
  bathrooms: number
  land_area: number
  building_area: number
  certificate: string
  description: string
  agent_name: string
  whatsapp: string
}): ListingFormValues => ({
  title: listing.title,
  type: listing.type,
  status: listing.status,
  price: String(listing.price),
  city: listing.city,
  district: listing.district,
  privateAddress: listing.private_address ?? '',
  bedrooms: String(listing.bedrooms),
  bathrooms: String(listing.bathrooms),
  landArea: String(listing.land_area),
  buildingArea: String(listing.building_area),
  certificate: listing.certificate,
  description: listing.description,
  agentName: listing.agent_name,
  whatsapp: listing.whatsapp,
  agreement: false,
})

export function AddListingPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { myListings, addListing, updateListing, loading, error, refreshListings } = useListings()
  const { user, authLoading, openAuthModal } = useAuth()
  const editingListing = id
    ? myListings.find((listing) => listing.id === id)
    : undefined
  const [form, setForm] = useState<ListingFormValues>(() =>
    editingListing ? toFormValues(editingListing) : emptyForm,
  )
  const [photos, setPhotos] = useState<PhotoPreview[]>(() =>
    editingListing?.photos.map((url, index) => ({
      id: `existing-${index}-${url}`,
      url,
      name: `Foto ${index + 1}`,
      existing: true,
    })) ?? [],
  )
  const [errors, setErrors] = useState<FormErrors>({})
  const [publishedId, setPublishedId] = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [publishError, setPublishError] = useState('')

  useEffect(() => {
    if (!editingListing) return

    setForm(toFormValues(editingListing))
    setPhotos(
      editingListing.photos.map((url, index) => ({
        id: `existing-${index}-${url}`,
        url,
        name: `Foto ${index + 1}`,
        existing: true,
      })),
    )
    setErrors({})
    setPublishedId(null)
  }, [editingListing?.id])

  const updateField = <K extends keyof ListingFormValues,>(
    field: K,
    value: ListingFormValues[K],
  ) => {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })
  }

  const handlePhotosChange = (nextPhotos: PhotoPreview[]) => {
    setPhotos(nextPhotos)
    setErrors((current) => {
      if (!current.photos) return current
      const next = { ...current }
      delete next.photos
      return next
    })
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPublishError('')
    const nextErrors = validateForm(form, photos)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      window.requestAnimationFrame(() => {
        document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
      })
      return
    }

    if (isSupabaseConfigured && !user) {
      setPublishError('Silakan masuk sebagai penjual sebelum menerbitkan iklan.')
      openAuthModal('login')
      return
    }

    const draft: ListingDraft = {
      title: form.title.trim(),
      price: Number(form.price.replace(/\D/g, '')),
      type: form.type as PropertyType,
      status: form.status,
      city: form.city,
      district: form.district.trim(),
      privateAddress: form.privateAddress.trim(),
      bedrooms: Number(form.bedrooms),
      bathrooms: Number(form.bathrooms),
      landArea: Number(form.landArea),
      buildingArea: Number(form.buildingArea),
      certificate: form.certificate,
      description: form.description.trim(),
      agentName: form.agentName.trim(),
      whatsapp: form.whatsapp.trim(),
      photos: photos.map((photo) => ({
        url: photo.url,
        name: photo.name,
        file: photo.file,
        existing: photo.existing,
      })),
      floors: editingListing?.floors ?? 1,
      parking: editingListing?.parking ?? 0,
      yearBuilt: editingListing?.year_built ?? new Date().getFullYear(),
      furnished: editingListing?.furnished ?? false,
      electricity: editingListing?.electricity ?? 0,
    }

    setPublishing(true)
    try {
      const savedListing = editingListing
        ? await updateListing(editingListing.id, draft)
        : await addListing(draft)

      if (savedListing) {
        setPublishedId(savedListing.id)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } catch (caughtError) {
      setPublishError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Gagal menyimpan iklan. Silakan coba lagi.',
      )
    } finally {
      setPublishing(false)
    }
  }

  if (id && (authLoading || loading)) {
    return (
      <section className="container-page py-16 text-center" role="status">
        <div className="mx-auto h-12 w-12 animate-pulse rounded-2xl bg-slate-200" />
        <p className="mt-4 text-sm text-text-grey">Memuat data iklan…</p>
      </section>
    )
  }

  if (id && isSupabaseConfigured && !user) {
    return (
      <section className="container-page py-16 text-center">
        <AlertCircle size={36} className="mx-auto text-text-grey" aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-bold text-navy">Masuk untuk mengelola iklan</h1>
        <p className="mt-2 text-sm text-text-grey">Anda harus masuk sebagai penjual untuk membuka halaman ini.</p>
        <button
          type="button"
          onClick={() => openAuthModal('login')}
          className="mt-6 inline-flex h-11 items-center rounded-xl bg-primary-500 px-5 text-sm font-bold text-white transition hover:bg-primary-600"
        >
          Masuk sebagai Penjual
        </button>
      </section>
    )
  }

  if (id && error) {
    return (
      <section className="container-page py-16 text-center" role="alert">
        <AlertCircle size={36} className="mx-auto text-error-red" aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-bold text-navy">Gagal memuat iklan</h1>
        <p className="mt-2 text-sm text-text-grey">{error}</p>
        <button
          type="button"
          onClick={() => void refreshListings()}
          className="mt-6 inline-flex h-11 items-center rounded-xl bg-primary-500 px-5 text-sm font-bold text-white transition hover:bg-primary-600"
        >
          Coba Lagi
        </button>
      </section>
    )
  }

  if (id && !editingListing) {
    return (
      <section className="container-page py-16 text-center">
        <AlertCircle size={36} className="mx-auto text-text-grey" aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-bold text-navy">Iklan tidak ditemukan</h1>
        <p className="mt-2 text-sm text-text-grey">Iklan yang ingin Anda ubah tidak tersedia.</p>
        <Link to="/iklan-saya" className="mt-6 inline-flex h-11 items-center rounded-xl bg-primary-500 px-5 text-sm font-bold text-white">
          Kembali ke Iklan Saya
        </Link>
      </section>
    )
  }

  if (publishedId) {
    return (
      <section className="container-page py-12 sm:py-16">
        <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-card sm:p-10">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-primary-600">
            <CheckCircle2 size={32} aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-2xl font-bold text-navy sm:text-3xl">
            {editingListing ? 'Iklan berhasil diperbarui!' : 'Iklan berhasil diterbitkan!'}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-text-grey">
            {editingListing
              ? 'Perubahan pada iklan Anda sudah tersimpan di Supabase.'
              : 'Iklan Anda sudah tampil di beranda dan siap dilihat pembeli.'}
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to={`/properti/${publishedId}`} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary-500 px-5 text-sm font-bold text-white transition hover:bg-primary-600">
              Lihat Detail Iklan
            </Link>
            <Link to="/iklan-saya" className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-navy transition hover:border-primary-500">
              Lihat Iklan Saya
            </Link>
          </div>
          <button
            type="button"
            onClick={() => {
              setForm(emptyForm)
              setPhotos([])
              setErrors({})
              setPublishedId(null)
              navigate('/tambah-iklan')
            }}
            className="mt-5 text-sm font-bold text-primary-600 hover:text-primary-500"
          >
            Pasang Iklan Lainnya
          </button>
        </div>
      </section>
    )
  }

  const descriptionLength = form.description.trim().length

  return (
    <section className="container-page py-10 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold text-primary-600">Gratis dan mudah</p>
            <h1 className="mt-1 text-2xl font-bold text-navy sm:text-3xl">
              {editingListing ? 'Ubah Iklan Properti' : 'Pasang Iklan Gratis'}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-text-grey">
              {editingListing
                ? 'Perbarui informasi iklan sesuai kondisi properti saat ini.'
                : 'Isi detail properti dengan lengkap agar pembeli lebih tertarik.'}
            </p>
          </div>
          <Link to="/iklan-saya" className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-navy transition hover:border-primary-500">
            Iklan Saya
          </Link>
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-8">
          <div className="grid gap-5 lg:grid-cols-2">
            <FormSection icon={Building2} title="Informasi Dasar" description="Informasi utama yang akan dilihat pembeli.">
              <div>
                <label htmlFor="listing-title" className="field-label">Judul Iklan <span className="text-error-red">*</span></label>
                <input
                  id="listing-title"
                  type="text"
                  value={form.title}
                  onChange={(event) => updateField('title', event.target.value)}
                  maxLength={80}
                  placeholder="Contoh: Rumah Minimalis 2 Lantai di Bintaro"
                  aria-invalid={Boolean(errors.title)}
                  aria-describedby={errors.title ? 'listing-title-error' : undefined}
                  className={`field-control ${getErrorClass(Boolean(errors.title))}`}
                />
                <div className="mt-1 flex justify-between gap-3">
                  <FieldError id="listing-title-error" message={errors.title} />
                  <span className="ml-auto text-[11px] text-text-grey">{form.title.length}/80</span>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="listing-type" className="field-label">Tipe Properti <span className="text-error-red">*</span></label>
                  <select id="listing-type" value={form.type} onChange={(event) => updateField('type', event.target.value as PropertyType)} aria-invalid={Boolean(errors.type)} aria-describedby={errors.type ? 'listing-type-error' : undefined} className={`field-control ${getErrorClass(Boolean(errors.type))}`}>
                    <option value="">Pilih tipe</option>
                    <option value="rumah">Rumah</option>
                    <option value="apartemen">Apartemen</option>
                    <option value="tanah">Tanah</option>
                    <option value="ruko">Ruko</option>
                    <option value="lainnya">Lainnya</option>
                    {(editingListing?.type === 'kost' || editingListing?.type === 'villa') && (
                      <option value={editingListing.type}>{editingListing.type === 'kost' ? 'Kost' : 'Villa'}</option>
                    )}
                  </select>
                  <FieldError id="listing-type-error" message={errors.type} />
                </div>
                <div>
                  <label htmlFor="listing-status" className="field-label">Status <span className="text-error-red">*</span></label>
                  <select id="listing-status" value={form.status} onChange={(event) => updateField('status', event.target.value as PropertyStatus)} className="field-control">
                    <option value="dijual">Dijual</option>
                    <option value="disewa">Disewa</option>
                    {editingListing?.status === 'terjual' && <option value="terjual">Terjual</option>}
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="listing-price" className="field-label">Harga (Rp) <span className="text-error-red">*</span></label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-text-grey">Rp</span>
                  <input
                    id="listing-price"
                    type="text"
                    inputMode="numeric"
                    value={form.price ? formatPriceInput(form.price) : ''}
                    onChange={(event) => updateField('price', event.target.value.replace(/\D/g, ''))}
                    placeholder="Contoh: 850000000"
                    aria-invalid={Boolean(errors.price)}
                    aria-describedby={errors.price ? 'listing-price-error' : undefined}
                    className={`field-control pl-11 ${getErrorClass(Boolean(errors.price))}`}
                  />
                </div>
                <FieldError id="listing-price-error" message={errors.price} />
              </div>
            </FormSection>
            <FormSection icon={MapPin} title="Lokasi" description="Tampilkan lokasi umum, tanpa alamat lengkap rumah.">
              <div>
                <label htmlFor="listing-city" className="field-label">Kota <span className="text-error-red">*</span></label>
                <select id="listing-city" value={form.city} onChange={(event) => updateField('city', event.target.value)} aria-invalid={Boolean(errors.city)} aria-describedby={errors.city ? 'listing-city-error' : undefined} className={`field-control ${getErrorClass(Boolean(errors.city))}`}>
                  <option value="">Pilih kota</option>
                  {listingCities.map((city) => <option key={city} value={city}>{city}</option>)}
                </select>
                <FieldError id="listing-city-error" message={errors.city} />
              </div>
              <div>
                <label htmlFor="listing-district" className="field-label">Kecamatan <span className="text-error-red">*</span></label>
                <input id="listing-district" type="text" value={form.district} onChange={(event) => updateField('district', event.target.value)} placeholder="Contoh: Bintaro Jaya" aria-invalid={Boolean(errors.district)} aria-describedby={errors.district ? 'listing-district-error' : undefined} className={`field-control ${getErrorClass(Boolean(errors.district))}`} />
                <FieldError id="listing-district-error" message={errors.district} />
              </div>
              <div>
                <label htmlFor="listing-address" className="field-label">Alamat Lengkap <span className="font-normal text-text-grey">(opsional)</span></label>
                <textarea id="listing-address" value={form.privateAddress} onChange={(event) => updateField('privateAddress', event.target.value)} rows={3} placeholder="Alamat lengkap hanya untuk catatan Anda" className="field-control h-auto resize-y py-3" />
                <p className="mt-1.5 text-xs leading-5 text-text-grey">Alamat lengkap tidak ditampilkan ke publik.</p>
              </div>
            </FormSection>

            <FormSection icon={ShieldCheck} title="Spesifikasi Properti" description="Masukkan ukuran dan rincian utama properti.">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="listing-bedrooms" className="field-label">Kamar Tidur <span className="text-error-red">*</span></label>
                  <input id="listing-bedrooms" type="number" min="0" value={form.bedrooms} onChange={(event) => updateField('bedrooms', event.target.value)} placeholder="Contoh: 3" aria-invalid={Boolean(errors.bedrooms)} aria-describedby={errors.bedrooms ? 'listing-bedrooms-error' : undefined} className={`field-control ${getErrorClass(Boolean(errors.bedrooms))}`} />
                  <FieldError id="listing-bedrooms-error" message={errors.bedrooms} />
                </div>
                <div>
                  <label htmlFor="listing-bathrooms" className="field-label">Kamar Mandi <span className="text-error-red">*</span></label>
                  <input id="listing-bathrooms" type="number" min="0" value={form.bathrooms} onChange={(event) => updateField('bathrooms', event.target.value)} placeholder="Contoh: 2" aria-invalid={Boolean(errors.bathrooms)} aria-describedby={errors.bathrooms ? 'listing-bathrooms-error' : undefined} className={`field-control ${getErrorClass(Boolean(errors.bathrooms))}`} />
                  <FieldError id="listing-bathrooms-error" message={errors.bathrooms} />
                </div>
                <div>
                  <label htmlFor="listing-land-area" className="field-label">Luas Tanah (m²) <span className="text-error-red">*</span></label>
                  <input id="listing-land-area" type="number" min="0" value={form.landArea} onChange={(event) => updateField('landArea', event.target.value)} placeholder="Contoh: 120" aria-invalid={Boolean(errors.landArea)} aria-describedby={errors.landArea ? 'listing-land-area-error' : undefined} className={`field-control ${getErrorClass(Boolean(errors.landArea))}`} />
                  <FieldError id="listing-land-area-error" message={errors.landArea} />
                </div>
                <div>
                  <label htmlFor="listing-building-area" className="field-label">Luas Bangunan (m²) <span className="text-error-red">*</span></label>
                  <input id="listing-building-area" type="number" min="0" value={form.buildingArea} onChange={(event) => updateField('buildingArea', event.target.value)} placeholder="Contoh: 90" aria-invalid={Boolean(errors.buildingArea)} aria-describedby={errors.buildingArea ? 'listing-building-area-error' : undefined} className={`field-control ${getErrorClass(Boolean(errors.buildingArea))}`} />
                  <FieldError id="listing-building-area-error" message={errors.buildingArea} />
                </div>
              </div>
              <div>
                <label htmlFor="listing-certificate" className="field-label">Sertifikat <span className="text-error-red">*</span></label>
                <select id="listing-certificate" value={form.certificate} onChange={(event) => updateField('certificate', event.target.value)} aria-invalid={Boolean(errors.certificate)} aria-describedby={errors.certificate ? 'listing-certificate-error' : undefined} className={`field-control ${getErrorClass(Boolean(errors.certificate))}`}>
                  <option value="">Pilih sertifikat</option>
                  <option value="SHM">SHM</option>
                  <option value="HGB">HGB</option>
                  <option value="HPL">HPL</option>
                  <option value="PPJB">PPJB</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
                <FieldError id="listing-certificate-error" message={errors.certificate} />
              </div>
            </FormSection>
            <FormSection icon={FileText} title="Deskripsi" description="Jelaskan kondisi, keunggulan, dan aksesibilitas properti.">
              <div>
                <label htmlFor="listing-description" className="field-label">Deskripsi <span className="text-error-red">*</span></label>
                <textarea
                  id="listing-description"
                  value={form.description}
                  onChange={(event) => updateField('description', event.target.value)}
                  rows={7}
                  placeholder="Contoh: Rumah modern siap huni dengan desain minimalis, pencahayaan alami, dan akses mudah ke pusat Jakarta. Bangunan baru, bersih, serta berada di lingkungan keluarga yang aman dan nyaman."
                  aria-invalid={Boolean(errors.description)}
                  aria-describedby={errors.description ? 'listing-description-error' : 'listing-description-help'}
                  className={`field-control h-auto resize-y py-3 ${getErrorClass(Boolean(errors.description))}`}
                />
                <div className="mt-1 flex items-start justify-between gap-3">
                  <FieldError id="listing-description-error" message={errors.description} />
                  <span id="listing-description-help" className={`ml-auto shrink-0 text-xs ${descriptionLength < 100 ? 'text-error-red' : 'text-text-grey'}`}>
                    {descriptionLength}/100 karakter minimal
                  </span>
                </div>
              </div>
            </FormSection>

            <FormSection icon={Upload} title="Foto Properti" description="Unggah 1–8 foto. Foto pertama akan digunakan sebagai foto utama.">
              <PhotoUploader photos={photos} onChange={handlePhotosChange} error={errors.photos} />
            </FormSection>

            <FormSection icon={Phone} title="Kontak Penjual" description="Gunakan nomor WhatsApp yang aktif agar pembeli dapat menghubungi Anda.">
              <div>
                <label htmlFor="listing-agent-name" className="field-label">Nama Agen / Penjual <span className="text-error-red">*</span></label>
                <input id="listing-agent-name" type="text" value={form.agentName} onChange={(event) => updateField('agentName', event.target.value)} placeholder="Contoh: Budi Santoso" aria-invalid={Boolean(errors.agentName)} aria-describedby={errors.agentName ? 'listing-agent-name-error' : undefined} className={`field-control ${getErrorClass(Boolean(errors.agentName))}`} />
                <FieldError id="listing-agent-name-error" message={errors.agentName} />
              </div>
              <div>
                <label htmlFor="listing-whatsapp" className="field-label">Nomor WhatsApp <span className="text-error-red">*</span></label>
                <input id="listing-whatsapp" type="tel" inputMode="tel" value={form.whatsapp} onChange={(event) => updateField('whatsapp', event.target.value)} placeholder="Contoh: 081234567890" aria-invalid={Boolean(errors.whatsapp)} aria-describedby={errors.whatsapp ? 'listing-whatsapp-error' : 'listing-whatsapp-help'} className={`field-control ${getErrorClass(Boolean(errors.whatsapp))}`} />
                <FieldError id="listing-whatsapp-error" message={errors.whatsapp} />
                {!errors.whatsapp && <p id="listing-whatsapp-help" className="mt-1.5 text-xs text-text-grey">Format 08... atau +62, terdiri dari 10–13 digit.</p>}
              </div>
              <div>
                <label className={`flex cursor-pointer items-start gap-3 rounded-xl border bg-slate-50 p-4 ${errors.agreement ? 'border-error-red' : 'border-slate-200'}`}>
                  <input
                    type="checkbox"
                    checked={form.agreement}
                    onChange={(event) => updateField('agreement', event.target.checked)}
                    aria-invalid={Boolean(errors.agreement)}
                    aria-describedby={errors.agreement ? 'listing-agreement-error' : undefined}
                    className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-sm leading-6 text-text-dark">
                    Saya setuju listing ini benar dan saya pemilik / agen resmi.
                    <span className="text-error-red"> *</span>
                  </span>
                </label>
                <FieldError id="listing-agreement-error" message={errors.agreement} />
              </div>
            </FormSection>
          </div>
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
            {publishError && (
              <p className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-xs font-medium text-error-red" role="alert">
                <AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                {publishError}
              </p>
            )}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-navy">Siap menerbitkan iklan?</p>
                <p className="mt-1 text-xs leading-5 text-text-grey">Dengan menerbitkan iklan ini, Anda menyatakan data yang diisi sudah benar.</p>
              </div>
              <button type="submit" disabled={publishing} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary-500 px-6 text-sm font-bold text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">
                <CheckCircle2 size={18} aria-hidden="true" />
                {publishing ? 'Menyimpan...' : editingListing ? 'Simpan Perubahan' : 'Terbitkan Iklan'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  )
}

