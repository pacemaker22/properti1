/**
 * Admin panel (/admin) - Step 4.
 *
 * Access gate: guests get the auth modal in login mode and stop; a signed-in
 * user is checked against profiles.is_admin - false sends him back to / with a
 * toast, true shows the panel. Three tabs: the moderation queue
 * (Listing Menunggu), the buyer reports inbox (Laporan) and a read-only
 * listing browser (Semua Listing).
 *
 * Every read/write runs as the signed-in admin through the RLS policies of
 * 20261113000000_admin_security.sql - no service_role key reaches the browser.
 * All user-facing text is Bahasa Indonesia; database errors are mapped through
 * useNotices().toFriendlyMessage so raw Postgres text never renders.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  ClipboardList,
  Flag,
  Home,
  Inbox,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  X,
} from 'lucide-react'
import { Seo } from '../components/Seo'
import { AdminEmpty } from '../components/AdminEmpty'
import { AdminError } from '../components/AdminError'
import { PropertyImage } from '../components/PropertyImage'
import { ListingRowSkeleton } from '../components/ListingCardSkeleton'
import { useAuth } from '../lib/auth'
import { useNotices } from '../lib/notices'
import { isSupabaseConfigured } from '../lib/supabase'
import { formatDate, formatRupiah } from '../lib/format'
import { pageTitle } from '../lib/seo'
import {
  fetchAllListings,
  fetchIsAdmin,
  fetchOpenReports,
  fetchPendingListings,
  fetchSellerEmails,
  moderateListing,
  resolveReport,
  type AdminPropertyRow,
  type AdminReportRow,
} from '../lib/admin'
import type { ModerationAction } from '../types/database'

const ADMIN_TITLE = 'Admin'
const ADMIN_DESCRIPTION = 'Kelola moderasi listing dan laporan pembeli di properti1.com.'
const ACCESS_DENIED_TOAST = 'Akses ditolak, hanya admin'
const SELF_MODERATION_MESSAGE = 'Tidak bisa moderasi listing sendiri'
const NOTE_REQUIRED_MESSAGE = 'Catatan wajib diisi saat menolak listing.'
const APPROVED_TOAST = 'Listing disetujui'
const REJECTED_TOAST = 'Listing ditolak'
const FINISHED_TOAST = 'Laporan ditandai selesai'
const IGNORED_TOAST = 'Laporan diabaikan'

type TabId = 'pending' | 'reports' | 'all'
type AccessState = 'checking' | 'failed' | 'granted' | 'denied'

interface Tab {
  id: TabId
  label: string
  icon: typeof Inbox
}

const TABS: ReadonlyArray<Tab> = [
  { id: 'pending', label: 'Listing Menunggu', icon: Inbox },
  { id: 'reports', label: 'Laporan', icon: Flag },
  { id: 'all', label: 'Semua Listing', icon: ClipboardList },
]

/** Report reasons, keyed by the exact code the reports table accepts. */
const REPORT_REASON_LABELS: Record<string, string> = {
  spam: 'Iklan duplikat / spam',
  foto_meniru: 'Foto tidak sesuai properti',
  data_palsu: 'Harga atau data tidak sesuai',
  sudah_terjual: 'Properti sudah terjual',
  tidak_sesuai_iklan: 'Tidak sesuai iklan',
  lainnya: 'Lainnya',
}

/** admin_status badge used by the listing tabs. */
const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  pending: { label: 'Menunggu', className: 'bg-badge-baru' },
  approved: { label: 'Disetujui', className: 'bg-badge-dijual' },
  rejected: { label: 'Ditolak', className: 'bg-error-red' },
}

