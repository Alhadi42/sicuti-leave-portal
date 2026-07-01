# Cara Copy Secrets dari Simpel-Lavotas ke SiCuti

## 🎯 Kenapa Harus Copy Secret yang Sama?

Karena kedua aplikasi menggunakan **Lovable Connector Gateway yang sama**, sebaiknya menggunakan secret yang sama agar:

- ✅ **Satu Google Drive account** untuk semua dokumen
- ✅ **Tidak perlu setup connector baru**
- ✅ **Folder management lebih mudah**
- ✅ **Quota Drive lebih efisien**

---

## 🚀 Cara 1: Otomatis dengan CLI Script (RECOMMENDED)

### Prerequisites

1. Install Supabase CLI (jika belum):
   ```bash
   npm install -g supabase
   ```

2. Login ke Supabase:
   ```bash
   supabase login
   ```

3. Link kedua projects (jika belum):
   ```bash
   # Link simpel-lavotas
   cd "d:\DATA PC ALI\CLONE APLIKASI\simpelv3\simpel-lavotas"
   supabase link --project-ref mauyygrbdopmpdpnwzra
   
   # Link sicuti-leave-portal
   cd "d:\DATA PC ALI\CLONE APLIKASI\SICUTI\SicutiSSO\sicuti-leave-portal"
   supabase link --project-ref ociedycfgkqvcqwdxprt
   ```

### Jalankan Script

**Windows PowerShell:**
```powershell
cd "d:\DATA PC ALI\CLONE APLIKASI\SICUTI\SicutiSSO\sicuti-leave-portal"
.\copy-secrets-simple.ps1
```

**Git Bash / Linux:**
```bash
cd "d:/DATA PC ALI/CLONE APLIKASI/SICUTI/SicutiSSO/sicuti-leave-portal"
chmod +x copy-secrets-from-simpel.sh
./copy-secrets-from-simpel.sh
```

Script akan otomatis:
- ✅ Read secrets dari project simpel-lavotas
- ✅ Copy ke project sicuti-leave-portal
- ✅ Validasi berhasil atau tidak

**Output yang diharapkan:**
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

---

## 📋 Cara 2: Manual via CLI

### Step 1: List secrets dari simpel-lavotas

```bash
cd "d:\DATA PC ALI\CLONE APLIKASI\simpelv3\simpel-lavotas"
supabase secrets list
```

Copy output `LOVABLE_API_KEY` dan `GOOGLE_DRIVE_API_KEY`

### Step 2: Set secrets ke sicuti

```bash
cd "d:\DATA PC ALI\CLONE APLIKASI\SICUTI\SicutiSSO\sicuti-leave-portal"

# Set LOVABLE_API_KEY
supabase secrets set LOVABLE_API_KEY="<paste_value_here>"

# Set GOOGLE_DRIVE_API_KEY  
supabase secrets set GOOGLE_DRIVE_API_KEY="<paste_value_here>"
```

### Step 3: Verify

```bash
supabase secrets list
```

Anda harus melihat kedua secrets sudah ter-set.

---

## 📋 Cara 3: Manual via Supabase Dashboard

### 1. Buka Supabase Dashboard Simpel-Lavotas

