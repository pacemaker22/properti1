import type { LucideIcon } from 'lucide-react'
import { AlertCircle, RotateCcw } from 'lucide-react'

/**
 * The one failure panel for the admin tabs (pending moderation, buyer reports,
 * all listings).
 *
 * Mirrors DESIGN.md section 6 "Empty State" (centered, icon, title, body,
 * action, 12px radius) but in Error Red. Copy rules from section 11 are the
 * caller's job: `message` is the sentence already mapped through
 * useNotices().toFriendlyMessage, so raw Postgres/RLS text never lands here.
 */
interface AdminErrorProps {
  /** Friendly Indonesian sentence, already mapped via toFriendlyMessage(). */
  message: string
  /** Re-runs the failed query. Omit to render the panel without an action. */
  onRetry?: () => void
  /** Overrides the heading when the failure is about something else. */
  title?: string
  /** Button label; defaults to "Coba Lagi". */
  retryLabel?: string
  icon?: LucideIcon
  /** Extra wrapper classes so a tab can keep its own vertical rhythm. */
  className?: string
}

export function AdminError({
  message,
  onRetry,
  title = 'Gagal memuat data',
  retryLabel = 'Coba Lagi',
  icon: Icon = AlertCircle,
  className = '',
}: AdminErrorProps) {
  return (
    <div
      className={
        'mt-7 mx-auto flex w-full max-w-md flex-col items-center rounded-2xl border border-error-red/30 bg-white px-5 py-8 text-center shadow-card ' +
        className
      }
      role="alert"
    >
      <span
        className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-error-red"
        aria-hidden="true"
      >
        <Icon size={30} />
      </span>

      <h2 className="mt-5 text-lg font-bold text-navy">{title}</h2>

      <p className="mt-2 text-sm leading-6 text-text-grey">{message}</p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary-500 px-5 text-sm font-bold text-white transition hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
        >
          <RotateCcw size={17} aria-hidden="true" />
          {retryLabel}
        </button>
      )}
    </div>
  )
}
