import { LegalPage } from '../components/LegalPage'
import { Seo } from '../components/Seo'
import { pageTitle } from '../lib/seo'

const DESCRIPTION =
  'Ketentuan penggunaan properti1.com untuk pembeli dan penjual properti: peran platform, tanggung jawab pemasang iklan, dan penanganan iklan palsu.'

const sections = [
  {
    title: '1. Tentang layanan ini',
    body: [
      'properti1.com adalah platform yang mempertemukan penjual properti dengan calon pembeli. Kami tidak menjadi perantara transaksi, tidak memungut komisi, dan tidak menerima pembayaran atas nama penjual.',
    ],
  },
  {
    title: '2. Iklan milik pemasang',
    body: [
      'Pemasang iklan menyatakan bahwa data yang diunggah adalah data yang benar, termasuk harga, luas bangunan dan luas tanah, sertifikat, serta nomor WhatsApp.',
      'Pemasang iklan wajib memberi tahu pembeli apabila properti sudah terjual, dengan menandai iklan sebagai Terjual.',
    ],
  },
  {
    title: '3. Iklan yang dilarang',
    body: [
      'Kami dapat menghapus iklan tanpa pemberitahuan sebelumnya jika berisi informasi palsu, menyesatkan, atau menjual barang yang bukan properti.',
      'Iklan yang melanggar hukum, mengandung ujaran kebencian, atau menampilkan konten yang tidak pantas juga akan dihapus.',
    ],
  },
  {
    title: '4. Lokasi bersifat perkiraan',
    body: [
      'Alamat lengkap properti tidak ditampilkan kepada publik. Halaman properti hanya menampilkan kecamatan dan kota.',
      'Silakan minta alamat lengkap langsung kepada pemasang iklan melalui WhatsApp sebelum melakukan kunjungan.',
    ],
  },
  {
    title: '5. Transaksi di luar platform',
    body: [
      'Semua negosiasi dan pembayaran dilakukan langsung antara pembeli dan penjual. properti1.com tidak bertanggung jawab atas kerugian yang timbul dari transaksi tersebut.',
      'Kami menyarankan Anda memeriksa dokumen asli properti dan menggunakan jasa notaris sebelum melakukan pembayaran.',
    ],
  },
  {
    title: '6. Melaporkan iklan palsu',
    body: [
      'Gunakan tombol "Laporkan Iklan" di halaman properti untuk melaporkan iklan yang mencurigakan. Laporan akan kami tinjau secara manual.',
    ],
  },
  {
    title: '7. Perubahan ketentuan',
    body: [
      'Ketentuan ini dapat berubah seiring pengembangan layanan. Versi terbaru selalu tersedia di halaman ini.',
    ],
  },
]

export function TermsPage() {
  return (
    <>
      <Seo
        title={pageTitle('Syarat & Ketentuan')}
        description={DESCRIPTION}
        path="/syarat-ketentuan"
      />
      <LegalPage
        eyebrow="Ketentuan Layanan"
        title="Syarat & Ketentuan"
        updatedAt="10 November 2026"
        sections={sections}
      />
    </>
  )
}
