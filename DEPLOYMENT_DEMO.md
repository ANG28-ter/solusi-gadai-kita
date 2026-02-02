# Panduan Deployment Demo untuk Portfolio

Panduan ini akan membantu Anda men-deploy aplikasi **Solusi Gadai Kita** secara **GRATIS** menggunakan platform hosting modern. Cocok untuk demo portfolio yang bisa diakses oleh HRD atau calon klien.

## 🎯 Arsitektur Deployment

- **Database**: Neon (PostgreSQL gratis)
- **Backend API**: Railway (gratis dengan limit)
- **Frontend Web**: Vercel (gratis)

## 📋 Persiapan

Sebelum memulai, pastikan Anda memiliki:
- [ ] Akun GitHub (untuk push source code)
- [ ] Akun Neon (https://neon.tech)
- [ ] Akun Railway (https://railway.app)
- [ ] Akun Vercel (https://vercel.com)

> [!TIP]
> Semua platform di atas menawarkan tier gratis yang cukup untuk demo portfolio. Anda bisa sign up menggunakan akun GitHub untuk mempermudah proses.

---

## 1️⃣ Setup Database (Neon)

### 1.1 Buat Project Baru di Neon

1. Login ke [Neon Console](https://console.neon.tech)
2. Klik **"Create Project"**
3. Isi detail project:
   - **Project name**: `solusi-gadai-kita`
   - **Region**: Pilih yang terdekat (Singapore untuk Indonesia)
   - **PostgreSQL version**: 16 (atau versi terbaru)
4. Klik **"Create Project"**

### 1.2 Dapatkan Connection String

Setelah project dibuat, Anda akan melihat **Connection String**. Salin connection string dengan format:

```
postgresql://[user]:[password]@[host]/[database]?sslmode=require
```

Simpan connection string ini, kita akan menggunakannya nanti.

> [!IMPORTANT]
> Connection string ini bersifat rahasia. Jangan share ke publik atau commit ke Git.

---

## 2️⃣ Setup Backend API (Railway)

### 2.1 Push Code ke GitHub

Jika belum, push project Anda ke GitHub repository:

```bash
cd c:\Lokal Disk\solusi-gadai-kita
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/USERNAME/solusi-gadai-kita.git
git push -u origin main
```

### 2.2 Deploy ke Railway

1. Login ke [Railway](https://railway.app)
2. Klik **"New Project"** → **"Deploy from GitHub repo"**
3. Pilih repository `solusi-gadai-kita`
4. Railway akan mendeteksi monorepo. Klik **"Add Service"** → **"GitHub Repo"**
5. Pilih repository yang sama lagi untuk service kedua

### 2.3 Konfigurasi Service API

1. Pilih salah satu service, rename menjadi `api`
2. Klik tab **"Settings"**
3. Di bagian **"Build"**, set:
   - **Root Directory**: `apps/api`
   - **Build Command**: `npm install && npx prisma generate --schema=prisma/schema.prisma && npm run build`
   - **Start Command**: `npm run start:prod`

4. Klik tab **"Variables"**
5. Tambahkan environment variables berikut:

```bash
DATABASE_URL=postgresql://[user]:[password]@[host]/[database]?sslmode=require
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=3001
NODE_ENV=production
```

> [!WARNING]
> Ganti `DATABASE_URL` dengan connection string dari Neon (langkah 1.2).
> Ganti `JWT_SECRET` dengan string random yang kuat (minimal 32 karakter).

6. Klik **"Deploy"**

### 2.4 Jalankan Database Migration

Setelah deployment berhasil, kita perlu menjalankan migration:

1. Di Railway dashboard, pilih service `api`
2. Klik tab **"Settings"** → scroll ke bawah
3. Klik **"Deploy"** → **"Custom Start Command"**
4. Jalankan command berikut di Railway CLI atau gunakan "One-off Command":

```bash
npx prisma migrate deploy --schema=prisma/schema.prisma
```

5. Setelah migration selesai, jalankan seeding untuk data awal:

```bash
npx prisma db seed
```

### 2.5 Dapatkan URL API

Setelah deployment berhasil:
1. Klik tab **"Settings"**
2. Di bagian **"Networking"**, klik **"Generate Domain"**
3. Salin URL yang digenerate (contoh: `https://solusi-gadai-api.up.railway.app`)

---

## 3️⃣ Setup Frontend Web (Vercel)

### 3.1 Deploy ke Vercel

1. Login ke [Vercel](https://vercel.com)
2. Klik **"Add New..."** → **"Project"**
3. Import repository `solusi-gadai-kita` dari GitHub
4. Vercel akan mendeteksi Next.js. Klik **"Configure Project"**

### 3.2 Konfigurasi Build Settings

Di halaman konfigurasi:

1. **Framework Preset**: Next.js
2. **Root Directory**: `apps/web`
3. **Build Command**: `npm run build`
4. **Output Directory**: `.next`
5. **Install Command**: `npm install`

### 3.3 Tambahkan Environment Variables

Di bagian **"Environment Variables"**, tambahkan:

```bash
NEXT_PUBLIC_API_URL=https://solusi-gadai-api.up.railway.app
```

> [!IMPORTANT]
> Ganti URL di atas dengan URL API Railway Anda dari langkah 2.5.

6. Klik **"Deploy"**

### 3.4 Dapatkan URL Frontend

Setelah deployment selesai, Vercel akan memberikan URL (contoh: `https://solusi-gadai-kita.vercel.app`)

---

## 4️⃣ Verifikasi & Testing

### 4.1 Cek API

Buka browser dan akses:
```
https://solusi-gadai-api.up.railway.app/health
```

Jika berhasil, Anda akan melihat response JSON.

### 4.2 Cek Frontend

Buka URL Vercel Anda:
```
https://solusi-gadai-kita.vercel.app
```

### 4.3 Login Demo

Gunakan credentials default dari seeding:

```
Username: admin
Password: admin123
```

> [!TIP]
> Anda bisa membuat user demo khusus untuk HRD dengan role tertentu melalui aplikasi setelah login sebagai admin.

---

## 5️⃣ Custom Domain (Opsional)

### Untuk Frontend (Vercel)

1. Di Vercel dashboard, pilih project Anda
2. Klik tab **"Settings"** → **"Domains"**
3. Tambahkan domain Anda (contoh: `demo.solusi-gadai.com`)
4. Ikuti instruksi untuk update DNS records

### Untuk Backend (Railway)

1. Di Railway dashboard, pilih service `api`
2. Klik tab **"Settings"** → **"Networking"**
3. Di bagian **"Custom Domain"**, tambahkan domain (contoh: `api.solusi-gadai.com`)
4. Update DNS records sesuai instruksi

---

## 📊 Monitoring & Maintenance

### Railway (Backend)

- **Logs**: Klik tab "Deployments" → pilih deployment → lihat logs
- **Metrics**: Klik tab "Metrics" untuk CPU, Memory, Network usage
- **Restart**: Klik "Redeploy" jika perlu restart service

### Vercel (Frontend)

- **Logs**: Klik tab "Deployments" → pilih deployment → "View Function Logs"
- **Analytics**: Vercel menyediakan analytics gratis untuk traffic monitoring

### Neon (Database)

- **Monitoring**: Di Neon console, lihat tab "Monitoring" untuk query performance
- **Backups**: Neon otomatis membuat backups (point-in-time recovery)

---

## 🔧 Troubleshooting

### API tidak bisa connect ke Database

1. Cek `DATABASE_URL` di Railway environment variables
2. Pastikan connection string dari Neon sudah benar
3. Pastikan ada `?sslmode=require` di akhir connection string

### Frontend tidak bisa connect ke API

1. Cek `NEXT_PUBLIC_API_URL` di Vercel environment variables
2. Pastikan URL API Railway sudah benar (dengan https://)
3. Cek CORS settings di backend jika ada error

### Migration gagal di Railway

1. Pastikan `DATABASE_URL` sudah di-set
2. Jalankan migration manual via Railway CLI:
   ```bash
   railway run npx prisma migrate deploy
   ```

### Error: Prisma schema not found

Jika muncul error `Could not find Prisma Schema`:

1. **Di Railway/Vercel**: Pastikan Root Directory sudah di-set ke `apps/api`
2. Gunakan path relatif `prisma/schema.prisma` (bukan `./prisma/schema.prisma`)
3. Gunakan command dengan flag schema:
   ```bash
   npx prisma generate --schema=prisma/schema.prisma
   npx prisma migrate deploy --schema=prisma/schema.prisma
   ```

---

## 💰 Estimasi Biaya

Dengan setup di atas, biaya untuk demo portfolio:

| Service | Tier | Biaya |
|---------|------|-------|
| Neon (Database) | Free | $0/bulan |
| Railway (Backend) | Free (500 jam/bulan) | $0/bulan |
| Vercel (Frontend) | Hobby | $0/bulan |
| **TOTAL** | | **$0/bulan** |

> [!NOTE]
> Free tier Railway memberikan 500 jam per bulan (sekitar 20 hari non-stop). Untuk demo portfolio, ini lebih dari cukup. Jika perlu production 24/7, upgrade ke plan berbayar ($5/bulan).

---

## 🎓 Tips untuk Presentasi ke HRD

1. **Siapkan Demo Account**: Buat beberapa user dengan role berbeda (Admin, Kasir, Manajer)
2. **Isi Sample Data**: Tambahkan beberapa customer, loan, dan transaksi untuk demo
3. **Dokumentasi**: Siapkan dokumentasi singkat tentang fitur-fitur utama
4. **Screenshot**: Ambil screenshot dari fitur-fitur penting untuk presentasi
5. **Video Demo**: Rekam video walkthrough aplikasi (opsional tapi sangat membantu)

---

## 📚 Referensi

- [Neon Documentation](https://neon.tech/docs)
- [Railway Documentation](https://docs.railway.app)
- [Vercel Documentation](https://vercel.com/docs)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)

---

**Selamat!** 🎉 Aplikasi Anda sekarang sudah online dan bisa diakses oleh HRD atau siapa saja dengan URL yang Anda share.
