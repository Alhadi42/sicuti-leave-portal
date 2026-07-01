# Document Upload di Semua Form Pengajuan Cuti

## Status: ✅ SELESAI

Fitur upload dokumen pendukung cuti kini tersedia di **SEMUA** form pengajuan cuti di aplikasi SiCuti.

---

## 📋 Forms yang Sudah Diintegrasikan

### 1. **EmployeeLeaveRequestForm** (Role: Employee)
- **Path**: `src/components/leave_proposals/EmployeeLeaveRequestForm.jsx`
- **Digunakan di**: Menu "Usulan Cuti" untuk pegawai
- **Upload ke**: `leave_proposal_items` (via `leave_proposal_item_id`)
- **Status**: ✅ Sudah ada sebelumnya (referensi implementasi)

### 2. **LeaveRequestForm** (Role: Admin Unit / Admin Pusat)
- **Path**: `src/components/leave_requests/LeaveRequestForm.jsx`
- **Digunakan di**: Menu "Data Cuti" untuk pengajuan cuti langsung oleh admin
- **Upload ke**: `leave_requests` (via `leave_request_id`)
- **Status**: ✅ **BARU DITAMBAHKAN**

### 3. **LeaveProposalForm** (Role: Admin Unit / Admin Pusat)
- **Path**: `src/components/leave_proposals/LeaveProposalForm.jsx`
- **Digunakan di**: Menu "Usulan Cuti" untuk batch proposal (banyak pegawai sekaligus)
- **Upload ke**: `leave_proposal_items` (via `leave_proposal_item_id`)
- **Status**: ✅ **BARU DITAMBAHKAN**

---

## 🎯 Fitur Dokumen Upload

### Document Slots
Setiap pengajuan cuti dapat melampirkan 2 jenis dokumen:

1. **Formulir Permohonan Cuti** (`formulir_cuti`)
   - Formulir resmi permohonan cuti
   - Format: PDF, JPG, PNG, DOC, DOCX
   - Max size: 20MB

2. **Surat Keterangan Pendukung** (`surat_keterangan`)
   - Surat keterangan dokter, undangan, dll
   - Format: PDF, JPG, PNG, DOC, DOCX
   - Max size: 20MB
   - Opsional

### Upload Methods
- **Upload File**: Upload langsung ke Google Drive via Edge Function
- **External Link**: Paste link Google Drive atau URL lain sebagai fallback

### Verification Status
Setiap dokumen memiliki status verifikasi:
- 🕐 **Pending**: Menunggu verifikasi
- ✅ **Approved**: Sudah diverifikasi dan disetujui
- ❌ **Rejected**: Ditolak, perlu diperbaiki (dengan catatan)

---

## 🔄 Alur Penggunaan

### A. LeaveRequestForm (Admin)

```
1. Admin mengisi form pengajuan cuti
2. Admin klik "Simpan Data Cuti"
3. ✅ Data cuti tersimpan
4. 📄 Section "Dokumen Pendukung" muncul
5. Admin upload dokumen (opsional):
   - Formulir Permohonan Cuti
   - Surat Keterangan Pendukung
6. Admin klik "Selesai"
```

**Catatan**: 
- Jika EDIT mode, form langsung tertutup setelah update (tidak ada document upload)
- Document upload hanya muncul saat CREATE mode (data baru)

### B. LeaveProposalForm (Batch - Admin)

```
1. Admin memilih pegawai dan isi detail cuti
2. Admin klik "Tambah Pegawai ke Usulan" (bisa multiple)
3. Admin review daftar pegawai
4. Admin klik "Kirim Usulan (X pegawai)"
5. ✅ Usulan tersimpan
6. 📄 Section "Dokumen Pendukung" muncul untuk SETIAP pegawai
7. Admin upload dokumen untuk masing-masing pegawai (opsional)
8. Admin klik "Selesai"
```

### C. EmployeeLeaveRequestForm (Employee)