1. Login ke [Supabase](https://supabase.com)
2. Pilih project **simpel-lavotas**
3. Klik menu **Edge Functions** di sidebar kiri
4. Klik tombol **Manage secrets** (atau **View secrets**)

### 2. Copy Secrets dari Simpel-Lavotas

Anda akan melihat list secrets, copy value dari:

- ✅ `LOVABLE_API_KEY`
- ✅ `GOOGLE_DRIVE_API_KEY`

**Cara copy:**
```
LOVABLE_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
GOOGLE_DRIVE_API_KEY=gdk_abc123xyz456...
```

### 3. Paste ke Supabase Dashboard SiCuti

1. Buka project **sicuti-leave-portal** (ociedycfgkqvcqwdxprt)
2. Klik menu **Edge Functions**
3. Klik **Manage secrets**
4. Klik **New secret** atau **Add secret**

**Add kedua secrets:**

| Secret Name | Value |
|-------------|-------|
| `LOVABLE_API_KEY` | `<paste_value_dari_simpel>` |
| `GOOGLE_DRIVE_API_KEY` | `<paste_value_dari_simpel>` |

### 4. Verify Secrets Sudah Tersimpan

Setelah save, Anda akan melihat secrets muncul di list (value akan ter-mask dengan `***`):

```
LOVABLE_API_KEY = ***************************
GOOGLE_DRIVE_API_KEY = ***************************
```

## 🧪 Test Connection

Setelah secrets di-set, test apakah edge function bisa akses Drive:

### Test Upload Function

```bash
# Deploy function dulu
cd sicuti-leave-portal
supabase functions deploy leave-doc-upload

# Test dengan curl (ganti {TOKEN} dengan access token Anda)
curl -X POST \
  https://ociedycfgkqvcqwdxprt.supabase.co/functions/v1/leave-doc-upload \
  -H "Authorization: Bearer {TOKEN}" \
  -F "leave_proposal_item_id=test-id" \
  -F "slot_code=test" \
  -F "slot_label=Test Document" \
  -F "file=@test.pdf"
```

Jika berhasil, Anda akan dapat response:
```json
{
  "ok": true,
  "drive_file_id": "1ABC...",
  "drive_view_url": "https://drive.google.com/file/d/1ABC.../view"
}
```

## 📂 Struktur Folder di Google Drive

Setelah setup, struktur folder akan seperti ini:

```
Google Drive (root)/
├── Usulan Lavotas/              ← Dari simpel-lavotas
│   ├── {jenis_code}/
│   └── ...
└── Sicuti Leave Documents/      ← Dari sicuti-leave-portal
    ├── Leave Requests/
    └── Leave Proposals/
```

Kedua aplikasi akan menyimpan file di **Drive account yang sama**, tapi di folder berbeda.

## 🔧 Cara Update Secrets (Jika Perlu)

Jika suatu saat perlu regenerate keys:

### Update di Lovable Dashboard

1. Login ke [Lovable](https://lovable.dev)
2. **LOVABLE_API_KEY**: Settings → API Keys → Regenerate
3. **GOOGLE_DRIVE_API_KEY**: Integrations → Google Drive → Reconnect (jika perlu)

### Update di Kedua Supabase Projects

Setelah regenerate, **WAJIB update di kedua project**:

1. **Simpel-Lavotas**: Edge Functions → Manage secrets → Edit value
2. **SiCuti**: Edge Functions → Manage secrets → Edit value

**Jangan lupa deploy ulang functions setelah update secrets!**

```bash
# Di simpel-lavotas
supabase functions deploy usulan-doc-upload
supabase functions deploy usulan-doc-delete

# Di sicuti-leave-portal
supabase functions deploy leave-doc-upload
supabase functions deploy leave-doc-delete
```

## 🆘 Troubleshooting

### Error: "LOVABLE_API_KEY not configured"

**Solusi:**
- Check typo nama secret (harus exact: `LOVABLE_API_KEY`)
- Pastikan sudah deploy function setelah set secrets
- Restart edge function (stop/start di Supabase dashboard)

### Error: "GOOGLE_DRIVE_API_KEY not configured"

**Solusi:**
- Check typo nama secret (harus exact: `GOOGLE_DRIVE_API_KEY`)
- Verify connector masih active di Lovable dashboard
- Reconnect Google account jika perlu

### File Upload Gagal Setelah Copy Secrets

**Kemungkinan penyebab:**
1. **Connector expired** - Reconnect di Lovable dashboard
2. **Quota habis** - Check Google Drive storage quota
3. **Permissions berubah** - Reauthorize Google account

**Solusi:**
- Login ke Lovable → Integrations → Google Drive
- Klik **Reconnect** atau **Test Connection**
- Jika diminta authorize ulang, ikuti flow OAuth

## ✅ Checklist Setup Complete

- [ ] Copy `LOVABLE_API_KEY` dari simpel-lavotas
- [ ] Copy `GOOGLE_DRIVE_API_KEY` dari simpel-lavotas  
- [ ] Paste kedua secrets ke sicuti-leave-portal
- [ ] Deploy edge functions (`leave-doc-upload`, `leave-doc-delete`)
- [ ] Test upload dari frontend
- [ ] Verify file muncul di Google Drive folder yang benar

---

**Setup selesai!** 🎉 Sekarang sicuti-leave-portal sudah bisa upload dokumen ke Google Drive yang sama dengan simpel-lavotas.
