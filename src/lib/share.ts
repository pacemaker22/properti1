import { formatRupiah } from './format'
import { listingUrl } from './seo'
import type { Property } from '../types/property'

/** "Rumah Minimalis 2 Lantai di Bintaro - Rp 850.000.000 di Bintaro, Jakarta Selatan" */
export const propertyShareText = (property: Property) =>
  `${property.title} - ${formatRupiah(property.price)} di ${property.district}, ${property.city}`

export const propertyShareUrl = (propertyId: string) => listingUrl(propertyId)

/** Opens WhatsApp with a "choose a contact to send to" sheet. */
export const propertyWhatsAppShareUrl = (property: Property) => {
  const text = propertyShareText(property) + ' ' + propertyShareUrl(property.id)
  return 'https://wa.me/?text=' + encodeURIComponent(text)
}
