import { Link } from 'react-router-dom'
import { Building2, Heart, Mail, MessageCircle } from 'lucide-react'
import { getPlatformWhatsAppUrl, LISTING_ENQUIRY_MESSAGE, PLATFORM_WHATSAPP } from '../lib/contact'

const platformWhatsAppUrl = getPlatformWhatsAppUrl(LISTING_ENQUIRY_MESSAGE)

export function Footer() {
  return (
    <footer className="mt-16 bg-navy text-slate-300">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <Link to="/" className="flex items-center gap-2 text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500">
              <Building2 size={19} aria-hidden="true" />
            </span>
            <span className="text-lg font-extrabold">
              properti<span className="text-primary-500">1</span>.com
            </span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-6 text-slate-400">
            Platform pencarian properti tepercaya untuk membantu Anda menemukan rumah, apartemen, tanah, dan ruko di
            seluruh Indonesia. Hubungi penjual langsung lewat WhatsApp.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">Link Cepat</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <Link to="/" className="transition hover:text-primary-500">
                Cari Rumah
              </Link>
            </li>
            <li>
              <Link to="/tambah-iklan" className="transition hover:text-primary-500">
                Pasang Iklan Gratis
              </Link>
            </li>
            <li>
              <Link to="/favorit" className="inline-flex items-center gap-1.5 transition hover:text-primary-500">
                <Heart size={15} className="text-heart-active" aria-hidden="true" /> Favorit Saya
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">Hubungi Kami</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <a href="mailto:halo@properti1.com" className="inline-flex items-center gap-2 transition hover:text-primary-500">
                <Mail size={16} aria-hidden="true" /> halo@properti1.com
              </a>
            </li>
            <li>
              <a href={platformWhatsAppUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 transition hover:text-primary-500">
                <MessageCircle size={16} aria-hidden="true" /> WhatsApp {PLATFORM_WHATSAPP}
              </a>
            </li>
            <li className="text-slate-400">Senin–Sabtu, 08.00–18.00 WIB</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-5">
        <div className="container-page text-xs text-slate-500">
          <p>© 2026 properti1.com. Seluruh hak dilindungi.</p>
        </div>
      </div>
    </footer>
  )
}
