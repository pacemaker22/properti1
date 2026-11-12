import { useEffect, useRef, useState } from 'react'
import { AlertCircle, CheckCircle2, Flag, X } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { useNotices } from '../lib/notices'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { ReportReason } from '../types/database'

/**
 * Each form option carries the exact reason code the reports table accepts
 * (CHECK constraint in 20261113000000_admin_security.sql; ReportReason in
 * src/types/database.ts). The label is Bahasa Indonesia, the value is the DB code.
 */
const REASONS: ReadonlyArray<{ label: string; value: ReportReason }> = [
  { label: 'Properti sudah terjual atau tidak tersedia', value: 'sudah_terjual' },
  { label: 'Harga tidak sesuai atau menyesatkan', value: 'data_palsu' },
  { label: 'Dokumen / sertifikat tidak jelas', value: 'data_palsu' },
  { label: 'Dugaan penipuan atau agen tidak bisa dihubungi', value: 'lainnya' },
  { label: 'Foto tidak sesuai dengan properti sebenarnya', value: 'foto_meniru' },
  { label: 'Iklan duplikat atau spam', value: 'spam' },
  { label: 'Lainnya', value: 'lainnya' },
]

export const REPORT_LOGIN_PROMPT = 'Login untuk melaporkan iklan'
const REPORT_TABLE = 'reports'
const REPORT_SUCCESS_MESSAGE =
  'Laporan terkirim. Tim properti1.com akan meninjau iklan ini.'
const REPORT_FAILED_MESSAGE = 'Gagal mengirim laporan. Silakan coba lagi.'

/**
 * Insert one row into reports for the signed-in reporter. RLS pins reporter_id to
 * auth.uid(); the visitor is asked to log in before this is ever called.
 */
const submitPropertyReport = async (
  propertyId: string,
  reason: ReportReason,
  reasonNote: string,
) => {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) return { error: null, success: false }

  const { error: writeError } = await supabase.from(REPORT_TABLE).insert({
    property_id: propertyId,
    reporter_id: session.user.id,
    reporter_email: session.user.email ?? '',
    reason,
    reason_note: reasonNote,
  })

  if (writeError) return { error: writeError, success: false }
  return { error: null, success: true }
}

interface ReportModalProps {
  propertyId: string
  title: string
  url: string
  onClose: () => void
}

export function ReportModal({ propertyId, title, url, onClose }: ReportModalProps) {
  const { user } = useAuth()
  const { requireLogin, toFriendlyMessage, notify, notifyError } = useNotices()
  const [reason, setReason] = useState<ReportReason | ''>('')
  const [details, setDetails] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)

  const closeTimer = useRef(0)

  useEffect(() => {
    closeRef.current?.focus()

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKey)
    return () => {
      window.removeEventListener('keydown', handleKey)
      window.clearTimeout(closeTimer.current)
    }
  }, [onClose])

  const submit = async () => {
    if (submitting) return

    if (!reason) {
      setError('Pilih alasan laporan terlebih dahulu.')
      return
    }

    setError('')

    // Guests: open the login modal and stop here. Nothing is inserted and no
    // external chat window is opened - only signed-in buyers can report (Q4).
    if (!requireLogin(REPORT_LOGIN_PROMPT)) return

    if (!isSupabaseConfigured) {
      notifyError('Layanan laporan belum tersedia. Silakan coba lagi nanti.')
      return
    }

    if (!user) {
      notifyError('Masuk terlebih dahulu untuk mengirim laporan.')
      return
    }

    setSubmitting(true)

    try {
      const result = await submitPropertyReport(propertyId, reason, details.trim())

      if (!result.success) {
        if (result.error) {
          setError(toFriendlyMessage(result.error, REPORT_FAILED_MESSAGE))
        } else {
          setError(REPORT_FAILED_MESSAGE)
        }
        return
      }

      setSuccess(REPORT_SUCCESS_MESSAGE)
      notify(REPORT_SUCCESS_MESSAGE)
      closeTimer.current = window.setTimeout(onClose, 1600)
    } catch (caughtError) {
      setError(toFriendlyMessage(caughtError, REPORT_FAILED_MESSAGE))
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
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
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-500/10 text-primary-600">
              <CheckCircle2 size={20} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="report-modal-title" className="text-lg font-bold text-navy">
                Laporan terkirim
              </h2>
              <p className="mt-1 text-sm leading-6 text-text-grey" role="status">
                {success}
              </p>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-bold text-navy transition hover:border-slate-300"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    )
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
          Iklan palsu membuat pembeli kecewa. Laporan Anda akan kami tinjau secara manual oleh tim properti1.com.
        </p>

        <fieldset className="mt-5">
          <legend className="field-label">Alasan laporan</legend>
          <div className="space-y-2">
            {REASONS.map((item) => (
              <label
                key={item.label}
                className={
                  'flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-sm transition ' +
                  (reason === item.value
                    ? 'border-primary-500 bg-primary-500/5 font-semibold text-navy'
                    : 'border-slate-200 text-text-dark hover:border-slate-300')
                }
              >
                <input
                  type="radio"
                  name="report-reason"
                  value={item.value}
                  checked={reason === item.value}
                  onChange={() => setReason(item.value)}
                  className="h-4 w-4 shrink-0 accent-primary-500"
                />
                <span>{item.label}</span>
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
          <p
            className="mt-3 flex items-center gap-2 text-xs font-semibold text-error-red"
            role="alert"
          >
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
            disabled={submitting || !isSupabaseConfigured}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-error-red px-4 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Flag size={16} aria-hidden="true" />
            {submitting ? 'Mengirim...' : 'Kirim Laporan'}
          </button>
        </div>
      </div>
    </div>
  )
}

