# properti1.com

Platform jual-beli properti di Indonesia: cari rumah, apartemen, tanah, dan ruko,
lalu **langsung chat WhatsApp dengan penjual** â€” tanpa daftar akun untuk pembeli.

Seluruh antarmuka pengguna menggunakan Bahasa Indonesia. Komentar dan penamaan
kode menggunakan Bahasa Inggris.

---

## Fitur

### Pembeli
- Hero pencarian + filter cepat (Rumah, Apartemen, Tanah, Ruko, Disewa)
- Filter lengkap: Kota, Tipe, Harga, Kamar Tidur, Status â€” dapat dikombinasikan
- Urutkan: Terbaru, Termurah, Termahal, Terpopuler
- Kartu listing: harga (format Rupiah), judul 2 baris, lokasi, spesifikasi, badge
  Baru (kurang dari 7 hari), dan overlay `TERJUAL`
- Halaman detail: galeri foto (swipe pada mobile), tabel spesifikasi, kartu agen
- Tombol **Chat WhatsApp** dengan pesan terisi otomatis (judul, harga, tautan)
- Favorit (hati) tanpa login untuk pembeli, halaman Favorit Saya
- Tombol **Bagikan**: WhatsApp + salin tautan
- Tombol **Laporkan Iklan** untuk listing palsu
- "Properti Serupa" di halaman detail

### Penjual
- Pasang iklan gratis: 1â€“8 foto, drag & drop, foto pertama jadi sampul
- Iklan Saya: inventaris pribadi penjual, edit, hapus, tandai Terjual
- Alamat lengkap bersifat privat: hanya pemilik iklan yang dapat melihatnya,
  pembeli hanya melihat kecamatan dan kota
- Nomor WhatsApp divalidasi (format 08â€¦)


---

## Tech Stack

| Layer | Pilihan |
| --- | --- |
| Build | Vite 6 + TypeScript (strict) |
| UI | React 18, React Router 6 |
| Styling | Tailwind CSS 3 (design token di `tailwind.config.js`) |
| Ikon | Lucide React |
| Backend | Supabase (Postgres + Auth + Storage) |
| Deploy | Vercel |

Tanpa framework tambahan: SEO, JSON-LD, dan berbagi tautan ditangani oleh
komponen kecil di `src/components/` (`Seo`, `JsonLd`, `ShareButton`).

---

## Menjalankan Secara Lokal

Butuh **Node.js 18+**.

```bash
git clone <repo-url>
cd properti1.com
npm install
cp .env.example .env.local
npm run dev
```

Buka `http://localhost:5173`.


### Environment Variables

| Nama | Wajib | Keterangan |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Ya | Project URL dari Supabase > Settings > API |
| `VITE_SUPABASE_ANON_KEY` | Ya | Anon / publishable key |
| `VITE_SITE_URL` | Tidak | Base URL kanonik untuk SEO (mis. `https://properti1.com`) |
| `VITE_OG_IMAGE_URL` | Tidak | Ganti gambar Open Graph default |

Tanpa dua variabel pertama, aplikasi menampilkan galat jelas di konsol dan
daftar properti kosong. Tidak ada mock data bawaan dan tidak ada fallback
`localStorage`: semua listing dibaca dari tabel `properties`. Hanya baris dengan
`admin_status = 'approved'` yang tampil di beranda, halaman detail, dan favorit.
Iklan baru dari formulir masuk sebagai `pending` dan menampilkan pesan
**Listing menunggu persetujuan admin**.


---

## Skrip

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Server pengembangan (hot reload) |
| `npm run build` | Typecheck (`tsc -b`) lalu bundel produksi ke `dist/` |
| `npm run preview` | Menyajikan hasil `dist/` secara lokal |
| `npm run typecheck` | TypeScript saja, tanpa bundel |

---

## Basis Data (Supabase)

Jalankan berurutan di **Supabase Studio > SQL Editor**:

1. `supabase/migrations/20261110000000_step3_supabase.sql` — tabel `properties`,
   `property_private_details`, bucket `property-photos`, dan RLS.
2. `supabase/migrations/20261112000000_property_moderation.sql` — kolom
   `admin_status` (`pending` / `approved` / `rejected`), kebijakan RLS moderasi,
   dan tabel `admin_users`.
3. `supabase/seed.sql` — 12 listing contoh (opsional, sudah `approved`).

Panel admin belum dibangun. Selama belum ada, setujui iklan manual:

```sql
update public.properties set admin_status = 'approved' where id = '<uuid-iklan>';
```

1. `supabase/migrations/20261110000000_step3_supabase.sql` â€” tabel `properties`,
   `property_private_details`, bucket `property-photos`, dan RLS.

---

## Struktur Proyek

