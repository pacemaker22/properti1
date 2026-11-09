export const formatRupiah = (price: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(price)

export const formatArea = (area: number) => `${area.toLocaleString('id-ID')} m²`

export const formatDate = (date: string) =>
  new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))

export const typeLabels = {
  rumah: 'Rumah',
  apartemen: 'Apartemen',
  tanah: 'Tanah',
  ruko: 'Ruko',
  kost: 'Kost',
  villa: 'Villa',
} as const

export const statusLabels = {
  dijual: 'Dijual',
  disewa: 'Disewa',
  terjual: 'Terjual',
} as const
