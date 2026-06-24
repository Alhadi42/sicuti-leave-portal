# ✅ Final Setup Checklist - SiCuti SSO

## 🎯 Status Saat Ini

### ✅ Yang Sudah Selesai:
1. ✅ Kode SSO sudah diperbaiki dengan validasi
2. ✅ Error handling lebih informatif
3. ✅ Warning banner otomatis muncul jika config tidak lengkap
4. ✅ Build local berhasil
5. ✅ Push ke GitHub berhasil
6. ✅ Vercel akan auto-deploy

### ⏳ Yang Masih Perlu Dilakukan:
1. ⏳ **Setup Environment Variables di Vercel** (URGENT - 5 menit)
2. ⏳ **Verifikasi route `/auth` di aplikasi SIMPEL**
3. ⏳ **Test SSO end-to-end**

---

## 🚨 LANGKAH 1: Setup Environment Variables di Vercel (URGENT)

### Tanpa ini, aplikasi tidak akan berfungsi!

**Lokasi:** https://vercel.com/dashboard → Your Project → Settings → Environment Variables

### 8 Variables yang WAJIB ditambahkan:

```env
# 1. Supabase SiCuti URL
Name: VITE_SUPABASE_URL
Value: https://ociedycfgkqvcqwdxprt.supabase.co
Environments: ☑ Production ☑ Preview ☑ Development

# 2. Supabase SiCuti Anon Key
Name: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jaWVkeWNmZ2txdmNxd2R4cHJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2OTkxNDksImV4cCI6MjA2NTI3NTE0OX0.QQP-4esGf1C3mdxTECskuY66beHsuqwVEgnpcBJ32B4
Environments: ☑ Production ☑ Preview ☑ Development

# 3. Supabase SiCuti Publishable Key (sama dengan anon key)
Name: VITE_SUPABASE_PUBLISHABLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jaWVkeWNmZ2txdmNxd2R4cHJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2OTkxNDksImV4cCI6MjA2NTI3NTE0OX0.QQP-4esGf1C3mdxTECskuY66beHsuqwVEgnpcBJ32B4
Environments: ☑ Production ☑ Preview ☑ Development

# 4. Supabase SiCuti Service Role Key
Name: VITE_SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jaWVkeWNmZ2txdmNxd2R4cHJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTY5OTE0OSwiZXhwIjoyMDY1Mjc1MTQ5fQ.j4AzaxD2layIcpVzjJEM1U3l4_tqtnEYwH9bPI1B0Mo
Environments: ☑ Production ☑ Preview ☑ Development

# 5. Supabase SIMPEL URL
Name: VITE_SIMPEL_URL
Value: https://mauyygrbdopmpdpnwzra.supabase.co
Environments: ☑ Production ☑ Preview ☑ Development

# 6. Supabase SIMPEL Anon Key
Name: VITE_SIMPEL_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXl5Z3JiZG9wbXBkcG53enJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5MzEzODQsImV4cCI6MjA5MDUwNzM4NH0.rO9oPY2jbax8GNVjW_rkaE8T4FqrV6OoJa7ME96p4bQ
Environments: ☑ Production ☑ Preview ☑ Development

# 7. Supabase SIMPEL Service Role Key
Name: VITE_SIMPEL_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXl5Z3JiZG9wbXBkcG53enJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDkzMTM4NCwiZXhwIjoyMDkwNTA3Mzg0fQ.qMJoz6Xuy4PKwS-LKWpjf_WM5o0fuNtEE4hsgLjJX4Q
Environments: ☑ Production ☑ Preview ☑ Development

# 8. SIMPEL App URL (PENTING untuk SSO redirect!)
Name: VITE_SIMPEL_APP_URL
Value: https://sipandai.site
Environments: ☑ Production ☑ Preview ☑ Development
```

### Setelah menambahkan semua variables:

1. **Deployments** → klik **⋯** pada deployment terakhir
2. Pilih **Redeploy**
3. Tunggu build selesai (~2-3 menit)

---

## 🔍 LANGKAH 2: Verifikasi Deployment

### Setelah Redeploy Selesai:

