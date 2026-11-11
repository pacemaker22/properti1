import {
  isSupabaseConfigured,
  PROPERTY_PHOTOS_BUCKET,
  supabase,
} from './supabase'
import demoProperties from '../data/properties.json'
import type { PropertyInsert, PropertyRow, PropertyUpdate } from '../types/database'
import type { Property, PropertyStatus, PropertyType } from '../types/property'

const demoListings: Property[] = demoProperties.map((property) => ({
  ...property,
  type: property.type as PropertyType,
  status: property.status as PropertyStatus,
  seller_id: null,
}))

/**
 * Milestone 2 fallback ("mode lokal").
 *
 * Until the Supabase environment variables are filled in, listings created from
 * the Add Listing form live in localStorage so the seller flow works without a
 * backend. Once Supabase is configured the code below takes the network path and
 * this store is never read, so nothing has to be migrated by hand.
 */
const LOCAL_LISTINGS_KEY = 'properti1:local-listings'
const LOCAL_OWNER_KEY = 'properti1:local-owner-id'

const localOwnerId = (): string => {
  if (typeof window === 'undefined') return 'local-owner'
  try {
    const stored = window.localStorage.getItem(LOCAL_OWNER_KEY)
    if (stored) return stored
    const created = crypto.randomUUID()
    window.localStorage.setItem(LOCAL_OWNER_KEY, created)
    return created
  } catch {
    return 'local-owner'
  }
}

const readLocalListings = (): Property[] => {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(LOCAL_LISTINGS_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as Property[]) : []
  } catch {
    return []
  }
}

const writeLocalListings = (listings: Property[]) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(LOCAL_LISTINGS_KEY, JSON.stringify(listings))
  } catch {
    // Storage can be unavailable (private mode / quota). The in-memory state still works.
  }
}

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = () => resolve('')
    reader.readAsDataURL(file)
  })

const applyDraft = (property: Property, draft: ListingDraft): Property => ({
  ...property,
  title: draft.title.trim(),
  price: draft.price,
  type: draft.type,
  status: draft.status,
  city: draft.city,
  district: draft.district.trim(),
  bedrooms: draft.bedrooms,
  bathrooms: draft.bathrooms,
  land_area: draft.landArea,
  building_area: draft.buildingArea,
  certificate: draft.certificate,
  description: draft.description.trim(),
  agent_name: draft.agentName.trim(),
  whatsapp: draft.whatsapp.trim(),
  private_address: draft.privateAddress.trim() || undefined,
  floors: draft.floors,
  parking: draft.parking,
  year_built: draft.yearBuilt,
  furnished: draft.furnished,
  electricity: draft.electricity,
  is_sold: draft.status === 'terjual',
})

export interface ListingPhotoInput {
  url: string
  name?: string
  file?: File
  existing?: boolean
}

export interface ListingDraft {
  title: string
  price: number
  type: PropertyType
  status: PropertyStatus
  city: string
  district: string
  privateAddress: string
  bedrooms: number
  bathrooms: number
  landArea: number
  buildingArea: number
  certificate: string
  description: string
  agentName: string
  whatsapp: string
  photos: ListingPhotoInput[]
  floors: number
  parking: number
  yearBuilt: number
  furnished: boolean
  electricity: number
}

const propertyTypes: PropertyType[] = [
  'rumah',
  'apartemen',
  'tanah',
  'ruko',
  'kost',
  'villa',
  'lainnya',
]
const propertyStatuses: PropertyStatus[] = ['dijual', 'disewa', 'terjual']

const asPropertyType = (value: string): PropertyType =>
  propertyTypes.includes(value as PropertyType)
    ? (value as PropertyType)
    : 'lainnya'

const asPropertyStatus = (value: string): PropertyStatus =>
  propertyStatuses.includes(value as PropertyStatus)
    ? (value as PropertyStatus)
    : 'dijual'

const mapPropertyRow = (
  row: PropertyRow,
  privateAddress?: string,
): Property => ({
  id: row.id,
  title: row.title,
  price: Number(row.price),
  type: asPropertyType(row.type),
  status: asPropertyStatus(row.status),
  city: row.city,
  district: row.district,
  bedrooms: row.bedrooms,
  bathrooms: row.bathrooms,
  land_area: row.land_area,
  building_area: row.building_area,
  certificate: row.certificate,
  floors: row.floors,
  parking: row.parking,
  year_built: row.year_built,
  furnished: row.furnished,
  electricity: row.electricity,
  description: row.description,
  photos: Array.isArray(row.photos) ? row.photos : [],
  agent_name: row.agent_name,
  agent_photo: row.agent_photo,
  whatsapp: row.whatsapp,
  private_address: privateAddress || undefined,
  seller_id: row.seller_id,
  is_sold: row.is_sold,
  is_featured: row.is_featured,
  view_count: row.view_count,
  created_at: row.created_at,
})

