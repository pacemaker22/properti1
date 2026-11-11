const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const sourcePath = path.join(root, 'src', 'data', 'properties.json')
const outputPath = path.join(root, 'supabase', 'seed.sql')
const properties = JSON.parse(fs.readFileSync(sourcePath, 'utf8'))

const quote = (value) => `'${String(value ?? '').replace(/'/g, "''")}'`
const columns = [
  'id',
  'title',
  'price',
  'type',
  'status',
  'city',
  'district',
  'bedrooms',
  'bathrooms',
  'land_area',
  'building_area',
  'certificate',
  'floors',
  'parking',
  'year_built',
  'furnished',
  'electricity',
  'description',
  'photos',
  'agent_name',
  'agent_photo',
  'whatsapp',
  'is_sold',
  'is_featured',
  'view_count',
  'created_at',
]

const rows = properties.map((property) => {
  const values = [
    `md5(${quote(property.id)})::uuid`,
    quote(property.title),
    property.price,
    quote(property.type),
    quote(property.status),
    quote(property.city),
    quote(property.district),
    property.bedrooms,
    property.bathrooms,
    property.land_area,
    property.building_area,
    quote(property.certificate),
    property.floors,
    property.parking,
    property.year_built,
    property.furnished,
    property.electricity,
    quote(property.description),
    `ARRAY[${property.photos.map(quote).join(', ')}]::text[]`,
    quote(property.agent_name),
    quote(property.agent_photo),
    quote(property.whatsapp),
    property.is_sold,
    property.is_featured,
    property.view_count,
    quote(property.created_at),
  ]

  return `  (${values.join(', ')})`
})

const updateColumns = columns.filter((column) => column !== 'id')
const sql = `-- Optional demo data for the existing 12 properties.
-- Run after supabase/migrations/20261110000000_step3_supabase.sql.

begin;

insert into public.properties (${columns.join(', ')})
values
${rows.join(',\n')}
on conflict (id) do update set
${updateColumns.map((column) => `  ${column} = excluded.${column}`).join(',\n')};

commit;
`

fs.writeFileSync(outputPath, sql, 'utf8')
console.log(`Wrote ${properties.length} properties to ${outputPath}`)
