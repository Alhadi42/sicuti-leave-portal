/**
 * LeaveDocumentUploader
 * 
 * Komponen untuk upload dokumen cuti ke Google Drive.
 * Mirip dengan DocumentSlotUploader di simpel-lavotas, disesuaikan untuk leave documents.
 * 
 * Features:
 * - Upload file ke Google Drive via edge function
 * - Support external link sebagai fallback
 * - Verification status badges (pending/approved/rejected)
 * - Document locking untuk yang sudah disetujui
 * - Delete dokumen
 */

import { useRef, useState } from 'react';
import { Upload, FileText, ExternalLink, X, CheckCircle2, XCircle, Clock, Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

/**
 * @typedef {Object} DocumentSlot
 * @property {string} code - Kode slot (misal: 'formulir_cuti', 'surat_keterangan')
 * @property {string} label - Label yang ditampilkan
 * @property {boolean} [required] - Apakah wajib diisi
 */

/**
 * @typedef {Object} LeaveDocument
 * @property {string} id
 * @property {string} file_name
 * @property {string} drive_view_url
 * @property {string} external_link
 * @property {string} verification_status - 'pending'|'approved'|'rejected'
 * @property {string} verification_note
 */

/**
 * @param {Object} props
 * @param {string} [props.leaveRequestId] - ID leave_requests (untuk admin)
 * @param {string} [props.leaveProposalItemId] - ID leave_proposal_items (untuk employee)
 * @param {DocumentSlot} props.slot - Slot dokumen
 * @param {LeaveDocument} [props.document] - Dokumen yang sudah ada
 * @param {boolean} [props.readonly] - Mode readonly
 * @param {boolean} [props.lockedApproved] - Dokumen sudah disetujui (locked)
 * @param {Function} [props.onChange] - Callback setelah upload/delete
 */
export function LeaveDocumentUploader({
  leaveRequestId,
  leaveProposalItemId,
  slot,
  document,
  readonly = false,
  lockedApproved = false,
  onChange,
}) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [linkInput, setLinkInput] = useState(document?.external_link ?? '');
  const [deleting, setDeleting] = useState(false);
  const [savingLink, setSavingLink] = useState(false);
  const fileRef = useRef(null);

  const verStatus = document?.verification_status ?? 'pending';
  const effectiveReadonly = readonly || lockedApproved;

  async function handleFile(file) {
    if (file.size > MAX_FILE_SIZE) {
      toast({ title: 'File terlalu besar (max 20MB)', variant: 'destructive' });
      return;
    }
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast({ 
        title: 'Format file tidak didukung', 
        description: 'Hanya PDF, JPG, PNG, DOC, DOCX yang diperbolehkan',
        variant: 'destructive' 
      });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      if (leaveRequestId) formData.append('leave_request_id', leaveRequestId);
      if (leaveProposalItemId) formData.append('leave_proposal_item_id', leaveProposalItemId);
      formData.append('slot_code', slot.code);
      formData.append('slot_label', slot.label);
      formData.append('file', file);

      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/leave-doc-upload`;
      
      const resp = await fetch(url, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text || `HTTP ${resp.status}`);
      }

      const result = await resp.json();
      toast({ title: `Dokumen "${slot.label}" berhasil diunggah` });
      onChange?.();
    } catch (error) {
      console.error('Upload error:', error);
      toast({ 
        title: 'Gagal upload', 
        description: error.message || 'Terjadi kesalahan',
        variant: 'destructive' 
      });
    } finally {
      setUploading(false);
    }
  }

  async function handleSaveLink() {
    if (!linkInput.trim()) {
      toast({ title: 'Link tidak boleh kosong', variant: 'destructive' });
      return;
    }

    try {
      new URL(linkInput.trim());
    } catch {
      toast({ title: 'URL tidak valid', variant: 'destructive' });
      return;
    }

    setSavingLink(true);
    try {
      const docData = {
        slot_code: slot.code,
        slot_label: slot.label,
        external_link: linkInput.trim(),
        verification_status: 'pending',
      };

      if (leaveRequestId) {
        docData.leave_request_id = leaveRequestId;
      } else if (leaveProposalItemId) {
        docData.leave_proposal_item_id = leaveProposalItemId;
      }

      const { error } = await supabase
        .from('leave_documents')
        .upsert(docData, {
          onConflict: leaveRequestId ? 'leave_request_id,slot_code' : 'leave_proposal_item_id,slot_code',
        });

      if (error) throw error;

      toast({ title: 'Link dokumen berhasil disimpan' });
      onChange?.();
    } catch (error) {
      console.error('Save link error:', error);
      toast({ 
        title: 'Gagal menyimpan link', 
        description: error.message,
        variant: 'destructive' 
      });
    } finally {
      setSavingLink(false);
    }
  }

  async function handleDelete() {
    if (!document) return;
    if (!confirm('Hapus dokumen ini?')) return;

    setDeleting(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/leave-doc-delete`;
      
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ document_id: document.id }),
      });

      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text || `HTTP ${resp.status}`);
      }

      toast({ title: 'Dokumen berhasil dihapus' });
      onChange?.();
    } catch (error) {
      console.error('Delete error:', error);
      toast({ 
        title: 'Gagal menghapus', 
        description: error.message,
        variant: 'destructive' 
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="rounded-lg border p-3 sm:p-4 space-y-3 bg-card">
      {/* Header dengan label dan status badge */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {lockedApproved ? (
            <Lock className="h-4 w-4 text-green-600" />
          ) : (
            <FileText className="h-4 w-4 text-muted-foreground" />
          )}
          <Label className="text-sm font-medium">
            {slot.label}
            {slot.required && <span className="text-destructive ml-1">*</span>}
          </Label>
        </div>
        {document && (
          <Badge
            variant={
              verStatus === 'approved' 
                ? 'default' 
                : verStatus === 'rejected' 
                ? 'destructive' 
                : 'secondary'
            }
            className={verStatus === 'approved' ? 'bg-green-600 hover:bg-green-600/90' : ''}
          >
            {verStatus === 'approved' && <CheckCircle2 className="mr-1 h-3 w-3" />}
            {verStatus === 'rejected' && <XCircle className="mr-1 h-3 w-3" />}
            {verStatus === 'pending' && <Clock className="mr-1 h-3 w-3" />}
            {verStatus === 'approved' 
              ? 'Lulus Verifikasi' 
              : verStatus === 'rejected' 
              ? 'Perlu Diperbaiki' 
              : 'Menunggu Verifikasi'}
          </Badge>
        )}
      </div>

      {/* Locked info */}
      {lockedApproved && (
        <div className="rounded bg-green-50 dark:bg-green-950/30 p-2 text-xs text-green-700 dark:text-green-300 flex items-center gap-2">
          <Lock className="h-3 w-3" /> Sudah disetujui sebelumnya — tidak perlu diubah.
        </div>
      )}

      {/* Verification note jika ditolak */}
      {document?.verification_note && verStatus === 'rejected' && (
        <div className="rounded bg-destructive/10 p-2 text-xs text-destructive">
          <strong>Catatan verifikasi:</strong> {document.verification_note}
        </div>
      )}

      {/* Document info jika sudah ada */}
      {document && (document.drive_view_url || document.external_link) ? (
        <div className="flex flex-wrap items-center gap-2 rounded bg-muted/40 p-2 text-xs">
          <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="truncate flex-1 min-w-0">
            {document.file_name ?? document.external_link}
          </span>
          <a
            href={document.drive_view_url ?? document.external_link ?? '#'}
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:underline inline-flex items-center gap-1"
          >
            <ExternalLink className="h-3 w-3" /> Buka
          </a>
          {!effectiveReadonly && (
            <Button 
              type="button" 
              size="sm" 
              variant="ghost" 
              onClick={handleDelete} 
              disabled={deleting}
            >
              {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
            </Button>
          )}
        </div>
      ) : (
        !effectiveReadonly && (
          <div className="space-y-2">
            {/* Upload button */}
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = '';
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-full"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                  Mengunggah ke Drive…
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" /> 
                  Upload File ke Google Drive
                </>
              )}
            </Button>

            {/* External link input */}
            <div className="text-xs text-center text-muted-foreground">atau</div>
            <div className="flex gap-2">
              <Input
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                placeholder="Tempel link Google Drive atau URL lainnya"
                className="text-xs h-9"
                disabled={savingLink}
              />
              <Button 
                type="button" 
                size="sm" 
                variant="secondary" 
                onClick={handleSaveLink}
                disabled={savingLink || !linkInput.trim()}
              >
                {savingLink ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Simpan'}
              </Button>
            </div>
          </div>
        )
      )}
    </div>
  );
}