```
1. Pegawai isi form pengajuan cuti
2. Pegawai klik "Kirim Pengajuan Cuti"
3. ✅ Pengajuan tersimpan
4. 📄 Section "Dokumen Pendukung" muncul
5. Pegawai upload dokumen (opsional)
6. Pegawai klik "Selesai"
```

---

## 💻 Implementasi Teknis

### State Management

#### LeaveRequestForm
```javascript
// Document upload state
const [leaveRequestId, setLeaveRequestId] = useState(null);
const [documentsRefresh, setDocumentsRefresh] = useState(0);
```

#### LeaveProposalForm
```javascript
// Document upload state (for created proposal items)
const [createdProposalItemIds, setCreatedProposalItemIds] = useState([]);
const [documentsRefresh, setDocumentsRefresh] = useState(0);
```

### After Submit Logic

#### LeaveRequestForm
```javascript
// CREATE MODE: Insert new request and update balance
const { data: insertedRequest, error: insertError } = await supabase
  .from("leave_requests")
  .insert([dataToSubmit])
  .select("id")
  .single();

// Store leave request ID for document upload
if (insertedRequest?.id) {
  setLeaveRequestId(insertedRequest.id);
}

// Show success message
toast({
  title: "✅ Data Cuti Ditambahkan",
  description: "Data cuti berhasil ditambahkan. Anda dapat melampirkan dokumen pendukung di bawah (opsional).",
});

// Stay on form (don't call onSubmitSuccess) to allow document upload
```

#### LeaveProposalForm
```javascript
const result = await onSubmit(sanitizedData);

// Store created proposal item IDs for document upload
if (result && result.leave_proposal_items && result.leave_proposal_items.length > 0) {
  setCreatedProposalItemIds(result.leave_proposal_items.map(item => item.id));
  
  toast({ 
    title: "Usulan Berhasil Dibuat", 
    description: "Usulan cuti berhasil dibuat. Anda dapat melampirkan dokumen pendukung untuk setiap pegawai di bawah (opsional)."
  });
  
  // Don't clear form or close modal - allow document upload
}
```

### Document Upload UI

#### Single Employee (LeaveRequestForm)
```jsx
{leaveRequestId && (
  <div className="space-y-3 px-4 pb-4">
    <div className="border-t border-slate-700 pt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-slate-200">Dokumen Pendukung</h3>
        <Badge variant="outline">Opsional</Badge>
      </div>
      <div className="bg-blue-900/20 border border-blue-700/40 rounded p-3 mb-4">
        💡 Upload dokumen pendukung untuk pengajuan cuti ini (opsional).
      </div>
    </div>

    <LeaveDocumentUploader
      leaveRequestId={leaveRequestId}
      slot={{ code: 'formulir_cuti', label: 'Formulir Permohonan Cuti', required: false }}
      readonly={false}
      onChange={() => setDocumentsRefresh(prev => prev + 1)}
    />

    <LeaveDocumentUploader
      leaveRequestId={leaveRequestId}
      slot={{ code: 'surat_keterangan', label: 'Surat Keterangan Pendukung', required: false }}
      readonly={false}
      onChange={() => setDocumentsRefresh(prev => prev + 1)}
    />
  </div>
)}
```

#### Multiple Employees (LeaveProposalForm)
```jsx
{createdProposalItemIds.length > 0 && (
  <Card className="bg-slate-800/50 border-slate-700/50">
    <CardHeader>
      <CardTitle>Dokumen Pendukung</CardTitle>
    </CardHeader>
    <CardContent className="space-y-6">
      {createdProposalItemIds.map((itemId, index) => {
        const employee = selectedEmployees[index];
        
        return (
          <div key={itemId} className="space-y-3 p-4 bg-slate-700/20 rounded-lg">
            <div className="flex items-center gap-3 pb-3 border-b">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
                <span>{employee.employee_name?.charAt(0)}</span>
              </div>
              <div>
                <h4>{employee.employee_name}</h4>
                <p>{employee.employee_nip}</p>
              </div>
            </div>

            <LeaveDocumentUploader
              leaveProposalItemId={itemId}
              slot={{ code: 'formulir_cuti', label: 'Formulir Permohonan Cuti', required: false }}
              readonly={false}
              onChange={() => setDocumentsRefresh(prev => prev + 1)}
            />

            <LeaveDocumentUploader
              leaveProposalItemId={itemId}
              slot={{ code: 'surat_keterangan', label: 'Surat Keterangan Pendukung', required: false }}
              readonly={false}
              onChange={() => setDocumentsRefresh(prev => prev + 1)}
            />
          </div>
        );
      })}
    </CardContent>
  </Card>
)}
```

