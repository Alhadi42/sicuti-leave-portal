# Panduan Integrasi Google Drive untuk Upload Dokumen Cuti

## Overview

Sistem upload dokumen cuti di SiCuti telah diintegrasikan dengan Google Drive menggunakan pola yang sama dengan simpel-lavotas. Setiap dokumen yang diupload akan tersimpan di Google Drive dengan struktur folder terorganisir dan metadata disimpan di database Supabase.

## Arsitektur

### Backend (Supabase Edge Functions)
- **leave-doc-upload**: Upload file ke Google Drive dan simpan metadata
- **leave-doc-delete**: Hapus file dari Google Drive dan database

### Frontend
- **LeaveDocumentUploader**: Komponen React untuk upload/delete dokumen
- Terintegrasi di **EmployeeLeaveRequestForm** untuk pengajuan cuti pegawai

### Database
- **leave_documents**: Tabel untuk menyimpan metadata dokumen
- RLS policies untuk authorization berdasarkan role (employee, admin_unit, admin_pusat)

## Fitur Utama

1. **Upload ke Google Drive**
   - Max file size: 20MB
   - Format didukung: PDF, JPG, PNG, DOC, DOCX
   - Auto-create folder structure: `Sicuti Leave Documents/{type}/{department}/{id}`
   - File permissions: readable by anyone with link

2. **External Link Fallback**
   - User bisa paste link Google Drive manual jika upload gagal
   - Support link dari berbagai sumber (Drive, OneDrive, dll)

3. **Document Verification**
   - Status: pending, approved, rejected
   - Admin dapat verifikasi dokumen dengan catatan
   - Dokumen yang sudah approved akan locked

4. **Authorization**
   - **Employee**: Upload untuk proposal sendiri (status draft/pending)
   - **Admin Unit**: Upload/manage dokumen dari department mereka
   - **Admin Pusat**: Full access ke semua dokumen

## Setup

### 1. Database Migration

Jalankan migration untuk membuat tabel `leave_documents`:

```sql
-- File: add_leave_documents_table.sql
-- Jalankan di Supabase SQL Editor
```

### 2. Deploy Edge Functions

Deploy kedua edge functions ke Supabase:

```bash
# Deploy upload function
supabase functions deploy leave-doc-upload

# Deploy delete function
supabase functions deploy leave-doc-delete
```

### 3. Environment Variables

**Option A: Otomatis dengan CLI Script (RECOMMENDED)**

Gunakan script yang sudah disediakan untuk otomatis copy secrets:

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

**Option B: Manual via Supabase CLI**

```bash
# List secrets dari simpel-lavotas
cd simpel-lavotas
supabase secrets list

# Copy ke sicuti-leave-portal
cd sicuti-leave-portal
supabase secrets set LOVABLE_API_KEY=<copy_value_here>
supabase secrets set GOOGLE_DRIVE_API_KEY=<copy_value_here>
```

**💡 PENTING: Gunakan Secret yang Sama dengan Simpel-Lavotas**

Karena kedua aplikasi menggunakan **Lovable Connector Gateway yang sama**, copy secret dari simpel-lavotas menggunakan salah satu cara di atas.

**Keuntungan menggunakan secret yang sama:**
- ✅ File dari kedua aplikasi tersimpan di Google Drive account yang sama
- ✅ Folder management lebih mudah (semua di satu Drive)
- ✅ Tidak perlu setup connector baru
- ✅ Quota Drive lebih efisien

Detail lengkap: [COPY_SECRETS_FROM_SIMPEL.md](./COPY_SECRETS_FROM_SIMPEL.md)

**Cara mendapatkan keys yang sudah ada dari simpel-lavotas:**

1. **LOVABLE_API_KEY**: 
   - Buka project simpel-lavotas di Supabase
   - Dashboard → Edge Functions → Manage Secrets
   - Copy value dari `LOVABLE_API_KEY`
   - Paste ke sicuti-leave-portal secrets

2. **GOOGLE_DRIVE_API_KEY**:
   - Buka project simpel-lavotas di Supabase
   - Dashboard → Edge Functions → Manage Secrets
   - Copy value dari `GOOGLE_DRIVE_API_KEY`
   - Paste ke sicuti-leave-portal secrets

**Atau jika belum ada (setup pertama kali):**

1. **LOVABLE_API_KEY**: 
   - Login ke Lovable dashboard
   - Buka Settings → API Keys
   - Generate new API key (atau gunakan yang existing)

2. **GOOGLE_DRIVE_API_KEY**:
   - Login ke Lovable dashboard
   - Buka Integrations → Google Drive Connector
   - Link Google account (workspace/personal)
   - Copy connector API key

