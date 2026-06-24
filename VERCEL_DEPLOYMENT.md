# Panduan Deployment ke Vercel

## Masalah yang Diperbaiki

Error: `supabaseUrl is required` di production Vercel disebabkan oleh environment variables yang tidak tersedia saat build time.

## Solusi: Konfigurasi Environment Variables di Vercel

### 1. Login ke Vercel Dashboard
Buka: https://vercel.com/dashboard

### 2. Pilih Project Anda
Klik pada project `sicuti-leave-portal` (atau nama project Anda)

### 3. Tambahkan Environment Variables

Masuk ke: **Settings** → **Environment Variables**

Tambahkan semua environment variables berikut:

#### ⚠️ PENTING: Tambahkan untuk semua environments (Production, Preview, Development)

#### Supabase Configuration

| Variable Name | Value |
|---------------|-------|
| `VITE_SUPABASE_PROJECT_ID` | `ociedycfgkqvcqwdxprt` |
| `VITE_SUPABASE_URL` | `https://ociedycfgkqvcqwdxprt.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jaWVkeWNmZ2txdmNxd2R4cHJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2OTkxNDksImV4cCI6MjA2NTI3NTE0OX0.QQP-4esGf1C3mdxTECskuY66beHsuqwVEgnpcBJ32B4` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jaWVkeWNmZ2txdmNxd2R4cHJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2OTkxNDksImV4cCI6MjA2NTI3NTE0OX0.QQP-4esGf1C3mdxTECskuY66beHsuqwVEgnpcBJ32B4` |
| `VITE_SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jaWVkeWNmZ2txdmNxd2R4cHJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTY5OTE0OSwiZXhwIjoyMDY1Mjc1MTQ5fQ.j4AzaxD2layIcpVzjJEM1U3l4_tqtnEYwH9bPI1B0Mo` |

#### SSO SIMPEL Integration

| Variable Name | Value |
|---------------|-------|
| `VITE_SIMPEL_URL` | `https://mauyygrbdopmpdpnwzra.supabase.co` |
| `VITE_SIMPEL_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXl5Z3JiZG9wbXBkcG53enJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5MzEzODQsImV4cCI6MjA5MDUwNzM4NH0.rO9oPY2jbax8GNVjW_rkaE8T4FqrV6OoJa7ME96p4bQ` |
| `VITE_SIMPEL_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXl5Z3JiZG9wbXBkcG53enJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDkzMTM4NCwiZXhwIjoyMDkwNTA3Mzg0fQ.qMJoz6Xuy4PKwS-LKWpjf_WM5o0fuNtEE4hsgLjJX4Q` |
| `VITE_SIMPEL_APP_URL` | `https://your-production-url.vercel.app` (ganti dengan URL production Anda) |

### 4. Cara Menambahkan di Vercel

#### Opsi A: Melalui UI (Recommended)

1. Masuk ke **Settings** → **Environment Variables**
2. Untuk setiap variable:
   - Klik **Add New**
   - Masukkan **Name** (contoh: `VITE_SUPABASE_URL`)
   - Masukkan **Value** (contoh: `https://ociedycfgkqvcqwdxprt.supabase.co`)
   - Pilih semua environment: ✅ Production, ✅ Preview, ✅ Development
   - Klik **Save**

#### Opsi B: Melalui Vercel CLI

```bash
# Install Vercel CLI jika belum ada
npm i -g vercel

# Login
vercel login

# Tambahkan environment variables
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
# ... ulangi untuk semua variables
```

#### Opsi C: Import dari file .env

1. Buat file `.env.production` dengan semua variables
2. Di Vercel Dashboard → Settings → Environment Variables
3. Klik tombol **Import** (di kanan atas)
4. Upload file `.env.production`

### 5. Redeploy Project

Setelah menambahkan semua environment variables:

1. Masuk ke tab **Deployments**
2. Klik titik tiga (⋯) pada deployment terakhir
3. Pilih **Redeploy**
4. Atau push commit baru ke Git repository untuk trigger deployment otomatis

### 6. Verifikasi

Setelah deployment selesai:

