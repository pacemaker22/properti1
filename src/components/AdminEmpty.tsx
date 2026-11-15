import type { LucideIcon } from 'lucide-react'
import { Home } from 'lucide-react'

/**
 * The "nothing here" panel for the admin tabs (no pending listing, no open
 * report, empty search result).
 *
 * Follows DESIGN.md section 6 "Empty State": centered, a Lucide icon instead of
 * emoji (section 7 keeps icons as Lucide in UI), navy title, grey subtitle and an
 * optional action. The subtitle is a prop so each tab can explain what will
 * appear here (section 11: Bahasa Indonesia only, real copy - no lorem ipsum).
 */
interface AdminEmptyProps {
  /** Headline, e.g. "Tidak ada listing yang menunggu". */
  title: string
  /** One sentence telling the admin what will show up in this tab. */
  body: string
  icon?: LucideIcon
  /** Optional action label. Rendered only when onAction is provided. */
  actionLabel?: string
  /** Optional action handler, e.g. "Reset Filter" or "Muat Ulang". */
  onAction?: () => void
  /** Extra wrapper classes so a tab can keep its own vertical rhythm. */
  className?: string
}

export function AdminEmpty({
  title,
  body,
  icon: Icon = Home,
  actionLabel,
  onAction,
  className = '',
}: AdminEmptyProps) {
  return (
    <div
      className={
        'mt-7 mx-auto flex w-full max-w-md flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-page-bg px-5 py-8 text-center ' +
        className
      }
      role="status"
    >
      <span
        className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-text-grey"
        aria-hidden="true"
      >
        <Icon size={30} />
      </span>

      <h2 className="mt-5 text-lg font-bold text-navy">{title}</h2>

      <p className="mt-2 text-sm leading-6 text-text-grey">{body}</p>

      {onAction && actionLabel && (
        <button
          type="button"
          onClick={onAction}
          className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary-500 px-5 text-sm font-bold text-white transition hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