### Button State Management

Tombol berubah dari "Simpan/Kirim" menjadi "Selesai" setelah dokumen ditampilkan:

```jsx
{leaveRequestId ? (
  <Button onClick={onCancel}>Selesai</Button>
) : (
  <Button type="submit" disabled={isSubmitting}>
    Simpan Data Cuti
  </Button>
)}
```

---

## 🗄️ Database Schema

### Table: `leave_documents`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `leave_request_id` | uuid | FK to leave_requests (nullable) |
| `leave_proposal_item_id` | uuid | FK to leave_proposal_items (nullable) |
| `slot_code` | text | 'formulir_cuti' atau 'surat_keterangan' |
| `slot_label` | text | Label display untuk slot |
| `file_name` | text | Nama file asli |
| `drive_file_id` | text | Google Drive file ID |
| `drive_view_url` | text | URL untuk view di Drive |
| `external_link` | text | Fallback link eksternal |
| `verification_status` | text | 'pending', 'approved', 'rejected' |
| `verification_note` | text | Catatan verifikasi |
| `uploaded_by` | uuid | User yang upload |
| `uploaded_at` | timestamp | Waktu upload |

**Constraints**:
- Unique: (`leave_request_id`, `slot_code`) OR (`leave_proposal_item_id`, `slot_code`)
- Check: Salah satu dari `leave_request_id` atau `leave_proposal_item_id` harus diisi

---

## 🔌 Edge Functions

### 1. `leave-doc-upload`
**Endpoint**: `/functions/v1/leave-doc-upload`

**Method**: POST (multipart/form-data)

**Parameters**:
- `file`: File upload (required)
- `leave_request_id`: ID leave_requests (optional)
- `leave_proposal_item_id`: ID leave_proposal_items (optional)
- `slot_code`: Kode slot dokumen (required)
- `slot_label`: Label slot dokumen (required)

**Process**:
1. Validate file (type, size)
2. Upload to Google Drive via Lovable Connector Gateway
3. Save metadata to `leave_documents` table
4. Return success with document info

### 2. `leave-doc-delete`
**Endpoint**: `/functions/v1/leave-doc-delete`

**Method**: POST (application/json)

**Parameters**:
- `document_id`: ID dokumen yang akan dihapus (required)

**Process**:
1. Get document info from database
2. Delete file from Google Drive
3. Delete record from `leave_documents` table
4. Return success

---

## 🔑 Environment Variables

Shared secrets dari aplikasi `simpel-lavotas`:

```env
# Google Drive Integration
LOVABLE_API_KEY=lova_****
GOOGLE_DRIVE_API_KEY=AIza****
GOOGLE_DRIVE_FOLDER_ID=1****
```

Secrets ini sudah di-copy dari project `simpel-lavotas` ke `sicuti-leave-portal` menggunakan script `copy-secrets-direct.ps1`.

---

## ✅ Testing Checklist

### LeaveRequestForm (Admin)
- [x] Form bisa diisi dengan lengkap
- [x] Submit berhasil menyimpan data ke `leave_requests`
- [x] Section dokumen muncul setelah submit
- [x] Upload file berhasil ke Google Drive
- [x] External link bisa disimpan
- [x] Dokumen bisa dihapus
- [x] Tombol berubah jadi "Selesai"
- [x] Klik "Selesai" menutup form

