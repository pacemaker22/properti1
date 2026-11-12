import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { AlertCircle, CheckCircle2, LogIn, X } from 'lucide-react'
import { useAuth } from './auth'

/**
 * One place for the "you must be signed in" prompt and for every database error a
 * buyer can trigger from a heart or a report.
 *
 * Copy rules (DESIGN.md section 11): Bahasa Indonesia only, no raw Postgres text
 * in the UI. SQLSTATE 42501 / "permission denied" / RLS violations are security
 * policy talking, not something a buyer can act on, so they are mapped to a
 * friendly sentence here and never rendered as-is.
 */
type NoticeTone = 'info' | 'error' | 'success'

interface Notice {
  id: number
  tone: NoticeTone
  message: string
}

interface NoticesContextValue {
  /**
   * Ask the buyer to log in. Returns true when there is a session; otherwise the
   * prompt is shown, the auth modal opens and nothing is sent to the database
   * (no anonymous insert - Q4/Q5).
   */
  requireLogin: (message: string) => boolean
  /** Friendly Indonesian text for any Supabase error (42501 included). */
  toFriendlyMessage: (error: unknown, fallback: string) => string
  notify: (message: string) => void
  notifyError: (message: string) => void
}

const NoticesContext = createContext<NoticesContextValue | null>(null)
const rawMessage = (error: unknown): string => {
  if (!error || typeof error !== 'object') return ''
  const candidate = error as { message?: unknown; details?: unknown }
  return [candidate.message, candidate.details]
    .filter((part): part is string => typeof part === 'string' && part.length > 0)
    .join(' ')
}

/** 42501 is Postgres "insufficient_privilege" - raised by ACLs and RLS alike. */
const isPermissionError = (error: unknown, text: string): boolean => {
  const code =
    error && typeof error === 'object' ? (error as { code?: unknown }).code : undefined
  if (code === '42501') return true

  const lowered = text.toLowerCase()
  return (
    lowered.includes('permission denied') ||
    lowered.includes('row-level security') ||
    lowered.includes('row level security') ||
    lowered.includes('insufficient privilege')
  )
}

const constraintMessages: Array<[RegExp, string]> = [
  [
    /favorites_user_property_key|duplicate key.*favorites/i,
    'Properti ini sudah ada di daftar favorit Anda.',
  ],
  [
    /reports_unique_report_idx|duplicate key.*reports/i,
    'Anda sudah melaporkan iklan ini dengan alasan yang sama.',
  ],
  [
    /violates foreign key|property_id.*does not exist/i,
    'Iklan ini sudah tidak tersedia sehingga laporan tidak dapat dikirim.',
  ],
  [
    /invalid input (value|syntax).*reason|reason.*check/i,
    'Alasan laporan tidak dikenali. Silakan pilih salah satu alasan yang tersedia.',
  ],
  [
    /value too long|character varying|reason_note/i,
    'Laporan Anda terlalu panjang. Silakan ringkas terlebih dahulu.',
  ],
]

/** SQL noise a buyer can never use: schema names, PostgREST codes, hints. */
const SQL_NOISE = /ERROR:|PGRST|relation "|schema|detail|hint|deadlock|timeout/i

/**
 * Map any Supabase error to one Indonesian sentence. `fallback` is the message we
 * wrote ourselves for that action; when the database speaks (42501) the friendly
 * "not allowed" line is returned instead of the raw English Postgres text.
 */
const translate = (error: unknown, fallback: string): string => {
  const text = rawMessage(error)
  if (!text) return fallback

  if (isPermissionError(error, text)) {
    const action = fallback.toLowerCase().includes('simpan')
      ? 'menyimpan favorit'
      : fallback.toLowerCase().includes('lapor')
        ? 'mengirim laporan'
        : 'tindakan ini'
    return 'Akun Anda belum memiliki izin untuk ' + action + '. Silakan masuk kembali lalu coba lagi.'
  }

  for (const [pattern, friendly] of constraintMessages) {
    if (pattern.test(text)) return friendly
  }

  if (/fetch|network|offline|connection|econn|timeout/i.test(text)) {
    return 'Koneksi bermasalah. Periksa internet Anda lalu coba lagi.'
  }

  // A sentence we wrote ourselves is already safe to read; anything else carries
  // SQL noise the buyer cannot use.
  if (SQL_NOISE.test(text)) return fallback
  return text
}

export function NoticesProvider({ children }: { children: ReactNode }) {
  const { user, openAuthModal } = useAuth()
  const [notice, setNotice] = useState<Notice | null>(null)
  const timer = useRef(0)
  const sequence = useRef(0)

  const show = useCallback((tone: NoticeTone, message: string) => {
    window.clearTimeout(timer.current)
    sequence.current += 1
    setNotice({ id: sequence.current, tone, message })
    timer.current = window.setTimeout(() => setNotice(null), tone === 'info' ? 7000 : 6000)
  }, [])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const notify = useCallback((message: string) => show('success', message), [show])
  const notifyError = useCallback((message: string) => show('error', message), [show])

  const toFriendlyMessage = useCallback(
    (error: unknown, fallback: string) => translate(error, fallback),
    [],
  )

  const requireLogin = useCallback(
    (message: string) => {
      if (user) {
        window.clearTimeout(timer.current)
        setNotice(null)
        return true
      }
      show('info', message)
      openAuthModal('login')
      return false
    },
    [user, show, openAuthModal],
  )

  const value = useMemo<NoticesContextValue>(
    () => ({ requireLogin, toFriendlyMessage, notify, notifyError }),
    [requireLogin, toFriendlyMessage, notify, notifyError],
  )

  const close = () => {
    window.clearTimeout(timer.current)
    setNotice(null)
  }

  const toneClass = {
    info: 'bg-primary-500/10 text-primary-600',
    error: 'bg-red-50 text-error-red',
    success: 'bg-primary-500/10 text-success-green',
  }

  return (
    <NoticesContext.Provider value={value}>
      {children}

      <div
        className="pointer-events-none fixed inset-x-0 z-[95] flex justify-center px-4"
        style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
      >
        <div
          className="w-full max-w-sm"
          role={notice?.tone === 'error' ? 'alert' : 'status'}
          aria-live={notice?.tone === 'error' ? 'assertive' : 'polite'}
          aria-atomic="true"
        >
          {notice && (
            <div
              key={notice.id}
              className={
                'pointer-events-auto flex items-start gap-3 rounded-2xl border bg-white p-4 shadow-2xl ' +
                (notice.tone === 'error' ? 'border-error-red/30' : 'border-slate-200')
              }
            >
              <span
                className={
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ' +
                  toneClass[notice.tone]
                }
              >
                {notice.tone === 'error' ? (
                  <AlertCircle size={18} aria-hidden="true" />
                ) : notice.tone === 'success' ? (
                  <CheckCircle2 size={18} aria-hidden="true" />
                ) : (
                  <LogIn size={18} aria-hidden="true" />
                )}
              </span>

              <p className="min-w-0 flex-1 text-sm font-semibold leading-6 text-navy">
                {notice.message}
              </p>

              {notice.tone !== 'success' && (
                <button
                  type="button"
                  onClick={close}
                  aria-label="Tutup pemberitahuan"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-text-grey transition hover:bg-slate-200"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </NoticesContext.Provider>
  )
}

export function useNotices() {
  const context = useContext(NoticesContext)
  if (!context) throw new Error('useNotices must be used inside NoticesProvider')
  return context
}


