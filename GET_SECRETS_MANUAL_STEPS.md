# 🔐 Cara Mendapatkan LOVABLE_API_KEY dan GOOGLE_DRIVE_API_KEY

## ❌ Kenapa CLI Tidak Bisa Retrieve Plaintext Secrets?

```powershell
# Yang bisa dilakukan CLI:
supabase secrets list  # ✅ Bisa (tapi hanya digest/hash)

# Yang TIDAK bisa dilakukan CLI:
supabase secrets get SECRET_NAME  # ❌ Tidak ada command ini
```

**Alasan**: Supabase menyimpan secrets dalam **Vault terenkripsi**. Setelah di-set, plaintext tidak bisa diambil kembali via CLI atau API untuk keamanan.

---

## ✅ SOLUSI: 3 Cara Mendapatkan Secret Keys

### 🎯 Cara 1: Dari Lovable Dashboard (PALING MUDAH)

Ini adalah **sumber asli** keys tersebut.

#### Step 1: Login ke Lovable
```
https://lovable.dev
```

#### Step 2: Dapatkan LOVABLE_API_KEY

1. Klik **Settings** (⚙️) di sidebar kiri
2. Pilih tab **API Keys**
3. Copy value `LOVABLE_API_KEY` yang ditampilkan
   - Format: `lova_xxxxxxxxxxxxxxxxxx`
   - Jika tidak terlihat, klik **Show** atau **Regenerate**

#### Step 3: Dapatkan GOOGLE_DRIVE_API_KEY

1. Klik **Integrations** di sidebar kiri
2. Pilih **Google Drive Connector**
3. Copy value `GOOGLE_DRIVE_API_KEY`
   - Format: `gdk_xxxxxxxxxxxxxxxxxx`
   - Jika tidak terlihat atau expired, klik **Reconnect** atau **Regenerate**

#### Step 4: Set ke Supabase SiCuti

```powershell
# Pastikan menggunakan access token yang benar
$env:SUPABASE_ACCESS_TOKEN="YOUR_SICUTI_ACCESS_TOKEN"

cd "d:\DATA PC ALI\CLONE APLIKASI\SICUTI\SicutiSSO\sicuti-leave-portal"

# Set secrets (ganti dengan nilai asli dari Lovable)
npx supabase secrets set LOVABLE_API_KEY="lova_xxxxxxxx" --project-ref ociedycfgkqvcqwdxprt
npx supabase secrets set GOOGLE_DRIVE_API_KEY="gdk_xxxxxxxx" --project-ref ociedycfgkqvcqwdxprt

# Verify
npx supabase secrets list --project-ref ociedycfgkqvcqwdxprt
```

**Expected Output:**
```
NAME                 | DIGEST
---------------------|------------------------------------------------------------------
GOOGLE_DRIVE_API_KEY | 670ba8c22b1a6b249f75c406e65cca5b6405d861a50309fd1e8de4fe9fb9f65d
LOVABLE_API_KEY      | 917e56f1114a99280038c39d423f7564ca552460d6a6361b59e6f58ac5e02f99
```

Digest harus **SAMA PERSIS** dengan SIMPEL.

---

### 🎯 Cara 2: Dari Supabase Dashboard SIMPEL

Jika secrets sudah di-set di SIMPEL dan visible di dashboard.

#### Step 1: Login ke Supabase
```
https://supabase.com/dashboard
```

#### Step 2: Buka Project SIMPEL

- Project: **simpel-lavotas**
- Ref: `mauyygrbdopmpdpnwzra`

#### Step 3: Akses Secrets

1. Klik **Edge Functions** di sidebar
2. Klik tombol **Manage secrets** (di pojok kanan atas)
3. Cari `LOVABLE_API_KEY` dan `GOOGLE_DRIVE_API_KEY`

**⚠️ CATATAN:** 
- Jika value ter-mask dengan `***`, artinya tidak bisa dilihat
- Anda harus regenerate di Lovable atau hubungi yang set secrets originally

#### Step 4: Copy ke SiCuti

Jika berhasil melihat plaintext:

```powershell
cd "d:\DATA PC ALI\CLONE APLIKASI\SICUTI\SicutiSSO\sicuti-leave-portal"

$env:SUPABASE_ACCESS_TOKEN="YOUR_SICUTI_ACCESS_TOKEN"

npx supabase secrets set LOVABLE_API_KEY="<copy_dari_simpel>" --project-ref ociedycfgkqvcqwdxprt
npx supabase secrets set GOOGLE_DRIVE_API_KEY="<copy_dari_simpel>" --project-ref ociedycfgkqvcqwdxprt
```

---

### 🎯 Cara 3: Regenerate Keys Baru (JIKA CARA 1 & 2 GAGAL)

Jika tidak bisa mendapatkan keys lama, buat yang baru.

#### Step 1: Regenerate di Lovable

1. Login ke https://lovable.dev
2. **LOVABLE_API_KEY:**
   - Settings → API Keys → **Regenerate API Key**
   - Copy key baru (simpan di tempat aman!)
   
3. **GOOGLE_DRIVE_API_KEY:**
   - Integrations → Google Drive → **Reconnect** atau **Regenerate**
   - Authorize Google account jika diminta
   - Copy key baru

#### Step 2: Set ke KEDUA Project

**⚠️ PENTING:** Jika regenerate, **WAJIB update di SIMPEL juga!**

