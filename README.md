# properti1.com

Platform jual-beli properti di Indonesia: cari rumah, apartemen, tanah, dan ruko,
lalu **langsung chat WhatsApp dengan penjual**.

| Peran | Ringkasan |
| --- | --- |
| **Pembeli** | Mencari dan chat WhatsApp **tanpa perlu akun**. Favorit & lapor iklan cukup login biasa. |
| **Penjual** | Pasang iklan gratis setelah login; iklan tampil setelah disetujui admin. |
| **Admin** | Panel moderasi di `/admin` untuk menyetujui iklan dan menindak laporan. |

Seluruh antarmuka pengguna menggunakan Bahasa Indonesia. Komentar dan penamaan
kode menggunakan Bahasa Inggris.

---

## Daftar Isi

- [Fitur](#fitur)
- [Tech Stack](#tech-stack)
- [Memulai](#memulai)
- [Skrip npm](#skrip-npm)
- [Basis Data (Supabase)](#basis-data-supabase)
- [Struktur Proyek](#struktur-proyek)
- [Deploy ke Vercel](#deploy-ke-vercel)
- [Batasan yang Diketahui](#batasan-yang-diketahui)
- [Dokumen Terkait](#dokumen-terkait)

---

## Fitur

### Pembeli (tanpa akun)

- Hero pencarian + filter cepat (Rumah, Apartemen, Tanah, Ruko, Disewa)
- Filter lengkap yang bisa dikombinasikan: Kota, Tipe, Harga, Kamar Tidur, Status
- Urutkan: Terbaru, Termurah, Termahal, Terpopuler
- Kartu listing: harga (format Rupiah), judul 2 baris, lokasi, spesifikasi,
  badge Baru (kurang dari 7 hari), overlay `TERJUAL`
- Halaman detail: galeri foto (swipe di mobile), tabel spesifikasi, kartu agen,
  "Properti Serupa"
- Tombol **Chat WhatsApp** dengan pesan terisi otomatis (judul, harga, tautan)
- Tombol **Bagikan**: WhatsApp + salin tautan

### Pembeli (butuh login)

- **Favorit** (hati): tersimpan di tabel Supabase `favorites`, bukan localStorage,
  jadi ikut pindah perangkat. Halaman Favorit Saya.
- **Laporkan Iklan**: laporan pembeli masuk ke inbox admin (tabel `reports`).

### Penjual

- Pasang iklan gratis: 1-8 foto, drag & drop, foto pertama jadi sampul
- Iklan Saya: inventaris pribadi penjual, edit, hapus, tandai Terjual
- Iklan baru berstatus `pending` dan tampil setelah disetujui admin
- Alamat lengkap bersifat privat: hanya pemilik iklan (dan admin) yang melihatnya;
  pembeli hanya melihat kecamatan dan kota

### Admin

Panel `/admin` (akses hanya untuk akun dengan `profiles.is_admin = true`), tiga tab:

- **Listing Menunggu**: setujui atau tolak iklan `pending`, lengkap dengan catatan review
- **Laporan**: inbox laporan pembeli; tandai selesai atau abaikan
- **Semua Listing**: telusuri seluruh iklan (baca-saja)

Semua hak akses ditegakkan RLS di Postgres. Tidak ada service-role key di browser;
kunci anon adalah satu-satunya kredensial frontend.

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

## Memulai

Prasyarat: **Node.js 18+** dan satu project Supabase.

```bash
git clone <repo-url>
cd properti1.com
npm install
cp .env.example .env.local
npm run dev
```

Buka `http://localhost:5173`.

### Variabel Environment

Isi `.env.local` dari Supabase > Project Settings > API:

| Nama | Wajib | Keterangan |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Ya | Project URL |
| `VITE_SUPABASE_ANON_KEY` | Ya | Anon / publishable key |
| `VITE_SITE_URL` | Tidak | Base URL kanonik untuk SEO (mis. `https://properti1.com`) |
| `VITE_OG_IMAGE_URL` | Tidak | Ganti gambar Open Graph default |

Catatan:

- Hanya anon / publishable key yang boleh ada di frontend. Jangan pernah
  menaruh service-role key di variabel `VITE_*` karena nilainya ikut terkirim
  ke peramban.
- Tanpa dua variabel wajib, aplikasi menampilkan galat jelas di konsol dan
  daftar properti kosong. Tidak ada mock data bawaan dan tidak ada fallback
  localStorage: semua listing dibaca dari tabel `properties`.
- Hanya baris dengan `admin_status = 'approved'` yang tampil untuk pembeli.

---

## Skrip npm

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Server pengembangan (hot reload) |
| `npm run build` | Typecheck (`tsc -b`) lalu bundel produksi ke `dist/` |
| `npm run preview` | Menyajikan hasil `dist/` secara lokal |
| `npm run typecheck` | TypeScript saja, tanpa bundel |

Skrip bantu di `scripts/` (dijalankan manual dengan `node scripts/<nama>`):

- `generate-seed.cjs` - membuat ulang `supabase/seed.sql` dari `src/data/properties.json`
- `schema-verify.mjs`, `schema-probe.mjs` - cek skema Supabase secara read-only

---

## Basis Data (Supabase)

Jalankan **berurutan** di Supabase Studio > SQL Editor:

| Urutan | File | Isi |
| --- | --- | --- |
| 1 | `supabase/migrations/20261110000000_step3_supabase.sql` | Tabel `properties`, `property_private_details`, bucket Storage `property-photos`, RLS dasar |
| 2 | `supabase/migrations/20261112000000_property_moderation.sql` | Kolom `admin_status` (`pending` / `approved` / `rejected`) + tabel `admin_users` |
| 3 | `supabase/migrations/20261113000000_admin_security.sql` | `profiles.is_admin`, tabel `favorites` & `reports`, tabel `property_moderation` (jejak review), validasi server-side, menghapus `admin_users` |
| 4 (opsional) | `supabase/seed.sql` | 12 listing contoh, sudah `approved` |

### Validasi yang ditegakkan di database

Ditambahkan oleh migrasi 3, sehingga tetap berlaku walau REST dipanggil langsung:

- Nomor WhatsApp format `08...` / `628...` (10-13 digit)
- Foto 1-8 URL `.jpg` / `.jpeg` / `.png` / `.webp` (batas 5 MB per berkas
  ditegakkan di bucket Storage)
- Judul 10-120 karakter, deskripsi minimal 100 karakter, harga lebih dari 0
- Penjual hanya bisa menyimpan iklan sebagai `pending` dan hanya boleh
  mengedit barisnya sendiri selama masih `pending`; hanya admin yang bisa
  menyetujui atau menolak

### Siklus iklan

```
Formulir penjual -> pending -> admin setujui -> approved -> tampil di beranda
                            -> admin tolak   -> rejected
```

Panel admin di `/admin` menangani persetujuan. Fallback manual lewat SQL:

```sql
update public.properties set admin_status = 'approved' where id = '<uuid-iklan>';
```

Menjadikan sebuah akun sebagai admin:

```sql
update public.profiles set is_admin = true where id = '<uuid-user>';
```

---

## Struktur Proyek

```
src/
  App.tsx                 # Definisi rute
  main.tsx                # Provider: Auth > Listings > Favorites > Notices
  components/
    Layout.tsx  Header.tsx  Footer.tsx  Hero.tsx  FilterBar.tsx
    ListingCard.tsx        # Kartu properti (grid)
    ListingCardSkeleton.tsx# Skeleton loading bersama + varian baris
    PropertyGallery.tsx    # Galeri + pratinjau layar penuh
    PropertyImage.tsx      # <img> responsif + fallback "Foto tidak tersedia"
    PhotoUploader.tsx      # Unggah foto iklan (drag & drop, validasi)
    AgentCard.tsx  AgentAvatar.tsx  FavoriteButton.tsx
    AuthModal.tsx          # Masuk / daftar akun
    ShareButton.tsx        # Panel bagikan: WhatsApp + salin tautan
    ReportModal.tsx        # Formulir laporan iklan
    CtaBanner.tsx  LegalPage.tsx
    AdminEmpty.tsx  AdminError.tsx
    Seo.tsx  JsonLd.tsx    # Meta dokumen + structured data
  lib/
    supabase.ts            # Klien + isSupabaseConfigured
    property-api.ts        # CRUD properti + unggah foto
    properties.ts          # Pemetaan baris DB -> tipe Property
    admin.ts               # Akses data panel admin (moderasi, laporan)
    listings.tsx           # Context listing
    favorites.tsx          # Context favorit (tabel favorites)
    auth.tsx               # Context auth
    notices.tsx            # Toast + pesan ramah untuk error database
    filters.ts             # Filter, pencarian, urutan
    format.ts              # formatRupiah, formatArea, label
    image.ts               # srcSet / optimasi URL gambar
    seo.ts                 # Judul kanonik, meta, JSON-LD
    share.ts               # Teks & URL berbagi
    contact.ts             # Tautan wa.me / tel
  pages/
    HomePage.tsx  DetailPage.tsx  FavoritesPage.tsx
    AddListingPage.tsx  MyListingsPage.tsx
    AdminPage.tsx          # Panel admin /admin
    TermsPage.tsx  PrivacyPage.tsx  NotFoundPage.tsx
  types/                   # Property, PropertyRow, Database, dll.
  data/                    # Sumber data seed (properties.json)
supabase/
  migrations/              # 3 file SQL, jalankan berurutan
  seed.sql                 # Data contoh (opsional)
scripts/                   # Skrip bantu (generator seed, cek skema)
public/og-image.svg        # Gambar Open Graph default
vercel.json                # Rewrite SPA + header cache
```

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

4. Deploy, lalu tambahkan domain produksi di **Settings > Domains**.

`vercel.json` mengatur rewrite SPA: permintaan tanpa berkas diteruskan ke
`index.html`, plus header cache untuk `/assets/*` dan `og-image.svg`. Tanpa
ini, `/properti/<id>` dan halaman lain akan 404 saat dibuka langsung atau
dibagikan.

---

## Batasan yang Diketahui

Dicatat apa adanya agar tidak mengejutkan saat demo atau rilis.

- **Pratinjau tautan di WhatsApp/Facebook belum per halaman.** Tag `og:image`
  dan `og:url` disuntikkan saat runtime oleh `Seo.tsx`, sedangkan perayap
  WhatsApp/Facebook tidak menjalankan JavaScript. Setiap tautan yang dibagikan
  memakai judul dan deskripsi bawaan `index.html`. Perbaikannya butuh
  prerendering (mis. `react-snap` atau prerender Vercel) atau tag statis.
- **Ukuran bundel** sekitar 561 kB (153 kB gzip) tanpa code splitting; Vite
  memberi peringatan. Fungsional, tetapi masih kandidat untuk dipecah.
- **Belum diuji di Safari iPhone.** Pengujian sejauh ini di desktop.

---

## Dokumen Terkait

| File | Isi |
| --- | --- |
| `Properti1-PRD.md` | Product requirements |
| `Properti1-PLANNING.md` | Rencana pengembangan bertahap |
| `Properti1-DESIGN.md` | Keputusan desain & UI |
| `BACKEND-STEP1-ADMIN-SECURITY.md` | Desain backend: peran admin, moderasi, keamanan |