1. **Buka URL production** (e.g., https://your-app.vercel.app)
2. **Tekan F12** → Console
3. **Cek log:**
   ```
   ✅ Harus muncul: [SSO Config] ✅ Semua environment variables terdeteksi
   ❌ Jika muncul: [SSO Config] ❌ Environment variables yang hilang: ...
      → Berarti ada variable yang belum di-set di Vercel
   ```

### Jika Warning Banner Muncul:

```
⚠️ Konfigurasi SSO Tidak Lengkap
Environment variables yang hilang: VITE_SIMPEL_APP_URL, ...
```

**Artinya:** Environment variables belum di-set dengan benar di Vercel

**Solusi:** Ulangi Langkah 1, pastikan semua 8 variables sudah ditambahkan

---

## 🧪 LANGKAH 3: Test SSO Login

### Test Flow:

1. **Buka landing page:** https://your-app.vercel.app
2. **Klik button:** "Login via SIMPEL" atau "Ajukan Cuti"
3. **Cek redirect:**
   ```
   ✅ Seharusnya redirect ke: https://sipandai.site/auth?redirect=https%3A%2F%2Fyour-app.vercel.app%2Fauth%2Fcallback
   ❌ Jika tidak redirect: Cek console untuk error
   ❌ Jika alert muncul: "Konfigurasi SSO belum lengkap"
      → Environment variables belum lengkap
   ```

4. **Login di SIMPEL** (https://sipandai.site)
   - Masukkan NIP & Password
   - Klik Login

5. **Cek redirect kembali:**
   ```
   ✅ Seharusnya: Kembali ke SiCuti dengan token
      URL: /auth/callback?access_token=...&refresh_token=...
   ✅ Seharusnya: Otomatis login dan masuk ke dashboard
   ```

---

## 🐛 Troubleshooting

### Problem 1: Warning Banner Muncul

**Gejala:**
```
⚠️ Konfigurasi SSO Tidak Lengkap
Environment variables yang hilang: VITE_SIMPEL_APP_URL
```

**Solusi:**
1. Buka Vercel Dashboard
2. Settings → Environment Variables
3. Tambahkan variable yang hilang
4. Redeploy

---

### Problem 2: Error "supabaseUrl is required"

**Gejala:**
```
Uncaught Error: supabaseUrl is required
```

**Penyebab:** Environment variables tidak di-set di Vercel

**Solusi:** Ikuti Langkah 1 di atas

---

### Problem 3: Klik "Login via SIMPEL" Tidak Redirect

**Gejala:** Button diklik tapi tidak ada yang terjadi

**Cek Console:**
```javascript
// Buka DevTools Console, cari error:
[SSO] VITE_SIMPEL_APP_URL tidak dikonfigurasi!
```

**Solusi:**
1. Pastikan `VITE_SIMPEL_APP_URL` sudah di-set di Vercel
2. Redeploy
3. Clear browser cache (Ctrl+Shift+R)

---

### Problem 4: Redirect ke SIMPEL tapi 404

**Gejala:** Redirect ke `https://sipandai.site/auth` tapi halaman 404

**Penyebab:** Route `/auth` belum ada di aplikasi SIMPEL

**Solusi:**
1. Buka aplikasi SIMPEL
2. Tambahkan route `/auth` yang:
   - Menerima parameter `?redirect=...`
   - Menampilkan form login
   - Setelah login, redirect dengan token

Lihat: `SSO_INTEGRATION_GUIDE.md` untuk detail implementasi

---

### Problem 5: Login di SIMPEL Tapi Tidak Kembali ke SiCuti

**Gejala:** Berhasil login di SIMPEL tapi stuck di sana

**Penyebab:** SIMPEL tidak mengirim redirect dengan token

**Solusi di SIMPEL:**
```javascript
// Setelah login berhasil di SIMPEL:
const { data: { session } } = await supabase.auth.getSession();
const redirectUrl = new URL(searchParams.get('redirect'));
redirectUrl.searchParams.set('access_token', session.access_token);
redirectUrl.searchParams.set('refresh_token', session.refresh_token);
window.location.href = redirectUrl.toString();
```

---

## 📊 Status Matrix

| Komponen | Status | Action |
|----------|--------|--------|
| Kode SSO | ✅ Fixed | - |
| Build | ✅ Success | - |
| Push to GitHub | ✅ Done | - |
| Vercel Auto-Deploy | ⏳ In Progress | Wait 2-3 min |
| Environment Variables | ❌ Not Set | **DO THIS NOW** |
| SSO Redirect | ⏳ Waiting Config | After env vars |
| Route `/auth` di SIMPEL | ❓ Unknown | Need verification |

---

## 🎯 Priority Actions

### 1. **SEKARANG** - Setup Environment Variables (5 menit)
   - Login ke Vercel
   - Add 8 variables
   - Redeploy

### 2. **SETELAH REDEPLOY** - Test & Verifikasi (5 menit)
   - Buka production URL
   - Cek console logs
   - Test SSO login flow

### 3. **JIKA ERROR** - Check SIMPEL Route (10 menit)
   - Verifikasi `/auth` route exists
   - Test redirect with token
   - Check callback URL validation

---

## 📞 Quick Help

### Cek Status Config (di Browser Console):
```javascript
// Paste di console production:
console.log({
  SIMPEL_URL: import.meta.env.VITE_SIMPEL_URL ? "✓" : "✗",
  SIMPEL_APP_URL: import.meta.env.VITE_SIMPEL_APP_URL ? "✓" : "✗",
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ? "✓" : "✗"
});
```

### Test Manual Redirect:
```javascript
// Paste di console:
import { redirectToSimpelLogin } from '@/lib/supabaseSSO';
redirectToSimpelLogin();
```

---

## 📚 Dokumentasi Terkait

- `VERCEL_SETUP_CEPAT.md` - Panduan setup Vercel
- `SSO_INTEGRATION_GUIDE.md` - Detail implementasi SSO
- `CARA_FIX_VERCEL.md` - Quick fixes
- `DEPLOYMENT_FIXES.md` - Changelog

---

**Last Updated:** 2026-06-24 17:30
**Next Action:** Setup Environment Variables di Vercel (URGENT)
**Estimated Time:** 10-15 menit total
