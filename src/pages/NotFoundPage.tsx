import { Link } from 'react-router-dom'
import { Home, SearchX } from 'lucide-react'
import { Seo } from '../components/Seo'
import { pageTitle } from '../lib/seo'

export function NotFoundPage() {
  return (
    <section className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <Seo title={pageTitle('Halaman Tidak Ditemukan')} description="Halaman properti yang Anda cari tidak tersedia di properti1.com." path="/404" noIndex />
      <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 text-text-grey"><SearchX size={36} /></span>
      <p className="mt-6 text-sm font-extrabold uppercase tracking-[0.2em] text-primary-600">Halaman Tidak Ditemukan</p>
      <h1 className="mt-2 text-3xl font-extrabold text-navy sm:text-4xl">Properti yang Anda cari tidak tersedia</h1>
      <p className="mt-3 max-w-md text-slate-500">Halaman mungkin telah dipindahkan atau alamat yang dimasukkan tidak tepat.</p>
      <Link to="/" className="mt-7 inline-flex h-12 items-center gap-2 rounded-xl bg-primary-500 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-primary-600">
        <Home size={18} /> Kembali ke Beranda
      </Link>
    </section>
  )
}
