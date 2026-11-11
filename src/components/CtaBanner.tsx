import { Link } from 'react-router-dom'
import { ArrowRight, Clock } from 'lucide-react'

export function CtaBanner() {
  return (
    <section className="container-page py-10 sm:py-12">
      <div className="flex flex-col items-start justify-between gap-5 rounded-2xl bg-navy p-6 sm:p-8 lg:flex-row lg:items-center">
        <div>
          <h2 className="text-xl font-bold text-white sm:text-2xl">Punya Rumah Mau Dijual?</h2>
          <p className="mt-2 flex items-center gap-2 text-sm text-slate-300">
            <Clock size={16} className="text-primary-500" aria-hidden="true" />
            Pasang Iklan Gratis - 3 Menit
          </p>
        </div>
        <Link
          to="/tambah-iklan"
          className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary-500 px-5 text-sm font-bold text-white transition hover:bg-primary-600"
        >
          Pasang Iklan Gratis <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </div>
    </section>
  )
}