```powershell
# 1. Set ke SIMPEL (mauyygrbdopmpdpnwzra)
cd "d:\DATA PC ALI\CLONE APLIKASI\simpelv3\simpel-lavotas"
$env:SUPABASE_ACCESS_TOKEN="YOUR_SIMPEL_ACCESS_TOKEN"

npx supabase secrets set LOVABLE_API_KEY="lova_NEW_KEY" --project-ref mauyygrbdopmpdpnwzra
npx supabase secrets set GOOGLE_DRIVE_API_KEY="gdk_NEW_KEY" --project-ref mauyygrbdopmpdpnwzra

# 2. Set ke SICUTI (ociedycfgkqvcqwdxprt)
cd "d:\DATA PC ALI\CLONE APLIKASI\SICUTI\SicutiSSO\sicuti-leave-portal"
$env:SUPABASE_ACCESS_TOKEN="YOUR_SICUTI_ACCESS_TOKEN"

npx supabase secrets set LOVABLE_API_KEY="lova_NEW_KEY" --project-ref ociedycfgkqvcqwdxprt
npx supabase secrets set GOOGLE_DRIVE_API_KEY="gdk_NEW_KEY" --project-ref ociedycfgkqvcqwdxprt
```

#### Step 3: Deploy Ulang Edge Functions

```powershell
# SIMPEL
cd "d:\DATA PC ALI\CLONE APLIKASI\simpelv3\simpel-lavotas"
npx supabase functions deploy usulan-doc-upload --project-ref mauyygrbdopmpdpnwzra
npx supabase functions deploy usulan-doc-delete --project-ref mauyygrbdopmpdpnwzra

# SICUTI
cd "d:\DATA PC ALI\CLONE APLIKASI\SICUTI\SicutiSSO\sicuti-leave-portal"
npx supabase functions deploy leave-doc-upload --project-ref ociedycfgkqvcqwdxprt
npx supabase functions deploy leave-doc-delete --project-ref ociedycfgkqvcqwdxprt
```

---

## 🧪 Verify Secrets Sudah Benar

Setelah set secrets, verify digest SAMA di kedua project:

```powershell
# Check SIMPEL
cd "d:\DATA PC ALI\CLONE APLIKASI\simpelv3\simpel-lavotas"
$env:SUPABASE_ACCESS_TOKEN="YOUR_SIMPEL_ACCESS_TOKEN"
npx supabase secrets list --project-ref mauyygrbdopmpdpnwzra

# Check SICUTI
cd "d:\DATA PC ALI\CLONE APLIKASI\SICUTI\SicutiSSO\sicuti-leave-portal"
$env:SUPABASE_ACCESS_TOKEN="YOUR_SICUTI_ACCESS_TOKEN"
npx supabase secrets list --project-ref ociedycfgkqvcqwdxprt
```

**Compare Output:**

Kedua project harus punya digest yang **SAMA PERSIS**:

```
SIMPEL (mauyygrbdopmpdpnwzra):
GOOGLE_DRIVE_API_KEY | 670ba8c22b1a6b249f75c406e65cca5b6405d861a50309fd1e8de4fe9fb9f65d
LOVABLE_API_KEY      | 917e56f1114a99280038c39d423f7564ca552460d6a6361b59e6f58ac5e02f99

SICUTI (ociedycfgkqvcqwdxprt):
GOOGLE_DRIVE_API_KEY | 670ba8c22b1a6b249f75c406e65cca5b6405d861a50309fd1e8de4fe9fb9f65d ✅
LOVABLE_API_KEY      | 917e56f1114a99280038c39d423f7564ca552460d6a6361b59e6f58ac5e02f99 ✅
```

Jika digest **berbeda**, artinya value berbeda → **upload akan gagal**.

---

## 🧪 Test Upload Setelah Setup

```powershell
cd "d:\DATA PC ALI\CLONE APLIKASI\SICUTI\SicutiSSO\sicuti-leave-portal"

# Start dev server
npm run dev
```

1. Login sebagai Employee
2. Buat usulan cuti baru
3. Upload dokumen (PDF/image)
4. Submit form
5. Check console browser:
   - ✅ Success: "Document uploaded successfully"
   - ❌ Error: "Invalid API key" → secrets masih salah

---

## 📋 Checklist Lengkap

- [ ] Login ke Lovable Dashboard (https://lovable.dev)
- [ ] Copy `LOVABLE_API_KEY` dari Settings → API Keys
- [ ] Copy `GOOGLE_DRIVE_API_KEY` dari Integrations → Google Drive
- [ ] Set secrets ke SiCuti Supabase
- [ ] Verify digest sama dengan SIMPEL
- [ ] Deploy edge functions `leave-doc-upload` dan `leave-doc-delete`
- [ ] Test upload dari frontend
- [ ] Verify file muncul di Google Drive

---

## 🆘 Troubleshooting

### Error: "Invalid API key"

**Penyebab:**
- Secrets belum di-set di SiCuti Supabase
- Digest berbeda dengan SIMPEL (value tidak sama)
- Edge function belum di-deploy ulang setelah set secrets

**Solusi:**
1. Verify digest dengan `supabase secrets list`
2. Jika berbeda, set ulang dengan value yang benar
3. Deploy ulang edge functions

### Error: "LOVABLE_API_KEY not configured"

**Penyebab:**
- Typo nama secret (harus exact: `LOVABLE_API_KEY`)
- Secret tidak ter-set sama sekali

**Solusi:**
```powershell
npx supabase secrets set LOVABLE_API_KEY="lova_xxxx" --project-ref ociedycfgkqvcqwdxprt
```

### Tidak Bisa Login ke Lovable Dashboard

**Penyebab:**
- Account berbeda dengan yang setup project originally
- Project tidak terhubung ke Lovable account Anda

**Solusi:**
- Hubungi admin/developer yang setup project originally
- Atau regenerate keys dan update di semua project

---

## 📞 Bantuan Lebih Lanjut

Jika masih ada masalah, share:
1. Output dari `npx supabase secrets list` (kedua project)
2. Screenshot error dari browser console
3. Response dari edge function (jika ada)

