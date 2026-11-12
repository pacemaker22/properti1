import {
  isSupabaseConfigured,
  PROPERTY_PHOTOS_BUCKET,
  supabase,
} from './supabase'
import type { PropertyInsert, PropertyRow, PropertyUpdate } from '../types/database'
import type { Property, PropertyStatus, PropertyType } from '../types/property'

/**
 * Every buyer-facing read goes through this table with `admin_status = 'approved'`.
 * The dataset lives in Supabase only - there is no bundled mock file and no
 * localStorage fallback, so the page always reflects the real database.
 */
const PROPERTIES_TABLE = 'properties'
const APPROVED_STATUS = 'approved'
const PENDING_STATUS = 'pending'

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
  admin_status: row.admin_status ?? 'approved',
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

export const fetchProperties = async (sellerId?: string): Promise<Property[]> => {
  ensureConfigured()

  // Only approved rows are public. The filter is also the database default
  // (RLS policy hides everything else), this keeps it explicit for the client.
  const { data, error } = await supabase
    .from(PROPERTIES_TABLE)
    .select('*')
    .eq('admin_status', APPROVED_STATUS)
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
    // New listings always wait for admin moderation before they go public.
    admin_status: PENDING_STATUS,
  }

  const { data, error } = await supabase
    .from(PROPERTIES_TABLE)
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
      await supabase.from(PROPERTIES_TABLE).delete().eq('id', propertyId)
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
    .from(PROPERTIES_TABLE)
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
  ensureConfigured()

  const { error } = await supabase
    .from(PROPERTIES_TABLE)
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
  ensureConfigured()

  const status: PropertyStatus = sold ? 'terjual' : previousStatus
  const { data, error } = await supabase
    .from(PROPERTIES_TABLE)
    .update({ status, is_sold: sold })
    .eq('id', property.id)
    .eq('seller_id', sellerId)
    .select('*')
    .single()

  if (error) throw new Error(`Gagal mengubah status iklan: ${error.message}`)
  return mapPropertyRow(data as PropertyRow)
}
