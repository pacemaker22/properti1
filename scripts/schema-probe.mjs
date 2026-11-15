// READ-ONLY schema probe: select rows + parse error hints. No writes.
import { readFileSync } from 'node:fs'

const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
const CRLF = new RegExp('\r\n|\r|\n')
const env = Object.fromEntries(
  envFile
    .split(CRLF)
    .filter((line) => /^VITE_[A-Z_]+=/.test(line))
    .map((line) => {
      const at = line.indexOf('=')
      return [line.slice(0, at), line.slice(at + 1).replace(/^"|"$/g, '')]
    }),
)

const url = env.VITE_SUPABASE_URL
const key = env.VITE_SUPABASE_ANON_KEY
if (!url || !key) {
  console.log('PROBE: missing env values')
  process.exit(1)
}

const headers = { apikey: key, Authorization: `Bearer ${key}` }

const probe = async (table) => {
  const target = `${url}/rest/v1/${table}?select=*&limit=0`
  let response
  try {
    response = await fetch(target, { headers })
  } catch (error) {
    return { table, status: 'NETWORK', detail: String(error.message || error) }
  }

  const text = await response.text()
  let payload = null
  try {
    payload = JSON.parse(text)
  } catch {
    payload = text
  }

  const hint = typeof payload?.message === 'string' ? payload.message : ''

  // PGRST205 = table not found; PGRST204 = column not found in schema cache.
  if (response.status === 404 && /PGRST205/.test(hint)) {
    return { table, status: 'MISSING_TABLE', detail: hint }
  }
  if (/PGRST204/.test(hint)) {
    return { table, status: 'MISSING_COLUMN', detail: hint }
  }
  return {
    table,
    status: response.status,
    detail: hint || (Array.isArray(payload) ? 'row readable' : text.slice(0, 180)),
  }
}

const checks = [
  ['properties', 'id,title,price,city,district,photos,agent_name,created_at,seller_id,admin_status,whatsapp'],
  ['properties', 'reviewed_by,reviewed_at,review_note'],
  ['property_private_details', 'property_id,seller_id,private_address'],
  ['profiles', 'id,email,is_admin'],
  ['reports', 'id,property_id,reporter_id,reporter_email,reason,reason_note,status,reviewed_by,reviewed_at,created_at'],
  ['reports', 'status=eq.baru'],
  ['reports', 'status=eq.pending'],
  ['reports', 'status=eq.selesai'],
  ['reports', 'status=eq.ditolak'],
]

for (const [table, columns] of checks) {
  const filter = columns.startsWith('status=') ? columns : `select=${columns}&limit=0`
  const target = filter.startsWith('status=')
    ? `${url}/rest/v1/${table}?${filter}&select=id&limit=0`
    : `${url}/rest/v1/${table}?${filter}`

  let response
  try {
    response = await fetch(target, { headers })
  } catch (error) {
    console.log(`CHECK ${table} [${columns}] -> NETWORK ${error.message}`)
    continue
  }

  const text = await response.text()
  let payload = null
  try {
    payload = JSON.parse(text)
  } catch {
    payload = text
  }
  const hint = typeof payload?.message === 'string' ? payload.message : String(text).slice(0, 300)
  console.log(`CHECK ${table} [${columns}] -> ${response.status} :: ${hint}`)
}