```
src/
  App.tsx                 # Definisi rute
  main.tsx                # Provider: Auth > Listings > Favorites
  components/
    Header.tsx  Footer.tsx  Hero.tsx  FilterBar.tsx
    ListingCard.tsx        # Kartu properti (grid)
    ListingCardSkeleton.tsx# Skeleton loading bersama + varian baris
    PropertyGallery.tsx    # Galeri + pratinjau layar penuh
    PropertyImage.tsx      # <img> responsif + fallback "Foto tidak tersedia"
    AgentCard.tsx  AgentAvatar.tsx  FavoriteButton.tsx
    AuthModal.tsx          # Masuk / daftar penjual
    ShareButton.tsx        # Panel bagikan: WhatsApp + salin tautan
    ReportModal.tsx        # Formulir laporan iklan
    LegalPage.tsx          # Layout halaman statis
    Seo.tsx  JsonLd.tsx    # Meta dokumen + structured data
  lib/
    supabase.ts            # Klien + isSupabaseConfigured
    property-api.ts        # CRUD properti + unggah foto
    listings.tsx           # Context listing
    favorites.tsx          # Context favorit (localStorage)
    auth.tsx               # Context auth penjual
    filters.ts             # Filter, pencarian, urutan
    format.ts              # formatRupiah, formatArea, label
    image.ts               # srcSet / optimasi URL gambar
    seo.ts                 # Judul kanonik, meta, JSON-LD
    share.ts               # Teks & URL berbagi
    contact.ts             # Tautan wa.me / tel
  pages/
    HomePage.tsx  DetailPage.tsx  FavoritesPage.tsx
    AddListingPage.tsx  MyListingsPage.tsx
    TermsPage.tsx  PrivacyPage.tsx  NotFoundPage.tsx
  data/                    # data listing ada di Supabase
  types/                   # Property, PropertyRow, Database
supabase/
  migrations/20261110000000_step3_supabase.sql
  seed.sql
public/og-image.svg        # Gambar Open Graph default
vercel.json                # Rewrite SPA (deep link)
```


2. `supabase/seed.sql` â€” 12 listing contoh (opsional).

Skema dan kebijakan RLS saat ini masih **milik Step 3**. Rancangan peran admin

---

## Deploy ke Vercel

1. Import repo di <https://vercel.com/new>.
2. **Framework Preset:** Vite. **Build Command:** `npm run build`.
   **Output Directory:** `dist`.
3. **Settings > Environment Variables**, tambahkan (semua environment):

   | Key | Value |
   | --- | --- |
   | `VITE_SUPABASE_URL` | `https://<project-ref>.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | anon / publishable key |
   | `VITE_SITE_URL` | `https://properti1.com` |

   Jangan pernah menaruh service-role key di variabel `VITE_*` â€” nilainya
   ikut terkirim ke peramban.
4. Deploy, lalu tambahkan domain produksi di **Settings > Domains**.

`vercel.json` sudah mengatur rewrite SPA: permintaan tanpa berkas diteruskan
ke `index.html`, sedangkan `/assets/*` dan `og-image.svg` disajikan apa adanya.
Tanpa ini, `/properti/<id>` dan halaman lain 404 saat dibuka langsung atau
dibagikan.


---

## Batasan yang Diketahui

Dicatat apa adanya agar tidak mengejutkan saat demo atau rilis.

- **Pratinjau tautan di WhatsApp/Facebook belum per halaman.** Tag `og:image`
  dan `og:url` disuntikkan saat runtime oleh `Seo.tsx`, sedangkan perayap
  WhatsApp/Facebook tidak menjalankan JavaScript. Setiap tautan yang dibagikan
  memakai judul dan deskripsi bawaan `index.html`. Perbaikannya butuh
  prerendering (mis. `react-snap` atau prerender Vercel) atau tag statis.
- **Belum ada UI admin untuk moderasi.** Kolom `admin_status` dan tabel
  `admin_users` sudah ada di skema, tetapi halamannya belum dibangun. Iklan baru
  tersimpan sebagai `pending` dan tidak tampil sampai disetujui manual.
  Kolom `status` tetap berarti dijual / disewa / terjual.
- **Belum ada peran admin.** Tidak ada tabel `profiles`, `favorites`, atau
  `reports`. Favorit tersimpan di `localStorage` peramban pembeli.
- **Deskripsi minimal 100 karakter hanya divalidasi di klien.** Panggilan REST
  langsung ke Supabase masih bisa melewatinya. Batas foto (1-8, 5 MB,
  JPEG/PNG/WebP) ditegakkan di bucket Storage — bukan di tabel `properties`.
- **Ukuran bundel** sekitar 548 kB (150 kB gzip); Vite memberi peringatan.
  Fungsional, tetapi masih kandidat untuk dipecah.
- **Belum diuji di Safari iPhone.** Pengujian sejauh ini di desktop.


