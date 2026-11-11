import { useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react'
import { Copy, Link2, MessageCircle, Share2, X } from 'lucide-react'
import { propertyShareUrl, propertyWhatsAppShareUrl } from '../lib/share'
import type { Property } from '../types/property'
/** Clipboard API needs a secure context; execCommand is the localhost/older fallback. */
const copyToClipboard = async (value: string): Promise<boolean> => {
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    const done = await navigator.clipboard
      .writeText(value)
      .then(() => true)
      .catch(() => false)
    if (done) return true
  }

  const field = document.createElement('textarea')
  field.value = value
  field.setAttribute('readonly', '')
  field.style.position = 'fixed'
  field.style.opacity = '0'
  document.body.appendChild(field)
  field.select()

  let result = false
  try {
    result = document.execCommand('copy')
  } catch (err) {
    result = false
  }
  field.remove()

  return result
}



interface ShareButtonProps {
  property: Property
  className?: string
}

type IconComponent = ComponentType<{ size?: number | string; 'aria-hidden'?: boolean | 'true' | 'false' }>

interface ShareTileProps {
  icon: IconComponent
  label: string
  href?: string
  onClick?: () => void
}

const TILE_CLASS =
  'inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border ' +
  'border-slate-200 px-3 text-navy transition hover:border-primary-500 hover:text-primary-600'

/** Trigger styling matching the other h-11 action buttons in the detail header. */
const TRIGGER_CLASS =
  'inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 ' +
  'text-sm font-bold text-navy transition hover:border-primary-500 hover:text-primary-600 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2'

function ShareTile({ icon: Icon, label, href, onClick }: ShareTileProps) {
  const inner: ReactNode = (
    <>
      <Icon size={18} aria-hidden="true" />
      <span className="text-xs font-semibold">{label}</span>
    </>
  )

  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={TILE_CLASS}>
        {inner}
      </a>
    )
  }

  return (
    <button type="button" onClick={onClick} className={TILE_CLASS}>
      {inner}
    </button>
  )
}

interface SharePanelProps extends ShareButtonProps {
  onClose: () => void
}

export function SharePanel({ property, onClose }: SharePanelProps) {
  const [copied, setCopied] = useState(false)
  const timer = useRef(0)
  const titleId = 'share-panel-title'

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKey)

    return () => {
      window.removeEventListener('keydown', handleKey)
      window.clearTimeout(timer.current)
    }
  }, [onClose])

  const copy = async () => {
    const ok = await copyToClipboard(propertyShareUrl(property.id))
    setCopied(ok)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/55 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby={titleId} onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="text-lg font-bold text-navy">Bagikan properti</h2>
            <p className="mt-1 line-clamp-2 text-sm text-text-grey">{property.title}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Tutup bagikan" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-text-grey transition hover:bg-slate-200">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <ShareTile icon={MessageCircle} label="WhatsApp" href={propertyWhatsAppShareUrl(property)} />
          <ShareTile icon={Copy} label={copied ? 'Tersalin' : 'Salin tautan'} onClick={() => void copy()} />
        </div>

        <p className="mt-4 truncate rounded-xl bg-page-bg px-3 py-2 text-xs text-text-grey" title={propertyShareUrl(property.id)}>
          <Link2 size={14} className="mr-1 inline align-[-2px]" aria-hidden="true" />
          {propertyShareUrl(property.id)}
        </p>
      </div>
    </div>
  )
}

/**
 * "Bagikan" trigger for the detail page.
 *
 * Uses the native share sheet when the device has one (Android Chrome, Safari,
 * Edge). Otherwise opens the SharePanel below, which offers WhatsApp + copy
 * link -- always reachable, unlike clipboard-only, which fails on http://
 * LAN previews.
 */
export function ShareButton({ property, className = '' }: ShareButtonProps) {
  const [panelOpen, setPanelOpen] = useState(false)
  const triggerClass = TRIGGER_CLASS + ' ' + className

  return (
    <>
      <button
        type="button"
        onClick={() => setPanelOpen(true)}
        aria-label="Bagikan properti ini"
        aria-haspopup="dialog"
        aria-expanded={panelOpen}
        className={triggerClass}
      >
        <Share2 size={17} aria-hidden="true" />
        <span className="hidden sm:inline">Bagikan</span>
      </button>

      {panelOpen && (
        <SharePanel property={property} onClose={() => setPanelOpen(false)} />
      )}
    </>
  )
}



