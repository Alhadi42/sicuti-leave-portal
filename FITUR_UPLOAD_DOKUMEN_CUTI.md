# Fitur Upload Dokumen Cuti - Quick Start

## ✨ Apa yang Baru?

Form pengajuan cuti pegawai sekarang **sudah terintegrasi dengan Google Drive** untuk upload dokumen pendukung, sama seperti sistem usulan di simpel-lavotas!

## 🎯 Cara Kerja

1. **Pegawai mengisi form pengajuan cuti** seperti biasa (jenis cuti, tanggal, alasan, dll)
2. **Kirim pengajuan** → Form akan tersimpan sebagai draft/pending
3. **Section "Dokumen Pendukung" muncul** setelah form terkirim
4. **Upload dokumen** (formulir cuti, surat keterangan, dll) ke Google Drive
5. **Admin Unit** menerima notifikasi dan dapat mereview dokumen + proposal

## 📁 Dokumen yang Bisa Diupload

- **Formulir Permohonan Cuti** (opsional)
- **Surat Keterangan Pendukung** (opsional)

Format file: PDF, JPG, PNG, DOC, DOCX (max 20MB)

## 🚀 Setup Cepat

### 1. Jalankan Database Migration

```bash
# Di Supabase SQL Editor, jalankan:
add_leave_documents_table.sql
```

### 2. Deploy Edge Functions

```bash
supabase functions deploy leave-doc-upload
supabase functions deploy leave-doc-delete
```

### 3. Copy Secrets dari Simpel-Lavotas

**Otomatis dengan script (RECOMMENDED):**

```powershell
# Windows PowerShell
cd sicuti-leave-portal
.\copy-secrets-simple.ps1
```

```bash
# Git Bash / Linux
cd sicuti-leave-portal
chmod +x copy-secrets-from-simpel.sh
./copy-secrets-from-simpel.sh
```

**Manual via CLI:**

```bash
# List secrets dari simpel
cd simpel-lavotas
supabase secrets list

# Copy ke sicuti
cd sicuti-leave-portal
supabase secrets set LOVABLE_API_KEY=<copy_dari_simpel>
supabase secrets set GOOGLE_DRIVE_API_KEY=<copy_dari_simpel>
```

Detail lengkap: [COPY_SECRETS_FROM_SIMPEL.md](./COPY_SECRETS_FROM_SIMPEL.md)

### 4. Test!

1. Login sebagai employee
2. Buat pengajuan cuti baru
3. Upload dokumen setelah form terkirim
4. Dokumen otomatis tersimpan di Google Drive folder terorganisir

## 📂 Struktur Folder Google Drive

```
Sicuti Leave Documents/
└── Leave Proposals/
    └── {Department}/
        └── {Proposal ID}/
            └── {Item ID}/
                ├── formulir_cuti.pdf
                └── surat_keterangan.pdf
```

## 🔐 Authorization

- ✅ **Employee**: Upload dokumen untuk proposal sendiri (status draft/pending)
- ✅ **Admin Unit**: Upload & manage dokumen dari department mereka
- ✅ **Admin Pusat**: Full access ke semua dokumen

## 🎨 Fitur Komponen Upload

- ✅ Drag & drop / click to upload
- ✅ Progress indicator saat upload
- ✅ External link fallback (paste Google Drive link manual)
- ✅ Verification status badges (pending/approved/rejected)
- ✅ Document locking untuk yang sudah approved
- ✅ Delete dokumen dengan konfirmasi

## 🔧 Komponen yang Ditambahkan

### Backend
- `supabase/functions/leave-doc-upload/index.ts` - Upload ke Drive
- `supabase/functions/leave-doc-delete/index.ts` - Delete dari Drive
- `add_leave_documents_table.sql` - Database schema

### Frontend
- `src/components/leave_documents/LeaveDocumentUploader.jsx` - UI upload component
- Updated: `src/components/leave_proposals/EmployeeLeaveRequestForm.jsx` - Integrasi ke form

### Config
- Updated: `.env.example` - Tambah Google Drive keys

## 📖 Dokumentasi Lengkap

Lihat [GOOGLE_DRIVE_INTEGRATION_GUIDE.md](./GOOGLE_DRIVE_INTEGRATION_GUIDE.md) untuk:
- Arsitektur detail
- API endpoints
- RLS policies
- Error handling
- Troubleshooting
- Testing guide

## 🐛 Troubleshooting Cepat

**Upload gagal?**
- ✓ Check LOVABLE_API_KEY dan GOOGLE_DRIVE_API_KEY di Supabase secrets
- ✓ Verify Google Drive connector masih active di Lovable
- ✓ Check browser console untuk error

**File tidak muncul?**
- ✓ Refresh page
- ✓ Check Supabase Edge Function logs
- ✓ Verify folder permissions di Google Drive

**Authorization error?**
- ✓ Check user role di `user_roles` table
- ✓ Verify user department matching dengan proposal
- ✓ Check RLS policies di Supabase

## 🎉 Demo Flow

1. **Pegawai** submit form cuti → Upload formulir permohonan
2. **Admin Unit** review → Verifikasi dokumen (approve/reject)
3. **Admin Unit** approve proposal → Dokumen locked
4. **Dokumen tersimpan** di Google Drive dengan link public (anyone with link)

---

**Implementasi berhasil!** 🚀 Form pengajuan cuti sekarang sudah terintegrasi dengan Google Drive seperti sistem usulan di simpel-lavotas.
