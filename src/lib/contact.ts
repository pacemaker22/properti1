import type { Property } from '../types/property'
import { formatRupiah } from './format'

// Public WhatsApp number of properti1.com used for listing enquiries.
export const PLATFORM_WHATSAPP = '6281234567890'

export const normalizeWhatsAppNumber = (number: string) => {
  const digits = number.replace(/\D/g, '')
  if (digits.startsWith('0')) return `62${digits.slice(1)}`
  if (digits.startsWith('8')) return `62${digits}`
  return digits
}

export const getPropertyUrl = (propertyId: string) => {
  const origin = typeof window === 'undefined' ? 'https://properti1.com' : window.location.origin
  return `${origin}/properti/${propertyId}`
}

export const getWhatsAppMessage = (property: Property, origin?: string) => {
  const baseUrl = origin ?? getPropertyUrl(property.id)
  const formattedPrice = formatRupiah(property.price)
  return `Halo, saya tertarik dengan ${property.title} (${formattedPrice}) di properti1.com. Apakah masih tersedia? ${baseUrl}`
}

export const getWhatsAppUrl = (property: Property, origin?: string) =>
  `https://wa.me/${normalizeWhatsAppNumber(property.whatsapp)}?text=${encodeURIComponent(getWhatsAppMessage(property, origin))}`

export const getPhoneUrl = (property: Property) => `tel:+${normalizeWhatsAppNumber(property.whatsapp)}`

export const getPlatformWhatsAppUrl = (message: string) =>
  `https://wa.me/${PLATFORM_WHATSAPP}?text=${encodeURIComponent(message)}`

export const LISTING_ENQUIRY_MESSAGE =
  'Halo, saya ingin memasang iklan gratis di properti1.com. Boleh dibantu?'