const getStoragePath = (url: string) => {
  const marker = '/storage/v1/object/public/property-photos/'
  const markerIndex = url.indexOf(marker)
  if (markerIndex === -1) return null
  return decodeURIComponent(url.slice(markerIndex + marker.length))
}

const removeStoredPaths = async (paths: string[]) => {
  if (paths.length === 0) return
  await supabase.storage.from(PROPERTY_PHOTOS_BUCKET).remove(paths)
}

const removeStoredFiles = async (urls: string[]) => {
  const paths = urls.map(getStoragePath).filter((path): path is string => Boolean(path))
  await removeStoredPaths(paths)
}

const uploadListingPhotos = async (
  photos: ListingPhotoInput[],
  sellerId: string,
  propertyId: string,
) => {
  const urls: string[] = []
  const uploadedPaths: string[] = []

  try {
    for (const photo of photos) {
      if (!photo.file) {
        urls.push(photo.url)
        continue
      }

      const safeName = photo.file.name.replace(/[^a-zA-Z0-9._-]/g, '-')
      const path = `${sellerId}/${propertyId}/${crypto.randomUUID()}-${safeName}`
      const { error } = await supabase.storage
        .from(PROPERTY_PHOTOS_BUCKET)
        .upload(path, photo.file, {
          contentType: photo.file.type,
          upsert: false,
        })

      if (error) throw new Error(`Gagal mengunggah foto "${photo.file.name}".`)
      uploadedPaths.push(path)
      urls.push(
        supabase.storage.from(PROPERTY_PHOTOS_BUCKET).getPublicUrl(path).data
          .publicUrl,
      )
    }

    return { urls, uploadedPaths }
  } catch (error) {
    await removeStoredPaths(uploadedPaths)
    throw error
  }
}

const draftFields = (draft: ListingDraft, existing?: Property) => ({
  title: draft.title.trim(),
  price: draft.price,
  type: draft.type,
  status: draft.status,
  city: draft.city,
  district: draft.district.trim(),
  bedrooms: draft.bedrooms,
  bathrooms: draft.bathrooms,
  land_area: draft.landArea,
  building_area: draft.buildingArea,
  certificate: draft.certificate,
  floors: draft.floors,
  parking: draft.parking,
  year_built: draft.yearBuilt,
  furnished: draft.furnished,
  electricity: draft.electricity,
  description: draft.description.trim(),
  agent_name: draft.agentName.trim(),
  agent_photo: existing?.agent_photo ?? '',
  whatsapp: draft.whatsapp.trim(),
  is_sold: draft.status === 'terjual',
  is_featured: existing?.is_featured ?? false,
  view_count: existing?.view_count ?? 0,
})

const ensureConfigured = () => {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase belum dikonfigurasi. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY.',
    )
  }
}

const toLocalProperty = async (
  draft: ListingDraft,
  id: string,
  existing?: Property,
): Promise<Property> => {
  const photos = await Promise.all(
    draft.photos.map((photo) => (photo.file ? fileToDataUrl(photo.file) : photo.url)),
  )

  const base: Property =
    existing ??
    ({
      id,
      title: '',
      price: 0,
      type: draft.type,
      status: draft.status,
      city: '',
      district: '',
      bedrooms: 0,
      bathrooms: 0,
      land_area: 0,
      building_area: 0,
      certificate: '',
      floors: 0,
      parking: 0,
      year_built: 0,
      furnished: false,
      electricity: 0,
      description: '',
      photos: [],
      agent_name: '',
      agent_photo: '',
      whatsapp: '',
      seller_id: localOwnerId(),
      is_sold: false,
      is_featured: false,
      view_count: 0,
      created_at: new Date().toISOString(),
    } satisfies Property)

  return {
    ...applyDraft(base, draft),
    id,
    photos,
    seller_id: localOwnerId(),
  }
}

const upsertLocalListing = (listing: Property) => {
  const current = readLocalListings()
  const next = current.some((item) => item.id === listing.id)
    ? current.map((item) => (item.id === listing.id ? listing : item))
    : [listing, ...current]
  writeLocalListings(next)
}

