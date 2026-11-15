import { supabase } from './supabase'
import type {
  ModerationAction,
  PropertyModerationInsert,
  PropertyRow,
  ReportRow,
} from '../types/database'

/**
 * Admin panel data access. Every call runs as the signed-in admin through the
 * RLS policies of 20261113000000_admin_security.sql - the anon key is the only
 * credential in the browser, no service_role.
 *
 * Live schema in use (verified read-only via scripts/schema-verify.mjs, do not
 * extend - no new tables or columns):
 *   profiles.is_admin          -> the role
 *   property_moderation        -> one approve/reject decision per listing
 *                                 (id, property_id, admin_id, action,
 *                                  review_note, created_at)
 *   reports.status             -> queue 'baru'/'pending', outcomes
 *                                 'selesai' (Tandai Selesai) and
 *                                 'ditolak' (Abaikan)
 */
const PROPERTIES_TABLE = 'properties'
const PROFILES_TABLE = 'profiles'
const PROPERTY_MODERATION_TABLE = 'property_moderation'
const REPORTS_TABLE = 'reports'

/** Report statuses that still need an admin decision. */
export const OPEN_REPORT_STATUSES = ['baru', 'pending'] as const
/** "Tandai Selesai" - the report was valid and has been acted on. */
export const FINISHED_REPORT_STATUS = 'selesai'
/** "Abaikan" - not a real problem. */
export const DISMISSED_REPORT_STATUS = 'ditolak'
export type ReportOutcome = typeof FINISHED_REPORT_STATUS | typeof DISMISSED_REPORT_STATUS

const REPORT_COLUMNS =
  'id,property_id,reporter_id,reporter_email,reason,reason_note,status,reviewed_by,reviewed_at,created_at'

export type AdminPropertyRow = PropertyRow

export type AdminReportRow = ReportRow & {
  /** Reported listing, stitched in from a second select - no embed needed. */
  property: { id: string; title: string; city: string; district: string } | null
}

/** True when the signed-in account may open /admin. */
export const fetchIsAdmin = async (userId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from(PROFILES_TABLE)
    .select('is_admin')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error
  return data?.is_admin === true
}

/** Every listing, newest first (admins only, RLS decides). */
export const fetchAllListings = async (): Promise<AdminPropertyRow[]> => {
  const { data, error } = await supabase
    .from(PROPERTIES_TABLE)
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as AdminPropertyRow[]
}

/** Property ids that already have an approve/reject decision. */
const fetchModeratedPropertyIds = async (): Promise<string[]> => {
  const { data, error } = await supabase
    .from(PROPERTY_MODERATION_TABLE)
    .select('property_id')

  if (error) throw error
  return (data ?? []).map((row) => row.property_id)
}

/**
 * Listings without a decision yet, newest first. Two plain selects are
 * anti-joined here because PostgREST cannot express NOT EXISTS without a view.
 */
export const fetchPendingListings = async (): Promise<AdminPropertyRow[]> => {
  const [listings, moderatedIds] = await Promise.all([
    fetchAllListings(),
    fetchModeratedPropertyIds(),
  ])
  const moderated = new Set(moderatedIds)
  return listings.filter((row) => !moderated.has(row.id))
}

/**
 * Seller email per listing: profiles.email is only readable by the owner or an
 * admin (RLS "Admins can read all profiles"), so this works from the panel.
 */
export const fetchSellerEmails = async (
  sellerIds: string[],
): Promise<Map<string, string>> => {
  const unique = [...new Set(sellerIds.filter(Boolean))]
  if (unique.length === 0) return new Map()

  const { data, error } = await supabase
    .from(PROFILES_TABLE)
    .select('id,email')
    .in('id', unique)

  if (error) throw error
  return new Map((data ?? []).map((row) => [row.id, row.email]))
}

/**
 * Approve or reject one listing by inserting the decision row. The note column
 * is review_note in the live schema. The rejected note is validated in the
 * panel before this call; here it is simply persisted.
 */
export const moderateListing = async (
  propertyId: string,
  adminId: string,
  action: ModerationAction,
  note: string,
): Promise<void> => {
  // Another admin may have decided this listing between page load and click;
  // keep the failure a friendly sentence instead of constraint text.
  const moderatedIds = await fetchModeratedPropertyIds()
  if (moderatedIds.includes(propertyId)) {
    throw new Error('Listing ini sudah dimoderasi admin lain.')
  }

  const decision: PropertyModerationInsert = {
    property_id: propertyId,
    admin_id: adminId,
    action,
    review_note: note.trim(),
  }

  const { data, error } = await supabase
    .from(PROPERTY_MODERATION_TABLE)
    .insert(decision)
    .select('id')
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error('Gagal menyimpan keputusan moderasi. Silakan coba lagi.')
}

/** Reports waiting for triage, newest first, with the reported listing attached. */
export const fetchOpenReports = async (): Promise<AdminReportRow[]> => {
  const { data, error } = await supabase
    .from(REPORTS_TABLE)
    .select(REPORT_COLUMNS)
    .in('status', [...OPEN_REPORT_STATUSES])
    .order('created_at', { ascending: false })

  if (error) throw error
  const rows = (data ?? []) as ReportRow[]
  if (rows.length === 0) return []

  const listings = await fetchListingsByIds(rows.map((row) => row.property_id))
  return rows.map((row) => ({ ...row, property: listings.get(row.property_id) ?? null }))
}

type ListingSummary = NonNullable<AdminReportRow['property']>

const fetchListingsByIds = async (ids: string[]): Promise<Map<string, ListingSummary>> => {
  const unique = [...new Set(ids)]
  if (unique.length === 0) return new Map()

  const { data, error } = await supabase
    .from(PROPERTIES_TABLE)
    .select('id,title,city,district')
    .in('id', unique)

  if (error) throw error
  return new Map((data ?? []).map((row) => [row.id, row as ListingSummary]))
}

/**
 * Close one report: "Tandai Selesai" stores 'selesai', "Abaikan" stores
 * 'ditolak' - both stamp the reviewing admin and the time.
 */
export const resolveReport = async (
  reportId: string,
  adminId: string,
  status: ReportOutcome,
): Promise<void> => {
  const { data, error } = await supabase
    .from(REPORTS_TABLE)
    .update({
      status,
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', reportId)
    .select('id')
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error('Laporan ini sudah ditinjau admin lain.')
}
