// Edge function: hapus dokumen cuti dari Google Drive dan database
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const GATEWAY = 'https://connector-gateway.lovable.dev/google_drive';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function driveDelete(fileId: string): Promise<void> {
  const lovableKey = Deno.env.get('LOVABLE_API_KEY');
  const driveKey = Deno.env.get('GOOGLE_DRIVE_API_KEY');
  if (!lovableKey || !driveKey) return; // best-effort
  await fetch(`${GATEWAY}/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      'X-Connection-Api-Key': driveKey,
    },
  }).catch(() => undefined);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  try {
    const auth = req.headers.get('Authorization');
    if (!auth) return json({ error: 'unauthorized' }, 401);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: auth } },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) return json({ error: 'unauthorized' }, 401);

    const { document_id } = await req.json();
    if (!document_id) return json({ error: 'document_id required' }, 400);

    const svc = createClient(supabaseUrl, serviceKey);
    
    // Get document info
    const { data: doc, error: fetchErr } = await svc
      .from('leave_documents')
      .select('id, drive_file_id, leave_request_id, leave_proposal_item_id')
      .eq('id', document_id)
      .maybeSingle();
    
    if (fetchErr) return json({ error: fetchErr.message }, 500);
    if (!doc) return json({ error: 'not found' }, 404);

    // Get user roles
    const { data: rolesRows } = await svc
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id);
    const roles = (rolesRows ?? []).map((r: { role: string }) => r.role);
    const isAdminPusat = roles.includes('admin_pusat');

    // Authorization check
    if (!isAdminPusat) {
      const { data: profile } = await svc
        .from('profiles')
        .select('department')
        .eq('id', userData.user.id)
        .maybeSingle();
      
      const isAdminUnit = roles.includes('admin_unit');
      const isEmployee = roles.includes('employee');
      
      let authorized = false;
      let department = '';

      // Check based on leave_request_id or leave_proposal_item_id
      if (doc.leave_request_id) {
        const { data: leaveRequest } = await svc
          .from('leave_requests')
          .select('employees(department)')
          .eq('id', doc.leave_request_id)
          .maybeSingle();
        department = leaveRequest?.employees?.department || '';
        
        // Only admin_unit from same department can delete
        authorized = isAdminUnit && profile && String(profile.department) === String(department);
      } else if (doc.leave_proposal_item_id) {
        const { data: proposalItem } = await svc
          .from('leave_proposal_items')
          .select('leave_proposals(proposer_id, proposer_unit, status)')
          .eq('id', doc.leave_proposal_item_id)
          .maybeSingle();
        
        const proposal = proposalItem?.leave_proposals;
        department = proposal?.proposer_unit || '';
        
        if (isEmployee) {
          // Employee can delete their own proposal documents if draft/pending
          authorized = String(proposal?.proposer_id) === String(userData.user.id) &&
                      ['draft', 'pending'].includes(proposal?.status || '');
        } else if (isAdminUnit) {
          // Admin unit can delete if same department
          authorized = profile && String(profile.department) === String(department);
        }
      }

      if (!authorized) {
        return json({ error: 'forbidden' }, 403);
      }
    }

    // Delete from Google Drive (best effort)
    if (doc.drive_file_id) {
      await driveDelete(doc.drive_file_id);
    }

    // Delete from database
    const { error: delErr } = await svc
      .from('leave_documents')
      .delete()
      .eq('id', document_id);
    
    if (delErr) return json({ error: delErr.message }, 500);

    return json({ ok: true, message: 'Document deleted successfully' });
  } catch (e) {
    console.error('[leave-doc-delete]', e);
    return json({ error: String(e) }, 500);
  }
});