### LeaveProposalForm (Batch - Admin)
- [x] Bisa tambah multiple pegawai
- [x] Submit berhasil membuat proposal
- [x] Section dokumen muncul untuk setiap pegawai
- [x] Upload dokumen untuk pegawai pertama
- [x] Upload dokumen untuk pegawai kedua
- [x] Dokumen tersimpan dengan `leave_proposal_item_id` yang benar
- [x] Tombol berubah jadi "Selesai"

### EmployeeLeaveRequestForm (Employee)
- [x] Form sudah punya document upload (existing)
- [x] Upload berhasil via `leave_proposal_item_id`
- [x] Dokumen bisa diakses oleh admin untuk verifikasi

---

## 📝 User Guide

### Untuk Admin Unit / Admin Pusat

#### Mengajukan Cuti Pegawai Langsung

1. Masuk ke menu **Data Cuti**
2. Klik tombol **+ Tambah Data Cuti**
3. Isi form pengajuan:
   - Pilih pegawai
   - Pilih jenis cuti
   - Isi tanggal mulai & selesai
   - Isi detail lainnya
4. Klik **Simpan Data Cuti**
5. **BARU!** Setelah disimpan, akan muncul section **Dokumen Pendukung**
6. Upload dokumen (opsional):
   - **Formulir Permohonan Cuti**: Upload file atau paste link
   - **Surat Keterangan Pendukung**: Upload file atau paste link (opsional)
7. Klik **Selesai** untuk menutup form

#### Membuat Usulan Cuti Batch (Banyak Pegawai)

1. Masuk ke menu **Usulan Cuti**
2. Klik **Buat Usulan Cuti**
3. Isi judul usulan & catatan
4. Tambah pegawai satu per satu:
   - Pilih pegawai
   - Isi detail cuti
   - Klik **Tambah Pegawai ke Usulan**
5. Ulangi untuk pegawai lain (jika batch)
6. Klik **Kirim Usulan (X pegawai)**
7. **BARU!** Setelah tersimpan, akan muncul section dokumen untuk **setiap pegawai**
8. Upload dokumen untuk masing-masing pegawai (opsional)
9. Klik **Selesai**

### Untuk Pegawai

1. Masuk ke menu **Usulan Cuti**
2. Klik **Ajukan Cuti Baru**
3. Isi form pengajuan cuti
4. Klik **Kirim Pengajuan Cuti**
5. Setelah tersimpan, muncul section **Dokumen Pendukung**
6. Upload dokumen pendukung (opsional)
7. Klik **Selesai**

---

## 🎉 Benefit

### Sebelumnya
- ❌ Hanya form employee yang bisa upload dokumen
- ❌ Admin tidak bisa upload dokumen saat membuat cuti langsung
- ❌ Batch proposal tidak support dokumen
- ❌ Dokumen cuti harus dikirim terpisah (email, WhatsApp)

### Sekarang
- ✅ **SEMUA** form pengajuan cuti support upload dokumen
- ✅ Admin bisa upload dokumen untuk cuti yang dibuatkan
- ✅ Batch proposal bisa upload dokumen per pegawai
- ✅ Dokumen terintegrasi dengan Google Drive
- ✅ Status verifikasi dokumen tracked di sistem
- ✅ Dokumen dapat diakses kapan saja dari aplikasi

---

## 🚀 Deployment

### Changes Committed
```bash
git commit -m "feat: add document upload to all leave request forms"
git push origin main
```

### Files Modified
1. `src/components/leave_requests/LeaveRequestForm.jsx`
2. `src/components/leave_proposals/LeaveProposalForm.jsx`

### No Migration Required
Database schema sudah ada (dari implementasi sebelumnya di EmployeeLeaveRequestForm).

---

## 📚 References

- **EmployeeLeaveRequestForm**: Implementasi referensi pertama
- **LeaveDocumentUploader**: Component reusable untuk upload
- **Google Drive Integration Guide**: `GOOGLE_DRIVE_INTEGRATION_GUIDE.md`
- **Edge Functions**: `supabase/functions/leave-doc-upload/` dan `leave-doc-delete/`

---

**✅ FEATURE COMPLETE**

Semua form pengajuan cuti di aplikasi SiCuti kini mendukung upload dokumen pendukung secara opsional!
