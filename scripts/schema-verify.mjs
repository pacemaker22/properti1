// READ-ONLY: confirm which columns property_moderation actually has.
// PostgREST names the missing column in PGRST204 when one is absent.
import { readFileSync } from 'node:fs'

const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
const env = Object.fromEntries(
  envFile
    .split(/\r\n|\r|\n/)
    .filter((line) => /^VITE_[A-Z_]+=/.test(line))
    .map((line) => {
      const at = line.indexOf('=')
      return [line.slice(0, at), line.slice(at + 1).replace(/^"|"$/g, '')]
    }),
)

const headers = {
  apikey: env.VITE_SUPABASE_ANON_KEY,
  Authorization: `Bearer ${env.VITE_SUPABASE_ANON_KEY}`,
}

const candidates = [
  'id',
  'property_id',
  'admin_id',
  'action',
  'note',
  'review_note',
  'created_at',
  'moderated_at',
  'decided_at',
]

for (const column of candidates) {
  const response = await fetch(
    `${env.VITE_SUPABASE_URL}/rest/v1/property_moderation?select=${column}&limit=0`,
    { headers },
  )
  const text = await response.text()
  console.log(`COLUMN ${column} -> HTTP ${response.status} :: ${text.slice(0, 140)}`)
}

