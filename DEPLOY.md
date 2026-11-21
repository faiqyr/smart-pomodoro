# Panduan Deploy ke Vercel + Neon (100% Gratis)

## Arsitektur

```
GitHub
├── backend/   → Vercel Project #1 (Serverless Functions Node.js)
└── frontend/  → Vercel Project #2 (Static Site React/Vite)

Database: Neon.tech (PostgreSQL gratis)
```

---

## Prasyarat

- Akun [GitHub](https://github.com)
- Akun [Vercel](https://vercel.com) (daftar gratis dengan GitHub)
- Akun [Neon](https://neon.tech) (daftar gratis)
- Node.js v18+ terinstall di lokal

---

## LANGKAH 1 — Setup Database di Neon

1. Buka [console.neon.tech](https://console.neon.tech) → **Create Project**
2. Isi nama project: `smart-pomodoro` → pilih region terdekat (misal Singapore) → **Create**
3. Setelah project dibuat, buka tab **Connection Details**
4. Pilih dropdown **Connect from** → pilih **Prisma**
5. Salin dua connection string yang muncul:

```
DATABASE_URL="postgresql://neondb_owner:xxx@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true"
DIRECT_URL="postgresql://neondb_owner:xxx@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
```

> `DATABASE_URL` menggunakan connection pooler (pgbouncer) untuk serverless.
> `DIRECT_URL` digunakan Prisma untuk migrasi langsung.

---

## LANGKAH 2 — Setup Lokal untuk Migrasi

Isi file `backend/.env` dengan connection string dari Neon:

```env
DATABASE_URL="postgresql://neondb_owner:xxx@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true"
DIRECT_URL="postgresql://neondb_owner:xxx@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
JWT_SECRET="ganti-dengan-secret-yang-kuat-min-32-karakter"
PORT=3001
CORS_ORIGIN="http://localhost:5173"
```

Jalankan migrasi dari folder `backend/`:

```bash
cd backend
npm install
npx prisma migrate dev --name init
```

Verifikasi tabel terbuat di Neon Console → tab **Tables**.

(Opsional) Isi data demo:
```bash
npm run db:seed
```

---

## LANGKAH 3 — Push ke GitHub

Pastikan project sudah ada di GitHub. Kalau belum:

```bash
# Di root folder smart-pomodoro/
git init
git add .
git commit -m "feat: initial commit"
git remote add origin https://github.com/USERNAME/smart-pomodoro.git
git push -u origin main
```

Pastikan file `.env` masuk ke `.gitignore` (jangan di-push ke GitHub).

---

## LANGKAH 4 — Deploy Backend ke Vercel

1. Buka [vercel.com/new](https://vercel.com/new)
2. Klik **Import Git Repository** → pilih repo `smart-pomodoro`
3. Vercel akan deteksi root directory. Ubah **Root Directory** ke `backend`
4. **Framework Preset**: pilih **Other**
5. **Build Command**: `npx prisma generate`
6. **Output Directory**: kosongkan
7. **Install Command**: `npm install`
8. Klik **Environment Variables** → tambahkan satu per satu:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | `postgresql://...?pgbouncer=true&sslmode=require` |
| `DIRECT_URL` | `postgresql://...?sslmode=require` |
| `JWT_SECRET` | string acak minimal 32 karakter |
| `CORS_ORIGIN` | `https://your-frontend.vercel.app` *(isi setelah frontend di-deploy, bisa diupdate nanti)* |
| `NODE_ENV` | `production` |

9. Klik **Deploy** → tunggu selesai
10. Salin URL backend yang muncul, contoh: `https://smart-pomodoro-backend.vercel.app`

**Test backend:**
```
https://smart-pomodoro-backend.vercel.app/api/health
```
Harus return: `{"status":"ok","timestamp":"..."}`

---

## LANGKAH 5 — Deploy Frontend ke Vercel

1. Buka [vercel.com/new](https://vercel.com/new) lagi
2. Import repo yang sama `smart-pomodoro`
3. Ubah **Root Directory** ke `frontend`
4. **Framework Preset**: Vercel otomatis deteksi **Vite** ✓
5. **Build Command**: `npm run build` (otomatis terisi)
6. **Output Directory**: `dist` (otomatis terisi)
7. Klik **Environment Variables** → tambahkan:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://smart-pomodoro-backend.vercel.app/api` |

8. Klik **Deploy** → tunggu selesai
9. Salin URL frontend, contoh: `https://smart-pomodoro-frontend.vercel.app`

---

## LANGKAH 6 — Update CORS di Backend

Sekarang URL frontend sudah diketahui. Update environment variable di backend Vercel:

1. Buka Vercel dashboard → project **backend** → tab **Settings** → **Environment Variables**
2. Edit `CORS_ORIGIN` → ganti dengan URL frontend: `https://smart-pomodoro-frontend.vercel.app`
3. Klik **Save** → lalu klik **Redeploy** (tombol di tab Deployments) agar perubahan aktif

---

## LANGKAH 7 — Update frontend/.env.production

Edit file `frontend/.env.production` di lokal dengan URL backend yang sebenarnya:

```env
VITE_API_URL=https://smart-pomodoro-backend.vercel.app/api
```

Commit dan push agar Vercel rebuild otomatis:

```bash
git add frontend/.env.production
git commit -m "chore: update production API URL"
git push
```

Vercel akan trigger redeploy otomatis.

---

## Verifikasi Akhir

Checklist sebelum dinyatakan selesai:

- [ ] `https://your-backend.vercel.app/api/health` → `{"status":"ok"}`
- [ ] Buka `https://your-frontend.vercel.app` → halaman login muncul
- [ ] Register akun baru → berhasil masuk ke dashboard
- [ ] Buat task → tersimpan dan muncul di list
- [ ] Mulai sesi Pomodoro → timer berjalan
- [ ] Halaman Analytics → chart tampil
- [ ] Refresh halaman di route manapun → tidak 404 (berkat `vercel.json` frontend)

---

## Troubleshooting

### Error: `P1001` atau koneksi database gagal
- Pastikan `DATABASE_URL` di Vercel env vars sudah benar (dengan `?pgbouncer=true&sslmode=require`)
- Cek di Neon Console apakah project masih aktif (tidak di-suspend)

### Error: `CORS policy` di browser
- Pastikan `CORS_ORIGIN` di backend env vars sama persis dengan URL frontend (tanpa trailing slash)
- Lakukan redeploy backend setelah update env vars

### Error 404 saat refresh halaman di frontend
- Pastikan file `frontend/vercel.json` sudah ada dan ter-push ke GitHub

### Error: `prisma generate` gagal saat build
- Pastikan `postinstall` script ada di `backend/package.json`: `"postinstall": "npx prisma generate"`

### Cold start lambat (backend)
- Normal di Vercel free tier. Request pertama setelah idle bisa lambat 1–3 detik.
- Ini tidak mempengaruhi fungsionalitas.

---

## Ringkasan URL

| Service | URL |
|---------|-----|
| Backend API | `https://smart-pomodoro-backend.vercel.app` |
| Frontend App | `https://smart-pomodoro-frontend.vercel.app` |
| Database | Neon Console: `console.neon.tech` |

---

## Biaya

| Platform | Plan | Biaya |
|----------|------|-------|
| Vercel (backend) | Hobby | Gratis |
| Vercel (frontend) | Hobby | Gratis |
| Neon (PostgreSQL) | Free Tier | Gratis |
| **Total** | | **Rp 0** |