1. Buka aplikasi di URL production
2. Buka Developer Console (F12)
3. Cek apakah ada error "supabaseUrl is required"
4. Jika masih ada error, cek di Vercel Logs:
   - Deployments → pilih deployment → View Function Logs
   - Build Logs → cek apakah environment variables terbaca

## Troubleshooting

### Error masih muncul setelah setup

1. **Cek Environment Variables di Vercel**
   - Pastikan semua variables sudah ditambahkan
   - Pastikan pilih semua environments (Production, Preview, Development)
   - Pastikan tidak ada typo di nama variable (harus persis dengan `VITE_` prefix)

2. **Redeploy dengan Clear Cache**
   - Di Deployments, klik Redeploy
   - Centang "Clear build cache"

3. **Cek Build Logs**
   ```
   Settings → General → Build & Development Settings
   ```
   - Framework Preset: Vite
   - Build Command: `npm run build` atau `yarn build`
   - Output Directory: `dist`

4. **Verifikasi di Browser**
   - Buka DevTools Console
   - Ketik: `import.meta.env.VITE_SUPABASE_URL`
   - Jika undefined, environment variables tidak tersedia

### Environment Variables tidak terbaca

Pastikan menggunakan prefix `VITE_` karena:
- Vite hanya expose variables dengan prefix `VITE_` ke client-side
- Variables tanpa prefix hanya tersedia di server-side/build time
- Kode client-side menggunakan `import.meta.env.VITE_SUPABASE_URL`

### Service Role Key exposed di client

**⚠️ PERHATIAN KEAMANAN:**
- `VITE_SUPABASE_SERVICE_ROLE_KEY` akan exposed di browser
- Hanya gunakan untuk development/testing
- Untuk production, gunakan Row Level Security (RLS) di Supabase
- Atau pindahkan operasi admin ke server-side API endpoints

## Catatan Penting

1. **VITE_ Prefix**: Wajib untuk variables yang digunakan di client-side code
2. **Semua Environments**: Tambahkan untuk Production, Preview, dan Development
3. **Redeploy**: Setelah menambah/edit variables, harus redeploy
4. **Security**: Jangan commit .env ke Git repository
5. **Service Role Key**: Sebaiknya hanya digunakan di server-side

## Quick Copy-Paste untuk Vercel

Jika Vercel support bulk import, copy-paste ini ke file `.env.production`:

```env
VITE_SUPABASE_PROJECT_ID=ociedycfgkqvcqwdxprt
VITE_SUPABASE_URL=https://ociedycfgkqvcqwdxprt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jaWVkeWNmZ2txdmNxd2R4cHJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2OTkxNDksImV4cCI6MjA2NTI3NTE0OX0.QQP-4esGf1C3mdxTECskuY66beHsuqwVEgnpcBJ32B4
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jaWVkeWNmZ2txdmNxd2R4cHJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2OTkxNDksImV4cCI6MjA2NTI3NTE0OX0.QQP-4esGf1C3mdxTECskuY66beHsuqwVEgnpcBJ32B4
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jaWVkeWNmZ2txdmNxd2R4cHJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTY5OTE0OSwiZXhwIjoyMDY1Mjc1MTQ5fQ.j4AzaxD2layIcpVzjJEM1U3l4_tqtnEYwH9bPI1B0Mo
VITE_SIMPEL_URL=https://mauyygrbdopmpdpnwzra.supabase.co
VITE_SIMPEL_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXl5Z3JiZG9wbXBkcG53enJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5MzEzODQsImV4cCI6MjA5MDUwNzM4NH0.rO9oPY2jbax8GNVjW_rkaE8T4FqrV6OoJa7ME96p4bQ
VITE_SIMPEL_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXl5Z3JiZG9wbXBkcG53enJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDkzMTM4NCwiZXhwIjoyMDkwNTA3Mzg0fQ.qMJoz6Xuy4PKwS-LKWpjf_WM5o0fuNtEE4hsgLjJX4Q
VITE_SIMPEL_APP_URL=https://your-app.vercel.app
```

Kemudian import file ini di Vercel Settings.
