# ✅ Cara Memperbaiki Error "supabaseUrl is required" di Vercel

## 🔥 Masalah
Error `supabaseUrl is required` muncul di production Vercel karena environment variables tidak dikonfigurasi.

## 🚀 Solusi Cepat (3 Langkah)

### 1️⃣ Login ke Vercel
Buka https://vercel.com dan pilih project Anda

### 2️⃣ Tambahkan Environment Variables

**Settings** → **Environment Variables** → **Add New**

Copy-paste variable ini satu per satu:

```
VITE_SUPABASE_URL
https://ociedycfgkqvcqwdxprt.supabase.co

VITE_SUPABASE_ANON_KEY
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jaWVkeWNmZ2txdmNxd2R4cHJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2OTkxNDksImV4cCI6MjA2NTI3NTE0OX0.QQP-4esGf1C3mdxTECskuY66beHsuqwVEgnpcBJ32B4

VITE_SUPABASE_SERVICE_ROLE_KEY
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jaWVkeWNmZ2txdmNxd2R4cHJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTY5OTE0OSwiZXhwIjoyMDY1Mjc1MTQ5fQ.j4AzaxD2layIcpVzjJEM1U3l4_tqtnEYwH9bPI1B0Mo

VITE_SIMPEL_URL
https://mauyygrbdopmpdpnwzra.supabase.co

VITE_SIMPEL_ANON_KEY
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXl5Z3JiZG9wbXBkcG53enJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5MzEzODQsImV4cCI6MjA5MDUwNzM4NH0.rO9oPY2jbax8GNVjW_rkaE8T4FqrV6OoJa7ME96p4bQ

VITE_SIMPEL_SERVICE_ROLE_KEY
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXl5Z3JiZG9wbXBkcG53enJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDkzMTM4NCwiZXhwIjoyMDkwNTA3Mzg0fQ.qMJoz6Xuy4PKwS-LKWpjf_WM5o0fuNtEE4hsgLjJX4Q

VITE_SIMPEL_APP_URL
https://your-app.vercel.app
```

⚠️ **PENTING:** 
- Centang semua: ✅ Production, ✅ Preview, ✅ Development
- Ganti `https://your-app.vercel.app` dengan URL production Anda

### 3️⃣ Redeploy

**Deployments** → klik **⋯** (titik tiga) → **Redeploy**

## 🎯 Alternatif: Import dari File

Lebih cepat? Import langsung:

1. Buka file `.env.production` yang sudah disediakan
2. Ganti `VITE_SIMPEL_APP_URL` dengan URL production Anda
3. Di Vercel: **Settings** → **Environment Variables** → **Import** → upload `.env.production`
4. Redeploy

## ✅ Verifikasi

Setelah deployment selesai:
1. Buka aplikasi di browser
2. Buka Console (F12)
3. Cek tidak ada error "supabaseUrl is required"

## 🐛 Masih Error?

### Cek 1: Pastikan nama variable benar
- Harus pakai prefix `VITE_`
- Nama harus persis: `VITE_SUPABASE_URL` (bukan `SUPABASE_URL`)

### Cek 2: Clear cache dan redeploy
- **Deployments** → **Redeploy** → ✅ "Clear build cache"

### Cek 3: Lihat Build Logs
- **Deployments** → pilih deployment → **View Function Logs**
- Cari tahu apakah ada error lain

## 📝 Catatan Penting

1. **Prefix VITE_**: Wajib untuk variables yang digunakan di browser
2. **Semua Environment**: Harus centang Production + Preview + Development
3. **Redeploy Wajib**: Setiap kali tambah/edit variable, harus redeploy
4. **Jangan Commit**: File `.env.production` sudah ada di `.gitignore`

---

**Butuh bantuan?** Lihat `VERCEL_DEPLOYMENT.md` untuk panduan lengkap.
