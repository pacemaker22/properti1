import { LegalPage } from '../components/LegalPage'
import { Seo } from '../components/Seo'
import { pageTitle } from '../lib/seo'


const DESCRIPTION =
  'Kebijakan privasi properti1.com: data yang kami simpan, nomor WhatsApp yang ditampilkan ke publik, penggunaan penyimpanan lokal untuk favorit, dan hak Anda.'

const sections = [
  {
    title: '1. Data yang kami simpan',
    body: [
      'Saat Anda memasang iklan, kami menyimpan judul, harga, tipe dan status properti, kota, kecamatan, spesifikasi, deskripsi, foto, nama agen, dan nomor WhatsApp.',
      'Alamat lengkap properti bersifat privat. Hanya Anda sebagai pemasang iklan yang dapat melihatnya.',
    ],
  },
  {
    title: '2. Nomor WhatsApp ditampilkan ke publik',
    body: [
      'Nomor WhatsApp yang Anda isi pada formulir iklan ditampilkan pada halaman properti dan dipakai untuk membuat tautan wa.me.',
      'Perlu Anda ketahui: tautan wa.me berisi nomor tujuan, sehingga pembeli dapat melihat nomor tersebut.',
      'Karena itu, gunakan nomor yang memang Anda siapkan untuk dihubungi calon pembeli.',
    ],
  },
  {
    title: '3. Favorit disimpan di perangkat Anda',
    body: [
      'Daftar properti favorit disimpan di penyimpanan lokal (localStorage) peramban Anda, bukan di server kami.',
      'Menghapus data peramban atau membuka situs di perangkat lain akan mengosongkan daftar favorit tersebut.',
    ],
  },
  {
    title: '4. Akun penjual',
    body: [
      'Untuk memasang dan mengelola iklan, penjual membuat akun dengan email dan kata sandi.',
      'Kata sandi dikelola oleh penyedia autentikasi kami (Supabase) dan tidak pernah kami baca dalam bentuk aslinya.',
    ],
  },
  {
    title: '5. Foto properti',
    body: [
      'Foto yang Anda unggah disimpan pada penyimpanan berkas (Supabase Storage) dan dapat diakses publik selama iklan tayang.',
      'Jangan mengunggah foto yang memuat dokumen pribadi, data perbankan, atau informasi sensitif lainnya.',
    ],
  },
  {
    title: '6. Hak Anda',
    body: [
      'Anda dapat mengubah atau menghapus iklan Anda kapan saja melalui halaman Iklan Saya.',
      'Untuk pertanyaan privasi lainnya, hubungi kami di halo@properti1.com.',
    ],
  },
]

export function PrivacyPage() {
  return (
    <>
      <Seo
        title={pageTitle('Kebijakan Privasi')}
        description={DESCRIPTION}
        path="/kebijakan-privasi"
      />
      <LegalPage
        eyebrow="Privasi"
        title="Kebijakan Privasi"
        updatedAt="10 November 2026"
        sections={sections}
      />
    </>
  )
}
