import { Link } from 'react-router-dom'
import { CalendarDays, ChevronRight } from 'lucide-react'

interface LegalSection {
  title: string
  body: string[]
}

interface LegalPageProps {
  /** Small green label above the H1, e.g. "Ketentuan Layanan". */
  eyebrow: string
  title: string
  /** Human readable date, already formatted in Bahasa Indonesia. */
  updatedAt: string
  sections: LegalSection[]
}

/** Shared, static layout for Terms and Privacy (DESIGN.md section 5). */
export function LegalPage({ eyebrow, title, updatedAt, sections }: LegalPageProps) {
  return (
    <section className="container-page max-w-3xl py-10 sm:py-12">
      <nav className="flex items-center gap-1.5 overflow-hidden text-xs font-medium text-text-grey sm:text-sm" aria-label="Navigasi remah roti">
        <Link to="/" className="shrink-0 hover:text-primary-600">Beranda</Link>
        <ChevronRight size={14} className="shrink-0" aria-hidden="true" />
        <span className="truncate text-text-dark">{title}</span>
      </nav>

      <p className="mt-6 text-sm font-bold text-primary-600">{eyebrow}</p>
      <h1 className="mt-1 text-2xl font-extrabold text-navy sm:text-3xl">{title}</h1>
      <p className="mt-3 flex items-center gap-2 text-sm text-text-grey">
        <CalendarDays size={16} aria-hidden="true" />
        Terakhir diperbarui: {updatedAt}
      </p>

      <div className="mt-8 space-y-8">
        {sections.map((section) => (
          <article key={section.title}>
            <h2 className="text-lg font-bold text-navy sm:text-xl">{section.title}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph} className="mt-3 text-sm leading-7 text-text-grey">
                {paragraph}
              </p>
            ))}
          </article>
        ))}
      </div>
    </section>
  )
}