export const fetchProperties = async (sellerId?: string): Promise<Property[]> => {
  if (!isSupabaseConfigured) {
    // Local mode: demo feed plus anything published from this browser.
    const localListings = readLocalListings()
    return [...localListings, ...demoListings]
  }

  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Gagal memuat properti: ${error.message}`)

  let privateAddresses = new Map<string, string>()
  if (sellerId) {
    const { data: privateDetails, error: privateError } = await supabase
      .from('property_private_details')
      .select('property_id, private_address')
      .eq('seller_id', sellerId)

    if (privateError) {
      throw new Error(`Gagal memuat data privat: ${privateError.message}`)
    }
    privateAddresses = new Map(
      (privateDetails ?? []).map((detail) => [detail.property_id, detail.private_address]),
    )
  }

  return (data as PropertyRow[]).map((row) =>
    mapPropertyRow(row, privateAddresses.get(row.id)),
  )
}

export const createProperty = async (
  draft: ListingDraft,
  sellerId: string,
): Promise<Property> => {
  if (!isSupabaseConfigured) {
    const listing = await toLocalProperty(draft, crypto.randomUUID())
    upsertLocalListing(listing)
    return listing
  }

  ensureConfigured()

  const propertyId = crypto.randomUUID()
  const { urls, uploadedPaths } = await uploadListingPhotos(
    draft.photos,
    sellerId,
    propertyId,
  )

  const insert: PropertyInsert = {
    id: propertyId,
    ...draftFields(draft),
    photos: urls,
    seller_id: sellerId,
    created_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('properties')
    .insert(insert)
    .select('*')
    .single()

  if (error) {
    await removeStoredPaths(uploadedPaths)
    throw new Error(`Gagal menyimpan iklan: ${error.message}`)
  }

  if (draft.privateAddress.trim()) {
    const { error: privateError } = await supabase
      .from('property_private_details')
      .insert({
        property_id: propertyId,
        seller_id: sellerId,
        private_address: draft.privateAddress.trim(),
      })

    if (privateError) {
      await supabase.from('properties').delete().eq('id', propertyId)
      await removeStoredPaths(uploadedPaths)
      throw new Error(`Gagal menyimpan alamat privat: ${privateError.message}`)
    }
  }

  return mapPropertyRow(data as PropertyRow, draft.privateAddress.trim())
}

export const updateProperty = async (
  existing: Property,
  draft: ListingDraft,
  sellerId: string,
): Promise<Property> => {
  if (!isSupabaseConfigured) {
    const listing = await toLocalProperty(draft, existing.id, existing)
    upsertLocalListing(listing)
    return listing
  }

  ensureConfigured()

  const { urls, uploadedPaths } = await uploadListingPhotos(
    draft.photos,
    sellerId,
    existing.id,
  )
  const update: PropertyUpdate = {
    ...draftFields(draft, existing),
    photos: urls,
  }

  const { data, error } = await supabase
    .from('properties')
    .update(update)
    .eq('id', existing.id)
    .eq('seller_id', sellerId)
    .select('*')
    .single()

  if (error) {
    await removeStoredPaths(uploadedPaths)
    throw new Error(`Gagal memperbarui iklan: ${error.message}`)
  }

  const privateAddress = draft.privateAddress.trim()
  if (privateAddress) {
    const { error: privateError } = await supabase
      .from('property_private_details')
      .upsert(
        {
          property_id: existing.id,
          seller_id: sellerId,
          private_address: privateAddress,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'property_id' },
      )

    if (privateError) {
      throw new Error(`Gagal memperbarui alamat privat: ${privateError.message}`)
    }
  } else {
    const { error: privateError } = await supabase
      .from('property_private_details')
      .delete()
      .eq('property_id', existing.id)
      .eq('seller_id', sellerId)

    if (privateError) {
      throw new Error(`Gagal menghapus alamat privat: ${privateError.message}`)
    }
  }

  const removedUrls = existing.photos.filter((url) => !urls.includes(url))
  await removeStoredFiles(removedUrls)

  return mapPropertyRow(data as PropertyRow, privateAddress)
}

export const deleteProperty = async (
  property: Property,
  sellerId: string,
) => {
  if (!isSupabaseConfigured) {
    writeLocalListings(
      readLocalListings().filter((listing) => listing.id !== property.id),
    )
    return
  }

  ensureConfigured()

  const { error } = await supabase
    .from('properties')
    .delete()
    .eq('id', property.id)
    .eq('seller_id', sellerId)

  if (error) throw new Error(`Gagal menghapus iklan: ${error.message}`)
  await removeStoredFiles(property.photos)
}

export const setPropertySold = async (
  property: Property,
  sold: boolean,
  sellerId: string,
  previousStatus: Exclude<PropertyStatus, 'terjual'>,
) => {
  if (!isSupabaseConfigured) {
    const listings = readLocalListings()
    const current = listings.find((listing) => listing.id === property.id) ?? property
    const updated: Property = {
      ...current,
      status: sold ? 'terjual' : previousStatus,
      is_sold: sold,
    }
    writeLocalListings(
      listings.map((listing) => (listing.id === property.id ? updated : listing)),
    )
    return updated
  }

  ensureConfigured()

  const status: PropertyStatus = sold ? 'terjual' : previousStatus
  const { data, error } = await supabase
    .from('properties')
    .update({ status, is_sold: sold })
    .eq('id', property.id)
    .eq('seller_id', sellerId)
    .select('*')
    .single()

  if (error) throw new Error(`Gagal mengubah status iklan: ${error.message}`)
  return mapPropertyRow(data as PropertyRow)
}