**Keuntungan menggunakan secret yang sama:**
- ✅ File dari kedua aplikasi tersimpan di Google Drive account yang sama
- ✅ Folder management lebih mudah (semua di satu Drive)
- ✅ Tidak perlu setup connector baru
- ✅ Quota Drive lebih efisien

### 4. Environment Variables Frontend

Tidak ada environment variable yang perlu ditambahkan di frontend. Semua credentials disimpan di Supabase secrets.

## Struktur Folder Google Drive

```
Sicuti Leave Documents/
├── Leave Requests/
│   ├── {department_name}/
│   │   └── {leave_request_id}/
│   │       ├── formulir_cuti.pdf
│   │       └── surat_keterangan.pdf
└── Leave Proposals/
    ├── {department_name}/
    │   └── {leave_proposal_id}/
    │       └── {leave_proposal_item_id}/
    │           ├── formulir_cuti.pdf
    │           └── surat_keterangan.pdf
```

## Database Schema

### Tabel: leave_documents

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| leave_request_id | uuid | Reference ke leave_requests (nullable) |
| leave_proposal_item_id | uuid | Reference ke leave_proposal_items (nullable) |
| slot_code | varchar(64) | Kode slot dokumen (misal: 'formulir_cuti') |
| slot_label | varchar(255) | Label yang ditampilkan |
| file_name | varchar(512) | Nama file asli |
| mime_type | varchar(128) | MIME type file |
| file_size | bigint | Ukuran file dalam bytes |
| drive_file_id | varchar(128) | Google Drive file ID |
| drive_view_url | text | URL untuk view file di Drive |
| external_link | text | Link manual (fallback) |
| verification_status | varchar(24) | Status: pending/approved/rejected |
| verification_note | text | Catatan verifikasi dari admin |
| verified_by_id | uuid | User ID yang verifikasi |
| verified_by_name | varchar(255) | Nama user yang verifikasi |
| verified_at | timestamptz | Timestamp verifikasi |
| uploaded_by_id | uuid | User ID yang upload |
| uploaded_at | timestamptz | Timestamp upload |

**Constraints:**
- UNIQUE (leave_request_id, slot_code)
- UNIQUE (leave_proposal_item_id, slot_code)
- CHECK: Must have either leave_request_id OR leave_proposal_item_id (not both)

## Penggunaan Komponen

### Di Form Pengajuan Cuti Pegawai

```jsx
import { LeaveDocumentUploader } from '@/components/leave_documents/LeaveDocumentUploader';

// Di dalam form component
<LeaveDocumentUploader
  leaveProposalItemId={proposalItemId}
  slot={{
    code: 'formulir_cuti',
    label: 'Formulir Permohonan Cuti',
    required: false,
  }}
  readonly={false}
  onChange={() => refreshDocuments()}
/>
```

### Props LeaveDocumentUploader

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| leaveRequestId | string | No* | ID leave_requests (untuk admin) |
| leaveProposalItemId | string | No* | ID leave_proposal_items (untuk employee) |
| slot | object | Yes | Definisi slot dokumen (code, label, required) |
| document | object | No | Data dokumen yang sudah ada |
| readonly | boolean | No | Mode readonly |
| lockedApproved | boolean | No | Lock dokumen yang sudah approved |
| onChange | function | No | Callback setelah upload/delete |

*Harus ada salah satu: leaveRequestId atau leaveProposalItemId

## Document Slots

Slot dokumen yang tersedia:

1. **formulir_cuti**: Formulir permohonan cuti (opsional)
2. **surat_keterangan**: Surat keterangan pendukung (opsional)

Anda bisa menambah slot baru sesuai kebutuhan dengan menambahkan LeaveDocumentUploader dengan `slot.code` yang berbeda.

## API Endpoints

### Upload Document

**Endpoint**: `/functions/v1/leave-doc-upload`  
**Method**: POST (multipart/form-data)  
**Headers**: `Authorization: Bearer {access_token}`

**Form Data:**
- `leave_request_id` OR `leave_proposal_item_id` (string)
- `slot_code` (string)
- `slot_label` (string)
- `file` (File, max 20MB)

**Response:**
```json
{
  "ok": true,
  "drive_file_id": "1ABC...",
  "drive_view_url": "https://drive.google.com/file/d/1ABC.../view",
  "file_name": "formulir_cuti.pdf"
}
```

### Delete Document

**Endpoint**: `/functions/v1/leave-doc-delete`  
**Method**: POST (JSON)  
**Headers**: 
- `Authorization: Bearer {access_token}`
- `Content-Type: application/json`

**Body:**
```json
{
  "document_id": "uuid"
}
```

**Response:**
```json
{
  "ok": true,
  "message": "Document deleted successfully"
}
```

## Authorization Flow