export function AdminPage() {
  const { user, authLoading, openAuthModal } = useAuth()
  const { toFriendlyMessage, notifyError } = useNotices()
  const navigate = useNavigate()
  const userId = user?.id ?? null
  const [access, setAccess] = useState<AccessState>('checking')
  const [accessError, setAccessError] = useState('')
  const [tab, setTab] = useState<TabId>('pending')
  // StrictMode runs effects twice in dev; prompt / redirect only once.
  const loginPrompted = useRef(false)
  const deniedHandled = useRef(false)

  // Guests: open the auth modal in login mode and stop. No admin query is sent.
  useEffect(() => {
    if (authLoading || userId || loginPrompted.current) return
    loginPrompted.current = true
    openAuthModal('login')
  }, [authLoading, userId, openAuthModal])

  const loadAccess = useCallback(() => {
    setAccess('checking')
    setAccessError('')
    if (!userId) return

    void fetchIsAdmin(userId)
      .then((isAdmin) => setAccess(isAdmin ? 'granted' : 'denied'))
      .catch((error: unknown) => {
        setAccess('failed')
        setAccessError(
          toFriendlyMessage(error, 'Gagal memeriksa akses admin. Silakan coba lagi.'),
        )
      })
  }, [userId, toFriendlyMessage])

  useEffect(() => {
    if (authLoading) return
    loadAccess()
  }, [authLoading, loadAccess])

  // is_admin = false: show the toast and leave /admin. The toast outlives the
  // navigation because the notice layer sits above the router outlet.
  useEffect(() => {
    if (access !== 'denied' || deniedHandled.current) return
    deniedHandled.current = true
    notifyError(ACCESS_DENIED_TOAST)
    navigate('/', { replace: true })
  }, [access, navigate, notifyError])

  if (!isSupabaseConfigured) {
    return (
      <section className="container-page py-16 text-center">
        <Seo title={pageTitle(ADMIN_TITLE)} description={ADMIN_DESCRIPTION} path="/admin" noIndex />
        <AlertCircle size={36} className="mx-auto text-error-red" aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-bold text-navy">Panel admin belum tersedia</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-text-grey">
          Koneksi database belum dikonfigurasi.
        </p>
      </section>
    )
  }

  // Guests / session still loading: the login modal is (being) opened.
  if (authLoading || !userId) {
    return (
      <section className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
        <Seo title={pageTitle(ADMIN_TITLE)} description={ADMIN_DESCRIPTION} path="/admin" noIndex />
        {authLoading ? (
          <>
            <div className="mx-auto h-12 w-12 animate-pulse rounded-2xl bg-slate-200" />
            <p className="mt-4 text-sm text-text-grey">Memuat akun Anda…</p>
          </>
        ) : (
          <>
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-text-grey">
              <ShieldAlert size={28} aria-hidden="true" />
            </span>
            <h1 className="mt-5 text-2xl font-bold text-navy">Masuk sebagai admin</h1>
            <p className="mt-2 max-w-md text-sm leading-6 text-text-grey">
              Panel admin hanya dapat dibuka setelah Anda masuk dengan akun admin.
            </p>
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-primary-500 px-5 text-sm font-bold text-white transition hover:bg-primary-600"
            >
              <ArrowRight size={17} aria-hidden="true" /> Masuk
            </button>
          </>
        )}
      </section>
    )
  }

  // Verifying the role (or the check itself failed).
  if (access === 'checking' || access === 'failed') {
    return (
      <section
        className="container-page py-16 text-center"
        role={access === 'failed' ? 'alert' : 'status'}
      >
        <Seo title={pageTitle(ADMIN_TITLE)} description={ADMIN_DESCRIPTION} path="/admin" noIndex />
        {access === 'checking' ? (
          <>
            <div className="mx-auto h-12 w-12 animate-pulse rounded-2xl bg-slate-200" />
            <p className="mt-4 text-sm text-text-grey">Memeriksa akses admin…</p>
          </>
        ) : (
          <>
            <AlertCircle size={36} className="mx-auto text-error-red" aria-hidden="true" />
            <h1 className="mt-4 text-2xl font-bold text-navy">Gagal memeriksa akses</h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-text-grey">{accessError}</p>
            <button
              type="button"
              onClick={loadAccess}
              className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-primary-500 px-5 text-sm font-bold text-white transition hover:bg-primary-600"
            >
              <RotateCcw size={17} aria-hidden="true" /> Coba Lagi
            </button>
          </>
        )}
      </section>
    )
  }

  // Non-admin: the redirect to / plus the toast are running.
  if (access === 'denied') return null

  return (
    <section className="container-page py-10 sm:py-12">
      <Seo title={pageTitle(ADMIN_TITLE)} description={ADMIN_DESCRIPTION} path="/admin" noIndex />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold text-primary-600">Panel pengelola</p>
          <h1 className="mt-1 text-2xl font-bold text-navy sm:text-3xl">Admin properti1.com</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-text-grey">
            Setujui listing baru, tindak lanjuti laporan pembeli, dan pantau seluruh iklan.
          </p>
        </div>
        <Link
          to="/"
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-navy transition hover:border-primary-500 hover:text-primary-600"
        >
          <Home size={17} aria-hidden="true" /> Lihat Beranda
        </Link>
      </div>

      <nav
        className="mt-7 flex gap-2 overflow-x-auto no-scrollbar"
        role="tablist"
        aria-label="Menu admin"
      >
        {TABS.map(({ id, label, icon: Icon }) => {
          const selected = tab === id
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setTab(id)}
              className={
                'inline-flex h-11 shrink-0 items-center gap-2 rounded-xl border px-4 text-sm font-bold transition ' +
                (selected
                  ? 'border-primary-500 bg-primary-500 text-white'
                  : 'border-slate-200 bg-white text-navy hover:border-primary-500 hover:text-primary-600')
              }
            >
              <Icon size={17} aria-hidden="true" /> {label}
            </button>
          )
        })}
      </nav>

      {tab === 'pending' && <PendingTab adminId={userId} />}
      {tab === 'reports' && <ReportsTab adminId={userId} />}
      {tab === 'all' && <AllListingsTab />}
    </section>
  )
}

