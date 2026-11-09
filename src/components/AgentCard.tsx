import { MessageCircle, Phone, ShieldCheck } from 'lucide-react'
import { getPhoneUrl, getWhatsAppUrl } from '../lib/contact'
import type { Property } from '../types/property'
import { AgentAvatar } from './AgentAvatar'

interface AgentCardProps {
  property: Property
}

export function AgentCard({ property }: AgentCardProps) {
  const whatsappUrl = getWhatsAppUrl(property)

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-wide text-text-grey">Informasi Agen</p>
      <div className="mt-3 flex items-center gap-4">
        <AgentAvatar property={property} />
        <div className="min-w-0">
          <p className="font-bold text-navy">{property.agent_name}</p>
          <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-text-grey">
            <ShieldCheck size={13} aria-hidden="true" /> Agen Terverifikasi
          </span>
        </div>
      </div>

      {property.status === 'terjual' ? (
        <p className="mt-5 rounded-xl bg-slate-100 px-4 py-3 text-center text-sm font-bold text-text-grey">
          Properti ini telah terjual
        </p>
      ) : (
        <div className="mt-5 space-y-2.5">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={`Hubungi ${property.agent_name} melalui WhatsApp`}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary-500 text-sm font-bold text-white transition hover:bg-primary-600"
          >
            <MessageCircle size={19} aria-hidden="true" /> Chat WhatsApp
          </a>
          <a
            href={getPhoneUrl(property)}
            aria-label={`Telepon ${property.agent_name}`}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-navy transition hover:border-primary-500 hover:text-primary-600"
          >
            <Phone size={18} aria-hidden="true" /> Telepon Agen
          </a>
        </div>
      )}
    </div>
  )
}