### Employee
1. Buat pengajuan cuti → dapat `leave_proposal_item_id`
2. Upload dokumen pendukung (status: pending)
3. Admin Unit review dokumen dan proposal

### Admin Unit
1. Terima notifikasi pengajuan cuti dari pegawai di department mereka
2. Review dokumen yang diupload
3. Verifikasi dokumen (approve/reject dengan catatan)
4. Approve/reject/forward proposal

### Admin Pusat
1. Full access ke semua dokumen
2. Dapat verifikasi dan manage semua dokumen
3. Final approval untuk proposal yang di-forward

## Error Handling

### Common Errors

1. **"LOVABLE_API_KEY not configured"**
   - Belum set environment variable di Supabase secrets
   - Run: `supabase secrets set LOVABLE_API_KEY=...`

2. **"GOOGLE_DRIVE_API_KEY not configured"**
   - Connector belum dilink di Lovable dashboard
   - Buka Lovable → Integrations → Google Drive

3. **"File maks 20MB"**
   - File terlalu besar
   - Kompres file atau gunakan external link

4. **"Forbidden"**
   - User tidak memiliki akses
   - Check RLS policies dan role user

5. **"Drive upload failed"**
   - Masalah dengan Google Drive API
   - Check connector status di Lovable dashboard
   - Verify Google account permissions

## Testing

### Test Upload Flow

1. Login sebagai employee
2. Buat pengajuan cuti baru
3. Setelah form disubmit, section "Dokumen Pendukung" akan muncul
4. Click "Upload File ke Google Drive"
5. Pilih file (PDF/JPG/PNG/DOC/DOCX, max 20MB)
6. Tunggu hingga upload selesai
7. File akan muncul dengan status "Menunggu Verifikasi"

### Test External Link

1. Di form yang sama, scroll ke external link input
2. Paste Google Drive link (atau URL lain)
3. Click "Simpan"
4. Link akan tersimpan sebagai fallback

### Test Delete

1. Hover ke dokumen yang sudah diupload
2. Click tombol X (delete)
3. Confirm dialog
4. Dokumen akan dihapus dari Drive dan database

### Test Verification (Admin)

1. Login sebagai admin_unit atau admin_pusat
2. Buka detail proposal/request yang memiliki dokumen
3. Review dokumen yang diupload
4. Update `verification_status` dan `verification_note` via UI admin

## Monitoring

### Check Upload Success

Query dokumen yang baru diupload:

```sql
SELECT 
  id, 
  file_name, 
  drive_file_id, 
  drive_view_url,
  verification_status,
  uploaded_at
FROM leave_documents
WHERE uploaded_at > NOW() - INTERVAL '1 hour'
ORDER BY uploaded_at DESC;
```

### Check Failed Uploads

Dokumen tanpa drive_file_id (mungkin error):

```sql
SELECT 
  id,
  slot_label,
  external_link,
  uploaded_at
FROM leave_documents
WHERE drive_file_id IS NULL
  AND external_link IS NULL
ORDER BY uploaded_at DESC;
```

## Troubleshooting

### Upload Stuck/Hanging
- Check browser console untuk error
- Verify Supabase Edge Function logs
- Test edge function directly via curl

### File Tidak Muncul di Drive
- Check folder permissions di Google Drive
- Verify connector masih active di Lovable
- Check Drive storage quota

### RLS Policy Blocking
- Verify user roles di `user_roles` table
- Check user profile department
- Test dengan service_role untuk bypass RLS

## Security Notes

1. **API Keys**: LOVABLE_API_KEY dan GOOGLE_DRIVE_API_KEY WAJIB disimpan di Supabase secrets, JANGAN di frontend env
2. **File Permissions**: File di-set "anyone with link can view" - pastikan link tidak dibagikan sembarangan
3. **RLS Policies**: Sangat penting untuk authorization - jangan disable
4. **File Size Limit**: 20MB untuk mencegah abuse dan bandwidth issues

## Future Improvements

1. **Thumbnail Preview**: Generate thumbnail untuk PDF/images
2. **Bulk Upload**: Upload multiple files sekaligus
3. **Document Templates**: Template formulir cuti yang bisa didownload
4. **Automatic OCR**: Extract text dari scan dokumen
5. **Digital Signature**: Tanda tangan digital untuk verifikasi dokumen
6. **Audit Log**: Track semua perubahan dokumen
7. **Notification**: Email/push notification saat dokumen diverifikasi

## Support

Jika ada masalah dengan implementasi ini:

1. Check Supabase Edge Function logs
2. Check browser console untuk frontend errors
3. Verify environment variables sudah benar
4. Test dengan Postman/curl untuk isolate frontend issues
5. Check Google Drive connector status di Lovable

---

**Last Updated**: 2026-07-01  
**Version**: 1.0.0
