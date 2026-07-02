/**
 * LeaveDocumentUploader
 * 
 * Komponen untuk melampirkan link dokumen cuti (Google Drive, Dropbox, dll).
 * 
 * Features:
 * - Simpan link eksternal (Google Drive, Dropbox, Cloud Storage)
 * - Verification status badges (pending/approved/rejected)
 * - Document locking untuk yang sudah disetujui
 * - Hapus lampiran
 */

import { useState } from 'react';
import { FileText, ExternalLink, X, CheckCircle2, XCircle, Clock, Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';

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
  const [linkInput, setLinkInput] = useState(document?.external_link ?? '');
  const [deleting, setDeleting] = useState(false);
  const [savingLink, setSavingLink] = useState(false);

  const verStatus = document?.verification_status ?? 'pending';
  const effectiveReadonly = readonly || lockedApproved;

  async function handleSaveLink() {
    if (!linkInput.trim()) {
      toast({ title: 'Link tidak boleh kosong', variant: 'destructive' });
      return;
    }

    try {
      new URL(linkInput.trim());
    } catch {
      toast({ title: 'URL tidak valid. Pastikan diawali dengan http:// atau https://', variant: 'destructive' });
      return;
    }

    setSavingLink(true);
    try {
      const docData = {
        slot_code: slot.code,
        slot_label: slot.label,
        external_link: linkInput.trim(),
        verification_status: 'pending',
        file_name: 'Link Lampiran',
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
    if (!confirm('Hapus lampiran ini?')) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('leave_documents')
        .delete()
        .eq('id', document.id);

      if (error) throw error;

      toast({ title: 'Lampiran berhasil dihapus' });
      setLinkInput('');
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
    <div className="rounded-md border border-slate-600 bg-slate-700 p-3 space-y-3">
      {/* Locked info */}
      {lockedApproved && (
        <div className="rounded bg-green-900/30 p-2 text-xs text-green-300 flex items-center gap-2">
          <Lock className="h-3 w-3" /> Sudah disetujui sebelumnya — tidak perlu diubah.
        </div>
      )}

      {/* Verification note jika ditolak */}
      {document?.verification_note && verStatus === 'rejected' && (
        <div className="rounded bg-red-900/30 p-2 text-xs text-red-300">
          <strong>Catatan verifikasi:</strong> {document.verification_note}
        </div>
      )}

      {/* Status badge jika ada dokumen */}
      {document && (
        <div className="flex items-center gap-2">
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
        </div>
      )}

      {/* Document info jika sudah ada */}
      {document && (document.drive_view_url || document.external_link) ? (
        <div className="flex flex-wrap items-center gap-2 rounded bg-slate-600/50 p-2 text-xs text-white">
          <FileText className="h-4 w-4 text-slate-300 flex-shrink-0" />
          <span className="truncate flex-1 min-w-0">
            {document.external_link ?? document.file_name}
          </span>
          <a
            href={document.external_link ?? document.drive_view_url ?? '#'}
            target="_blank"
            rel="noreferrer"
            className="text-blue-400 hover:text-blue-300 hover:underline inline-flex items-center gap-1"
          >
            <ExternalLink className="h-3 w-3" /> Buka Link
          </a>
          {!effectiveReadonly && (
            <Button 
              type="button" 
              size="sm" 
              variant="ghost" 
              onClick={handleDelete} 
              disabled={deleting}
              className="h-6 w-6 p-0 text-slate-300 hover:text-white hover:bg-slate-600"
            >
              {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
            </Button>
          )}
        </div>
      ) : (
        !effectiveReadonly && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                placeholder="Tempel link Google Drive / Dropbox / Cloud Storage"
                className="text-xs h-9 bg-slate-600 border-slate-500 text-white placeholder:text-slate-400"
                disabled={savingLink}
              />
              <Button 
                type="button" 
                size="sm" 
                variant="secondary" 
                onClick={handleSaveLink}
                disabled={savingLink || !linkInput.trim()}
                className="bg-slate-600 hover:bg-slate-500 text-white border-slate-500"
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
