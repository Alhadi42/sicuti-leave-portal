# 🔐 Copy Secrets Script

Script otomatis untuk copy Google Drive secrets dari simpel-lavotas ke sicuti-leave-portal.

## 🚀 Quick Start

### Windows (PowerShell)

```powershell
cd "d:\DATA PC ALI\CLONE APLIKASI\SICUTI\SicutiSSO\sicuti-leave-portal"
.\copy-secrets-simple.ps1
```

### Linux / Git Bash

```bash
cd "d:/DATA PC ALI/CLONE APLIKASI/SICUTI/SicutiSSO/sicuti-leave-portal"
chmod +x copy-secrets-from-simpel.sh
./copy-secrets-from-simpel.sh
```

## 📋 Prerequisites

### 1. Install Supabase CLI

```bash
npm install -g supabase
```

Verify installation:
```bash
supabase --version
```

### 2. Login to Supabase

```bash
supabase login
```

Ini akan membuka browser untuk OAuth authentication.

### 3. Link Projects

**Simpel-Lavotas:**
```bash
cd "d:\DATA PC ALI\CLONE APLIKASI\simpelv3\simpel-lavotas"
supabase link --project-ref mauyygrbdopmpdpnwzra
```

**SiCuti:**
```bash
cd "d:\DATA PC ALI\CLONE APLIKASI\SICUTI\SicutiSSO\sicuti-leave-portal"
supabase link --project-ref ociedycfgkqvcqwdxprt
```

Verify:
```bash
supabase status
```

## 📝 Cara Kerja Script

### copy-secrets-simple.ps1 (PowerShell)

1. **Read secrets** dari project simpel-lavotas:
   - `LOVABLE_API_KEY`
   - `GOOGLE_DRIVE_API_KEY`

2. **Write secrets** ke project sicuti-leave-portal

3. **Verify** kedua secrets berhasil di-set

### copy-secrets-from-simpel.sh (Bash)

Sama seperti PowerShell script, tapi untuk Linux/Git Bash environment.

## ✅ Output yang Diharapkan

```
🔐 Copy Secrets: Simpel-Lavotas → SiCuti

1️⃣ Get secrets dari simpel-lavotas...
   ✓ Secrets ditemukan

2️⃣ Set secrets ke sicuti...
   ✓ Secrets berhasil di-set

✅ Done! Sekarang deploy edge functions:
   supabase functions deploy leave-doc-upload
   supabase functions deploy leave-doc-delete
```

## 🔧 Troubleshooting

### Error: "Supabase CLI tidak ditemukan"

**Solusi:**
```bash
npm install -g supabase
```

### Error: "Project not linked"

**Solusi:**
```bash
# Link simpel-lavotas
cd simpel-lavotas
supabase link --project-ref mauyygrbdopmpdpnwzra

# Link sicuti
cd sicuti-leave-portal  
supabase link --project-ref ociedycfgkqvcqwdxprt
```

### Error: "Secrets tidak ditemukan"

**Kemungkinan:**
1. Secret belum di-set di simpel-lavotas
2. Salah link project
3. Tidak punya akses ke project

**Solusi:**
```bash
# Verify secrets ada di simpel
cd simpel-lavotas
supabase secrets list

# Jika kosong, set manual dulu
supabase secrets set LOVABLE_API_KEY=your_key
supabase secrets set GOOGLE_DRIVE_API_KEY=your_key
```

### Error: "Access denied"

**Solusi:**
```bash
# Re-login
supabase logout
supabase login

# Link ulang projects
supabase link
```

## 🔄 Manual Alternative

Jika script gagal, copy manual via CLI:

```bash
# 1. List secrets dari simpel
cd simpel-lavotas
supabase secrets list

# Output:
# LOVABLE_API_KEY     | eyJhbGci...
# GOOGLE_DRIVE_API_KEY | gdk_abc...

# 2. Copy value dan set ke sicuti
cd sicuti-leave-portal
supabase secrets set LOVABLE_API_KEY="eyJhbGci..."
supabase secrets set GOOGLE_DRIVE_API_KEY="gdk_abc..."

# 3. Verify
supabase secrets list
```

## 📚 Next Steps

Setelah secrets berhasil di-copy:

### 1. Deploy Edge Functions

```bash
cd sicuti-leave-portal
supabase functions deploy leave-doc-upload
supabase functions deploy leave-doc-delete
```

### 2. Run Database Migration

Di Supabase SQL Editor, jalankan:
```sql
-- File: add_leave_documents_table.sql
```

### 3. Test Upload

1. Buka aplikasi sicuti-leave-portal
2. Login sebagai employee
3. Buat pengajuan cuti
4. Upload dokumen formulir
5. Verify file muncul di Google Drive

## 📂 Lokasi Scripts

- **PowerShell**: `copy-secrets-simple.ps1`
- **Bash**: `copy-secrets-from-simpel.sh`
- **Advanced**: `copy-secrets-from-simpel.ps1` (dengan error handling lengkap)

## 🔐 Security Notes

- ⚠️ **JANGAN commit** file .env atau secrets ke git
- ✅ Script hanya membaca dari simpel dan menulis ke sicuti (tidak menyimpan di disk)
- ✅ Secrets hanya tersimpan di Supabase Edge Function environment
- ✅ Tidak ada secrets yang di-expose ke frontend

## ℹ️ Additional Info

**Project References:**
- Simpel-Lavotas: `mauyygrbdopmpdpnwzra`
- SiCuti: `ociedycfgkqvcqwdxprt`

**Secrets yang di-copy:**
- `LOVABLE_API_KEY` - Untuk authenticate ke Lovable Gateway
- `GOOGLE_DRIVE_API_KEY` - Untuk authenticate ke Google Drive Connector

**Dokumentasi Lengkap:**
- [COPY_SECRETS_FROM_SIMPEL.md](./COPY_SECRETS_FROM_SIMPEL.md) - Detail manual copy
- [GOOGLE_DRIVE_INTEGRATION_GUIDE.md](./GOOGLE_DRIVE_INTEGRATION_GUIDE.md) - Full integration guide
- [FITUR_UPLOAD_DOKUMEN_CUTI.md](./FITUR_UPLOAD_DOKUMEN_CUTI.md) - Feature overview

---

**Happy Coding!** 🚀