// ---------------------------------------------------------------------
// Tab 1 - Listing Menunggu (moderation queue)
// ---------------------------------------------------------------------

function PendingTab({ adminId }: { adminId: string }) {
  const { toFriendlyMessage, notify, notifyError } = useNotices()
  const [rows, setRows] = useState<AdminPropertyRow[]>([])
  const [emails, setEmails] = useState<Record<string, string>>({})
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [noteErrorId, setNoteErrorId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const pending = await fetchPendingListings()
      setRows(pending)
      const map = await fetchSellerEmails(
        pending.map((row) => row.seller_id).filter((id): id is string => Boolean(id)),
      )
      setEmails(Object.fromEntries(map))
    } catch (error) {
      setLoadError(toFriendlyMessage(error, 'Gagal memuat listing yang menunggu.'))
    } finally {
      setLoading(false)
    }
  }, [toFriendlyMessage])

  useEffect(() => {
    void load()
  }, [load])

  const decide = async (row: AdminPropertyRow, action: ModerationAction) => {
    if (busyId) return

    const note = (notes[row.id] ?? '').trim()
    if (action === 'rejected' && !note) {
      setNoteErrorId(row.id)
      notifyError(NOTE_REQUIRED_MESSAGE)
      return
    }

    setBusyId(row.id)
    try {
      await moderateListing(row.id, adminId, action, note)
      setRows((current) => current.filter((item) => item.id !== row.id))
      notify(action === 'approved' ? APPROVED_TOAST : REJECTED_TOAST)
    } catch (error) {
      notifyError(toFriendlyMessage(error, 'Gagal menyimpan moderasi. Silakan coba lagi.'))
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return <ListingRowSkeleton count={3} className="mt-7" />
  }

  if (loadError) {
    return <AdminError message={loadError} onRetry={() => void load()} />
  }

  if (rows.length === 0) {
    return (
      <AdminEmpty
        icon={ShieldCheck}
        title="Tidak ada listing yang menunggu"
        body="Semua iklan baru sudah ditinjau. Listing baru akan muncul di sini otomatis."
      />
    )
  }

  return (
    <div className="mt-7 space-y-4">
      {rows.map((row) => {
        const isOwn = row.seller_id === adminId
        const busy = busyId === row.id
        const cover = row.photos?.[0] ?? ''
        const noteInvalid = noteErrorId === row.id

        return (
          <article
            key={row.id}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card"
          >
            <div className="grid sm:grid-cols-[220px_1fr]">
              <div className="relative aspect-[4/3] bg-slate-100">
                {cover ? (
                  <PropertyImage
                    src={cover}
                    alt={row.title}
                    widths={[400, 800]}
                    sizes="(min-width: 640px) 220px, 100vw"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-text-grey">
                    <Home size={28} aria-hidden="true" />
                  </div>
                )}
              </div>

              <div className="p-5">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
                  <span className="rounded-full bg-badge-baru px-2.5 py-1 text-white">
                    Menunggu
                  </span>
                  <span className="text-text-grey">Ditambahkan {formatDate(row.created_at)}</span>
                </div>

                <p className="mt-3 text-lg font-bold text-navy">{formatRupiah(row.price)}</p>
                <h2 className="mt-1 text-base font-semibold leading-6 text-text-dark">
                  {row.title}
                </h2>
                <p className="mt-1 text-xs text-text-grey">
                  {row.district}, {row.city}
                </p>
                <p className="mt-1 break-all text-xs text-text-grey">
                  Penjual:{' '}
                  <span className="font-semibold text-text-dark">
                    {row.seller_id
                      ? emails[row.seller_id] ?? 'Email tidak tersedia'
                      : 'Tanpa penjual'}
                  </span>
                </p>

                {isOwn ? (
                  <p
                    className="mt-4 flex items-start gap-2 rounded-xl border border-badge-baru/30 bg-amber-50 px-4 py-3 text-xs font-semibold text-text-dark"
                    role="status"
                  >
                    <ShieldAlert size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
                    {SELF_MODERATION_MESSAGE}
                  </p>
                ) : (
                  <div className="mt-4">
                    <label htmlFor={`catatan-${row.id}`} className="field-label">
                      Catatan{' '}
                      <span className="font-normal text-text-grey">
                        (wajib untuk Tolak, opsional untuk Setujui)
                      </span>
                    </label>
                    <textarea
                      id={`catatan-${row.id}`}
                      rows={2}
                      maxLength={500}
                      value={notes[row.id] ?? ''}
                      onChange={(event) => {
                        setNoteErrorId(null)
                        setNotes((current) => ({ ...current, [row.id]: event.target.value }))
                      }}
                      placeholder="Contoh: foto kurang jelas atau harga tidak wajar"
                      className={
                        'w-full rounded-xl border bg-white px-4 py-3 text-sm text-text-dark outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-primary-500/20 ' +
                        (noteInvalid
                          ? 'border-error-red focus:border-error-red'
                          : 'border-slate-200 focus:border-primary-500')
                      }
                    />
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy || isOwn}
                    onClick={() => void decide(row, 'approved')}
                    className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary-500 px-4 text-sm font-bold text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                  >
                    <Check size={16} aria-hidden="true" /> Setujui
                  </button>
                  <button
                    type="button"
                    disabled={busy || isOwn}
                    onClick={() => void decide(row, 'rejected')}
                    className="inline-flex h-11 items-center gap-2 rounded-xl border border-error-red/40 bg-white px-4 text-sm font-bold text-error-red transition hover:bg-red-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-500"
                  >
                    <X size={16} aria-hidden="true" /> Tolak
                  </button>
                  <Link
                    to={`/properti/${row.id}`}
                    className="inline-flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-primary-600 transition hover:underline"
                  >
                    Lihat Detail <ArrowRight size={15} aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------
// Tab 2 - Laporan (buyer reports inbox)
// ---------------------------------------------------------------------

function ReportsTab({ adminId }: { adminId: string }) {
  const { toFriendlyMessage, notify, notifyError } = useNotices()
  const [rows, setRows] = useState<AdminReportRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      setRows(await fetchOpenReports())
    } catch (error) {
      setLoadError(toFriendlyMessage(error, 'Gagal memuat laporan pembeli.'))
    } finally {
      setLoading(false)
    }
  }, [toFriendlyMessage])

  useEffect(() => {
    void load()
  }, [load])

  const decide = async (row: AdminReportRow, outcome: 'selesai' | 'ditolak') => {
    if (busyId) return

    setBusyId(row.id)
    try {
      await resolveReport(row.id, adminId, outcome)
      setRows((current) => current.filter((item) => item.id !== row.id))
      notify(outcome === 'selesai' ? FINISHED_TOAST : IGNORED_TOAST)
    } catch (error) {
      notifyError(toFriendlyMessage(error, 'Gagal memperbarui laporan. Silakan coba lagi.'))
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return <ListingRowSkeleton count={3} className="mt-7" />
  }

  if (loadError) {
    return <AdminError message={loadError} onRetry={() => void load()} />
  }

  if (rows.length === 0) {
    return (
      <AdminEmpty
        icon={ShieldCheck}
        title="Tidak ada laporan baru"
        body="Laporan pembeli terhadap iklan akan muncul di sini untuk Anda tindak lanjuti."
      />
    )
  }

  return (
    <div className="mt-7 space-y-4">
      {rows.map((row) => {
        const busy = busyId === row.id

        return (
          <article
            key={row.id}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card"
          >
            <div className="grid sm:grid-cols-[200px_1fr]">
              <div className="relative aspect-[4/3] bg-slate-100">
                <div className="flex h-full items-center justify-center text-text-grey">
                  <Flag size={28} aria-hidden="true" />
                </div>
              </div>

              <div className="p-5">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
                  <span className="rounded-full bg-badge-baru px-2.5 py-1 text-white">Baru</span>
                  <span className="text-text-grey">Dilaporkan {formatDate(row.created_at)}</span>
                </div>

                <p className="mt-3 text-base font-bold text-navy">
                  {REPORT_REASON_LABELS[row.reason] ?? row.reason}
                </p>
                <p className="mt-1 text-sm leading-6 text-text-dark">
                  {row.reason_note?.trim() || 'Tanpa catatan tambahan dari pelapor.'}
                </p>

                <dl className="mt-3 space-y-1 text-xs text-text-grey">
                  <div className="flex gap-1">
                    <dt className="font-semibold text-text-dark">Pelapor:</dt>
                    <dd className="break-all">{row.reporter_email || 'Tidak diketahui'}</dd>
                  </div>
                  {row.property && (
                    <div className="flex gap-1">
                      <dt className="font-semibold text-text-dark">Iklan:</dt>
                      <dd className="break-all">
                        <Link
                          to={`/properti/${row.property.id}`}
                          className="font-semibold text-primary-600 hover:underline"
                        >
                          {row.property.title}
                        </Link>
                      </dd>
                    </div>
                  )}
                </dl>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void decide(row, 'selesai')}
                    className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary-500 px-4 text-sm font-bold text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <CheckCircle2 size={16} aria-hidden="true" /> Tandai Selesai
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void decide(row, 'ditolak')}
                    className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-text-grey transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <X size={16} aria-hidden="true" /> Abaikan
                  </button>
                </div>
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------
// Tab 3 - Semua Listing (read-only browser with title search)
// ---------------------------------------------------------------------

function AllListingsTab() {
  const { toFriendlyMessage } = useNotices()
  const [rows, setRows] = useState<AdminPropertyRow[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      setRows(await fetchAllListings())
    } catch (error) {
      setLoadError(toFriendlyMessage(error, 'Gagal memuat daftar iklan.'))
    } finally {
      setLoading(false)
    }
  }, [toFriendlyMessage])

  useEffect(() => {
    void load()
  }, [load])

  const keyword = query.trim().toLowerCase()
  const results = keyword
    ? rows.filter((row) => row.title.toLowerCase().includes(keyword))
    : rows

  if (loading) {
    return <ListingRowSkeleton count={3} className="mt-7" />
  }

  if (loadError) {
    return <AdminError message={loadError} onRetry={() => void load()} />
  }

  return (
    <div className="mt-7">
      <label htmlFor="admin-cari-listing" className="sr-only">
        Cari judul iklan
      </label>
      <div className="relative max-w-md">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-grey"
          aria-hidden="true"
        />
        <input
          id="admin-cari-listing"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cari judul iklan..."
          className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-text-dark outline-none transition placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
        />
      </div>

      <p className="mt-4 text-sm text-text-grey">
        Menampilkan {results.length} dari {rows.length} iklan.
      </p>

      {results.length === 0 ? (
        <AdminEmpty
          icon={Search}
          title={keyword ? 'Iklan tidak ditemukan' : 'Belum ada iklan'}
          body={
            keyword
              ? 'Coba kata kunci lain, misalnya nama perumahan atau wilayah.'
              : 'Iklan yang dipasang penjual akan muncul di sini.'
          }
        />
      ) : (
        <div className="mt-7 space-y-4">
          {results.map((row) => {
            const badge = STATUS_BADGES[row.status] ?? {
              label: row.status,
              className: 'bg-badge-terjual',
            }

            return (
              <article
                key={row.id}
                className="flex flex-col gap-4 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:flex-row sm:items-center"
              >
                <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:w-40">
                  {row.photos?.[0] ? (
                    <PropertyImage
                      src={row.photos[0]}
                      alt={row.title}
                      widths={[200, 400]}
                      sizes="(min-width: 640px) 160px, 100vw"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-text-grey">
                      <Home size={24} aria-hidden="true" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
                    <span
                      className={`rounded-full px-2.5 py-1 text-white ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                    <span className="text-text-grey">
                      Ditambahkan {formatDate(row.created_at)}
                    </span>
                  </div>
                  <p className="mt-2 text-base font-bold text-navy">{formatRupiah(row.price)}</p>
                  <h2 className="mt-1 truncate text-sm font-semibold text-text-dark">
                    {row.title}
                  </h2>
                  <p className="mt-1 text-xs text-text-grey">
                    {row.district}, {row.city}
                  </p>
                </div>

                <Link
                  to={`/properti/${row.id}`}
                  className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-bold text-navy transition hover:border-primary-500 hover:text-primary-600"
                >
                  Lihat <ArrowRight size={14} aria-hidden="true" />
                </Link>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
