import { useEffect, useRef, useState } from 'react'
import { AlertCircle, Flag, X } from 'lucide-react'
import { getPlatformWhatsAppUrl } from '../lib/contact'

const REASONS = [
  'Properti sudah terjual atau tidak tersedia',
  'Harga tidak sesuai atau menyesatkan',
  'Dokumen / sertifikat tidak jelas',
  'Dugaan penipuan atau agen tidak bisa dihubungi',
  'Foto tidak sesuai dengan properti sebenarnya',
  'Iklan duplikat atau spam',
  'Lainnya',
]

interface ReportModalProps {
  propertyId: string
  title: string
  url: string
  onClose: () => void
}

export function ReportModal({ propertyId, title, url, onClose }: ReportModalProps) {
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [error, setError] = useState('')
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const submit = () => {
    if (!reason) {
      setError('Pilih alasan laporan terlebih dahulu.')
      return
    }

    setError('')

    const lines = [
      'Halo admin properti1.com, saya ingin melaporkan iklan berikut:',
      '',
      'Judul: ' + title,
      'ID Iklan: ' + propertyId,
      'Tautan: ' + url,
      'Alasan: ' + reason,
    ]

    if (details.trim()) {
      lines.push('Detail: ' + details.trim())
    }

    window.open(getPlatformWhatsAppUrl(lines.join('\n')), '_blank', 'noopener,noreferrer')
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/55 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-error-red">
            <Flag size={20} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="report-modal-title" className="text-lg font-bold text-navy">
              Laporkan iklan
            </h2>
            <p className="mt-0.5 truncate text-sm text-text-grey" title={title}>
              {title}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Tutup formulir laporan"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-text-grey transition hover:bg-slate-200"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <p className="mt-4 rounded-xl bg-page-bg px-3 py-2.5 text-xs leading-5 text-text-grey">
          Iklan palsu membuat pembeli kecewa. Laporan Anda akan kami tinjau secara manual lewat WhatsApp.
        </p>

        <fieldset className="mt-5">
          <legend className="field-label">Alasan laporan</legend>
          <div className="space-y-2">
            {REASONS.map((itemLink) => (
              <label
                key={itemLink}
                className={
                  'flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-sm transition ' +
                  (reason === itemLink
                    ? 'border-primary-500 bg-primary-500/5 font-semibold text-navy'
                    : 'border-slate-200 text-text-dark hover:border-slate-300')
                }
              >
                <input
                  type="radio"
                  name="report-reason"
                  value={itemLink}
                  checked={reason === itemLink}
                  onChange={() => setReason(itemLink)}
                  className="h-4 w-4 shrink-0 accent-primary-500"
                />
                <span>{itemLink}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-4">
          <label htmlFor="report-details" className="field-label">
            Detail tambahan <span className="font-normal text-text-grey">(opsional)</span>
          </label>
          <textarea
            id="report-details"
            rows={3}
            maxLength={500}
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            placeholder="Ceritakan apa yang Anda temukan, misalnya nomor tidak aktif atau foto milik iklan lain."
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-text-dark outline-none transition placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          />
          <p className="mt-1 text-right text-[11px] text-slate-400">{details.length}/500</p>
        </div>

        {error && (
          <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-error-red" role="alert">
            <AlertCircle size={14} aria-hidden="true" />
            {error}
          </p>
        )}

        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-bold text-navy transition hover:border-slate-300"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={submit}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-error-red px-4 text-sm font-bold text-white transition hover:opacity-90"
          >
            <Flag size={16} aria-hidden="true" />
            Kirim Laporan
          </button>
        </div>
      </div>
    </div>
  )
}
