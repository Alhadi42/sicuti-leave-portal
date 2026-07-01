-- Create table for leave request documents (integrated with Google Drive)
-- Simplified version without RLS policies (will be added later)

CREATE TABLE IF NOT EXISTS public.leave_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Reference to leave request or proposal
  leave_request_id uuid REFERENCES public.leave_requests(id) ON DELETE CASCADE,
  leave_proposal_item_id uuid REFERENCES public.leave_proposal_items(id) ON DELETE CASCADE,
  
  -- Document slot identifier
  slot_code varchar(64) NOT NULL,
  slot_label varchar(255),
  
  -- File metadata
  file_name varchar(512),
  mime_type varchar(128),
  file_size bigint,
  
  -- Google Drive integration
  drive_file_id varchar(128),
  drive_view_url text,
  external_link text, -- fallback for manual Drive links
  
  -- Verification status
  verification_status varchar(24) NOT NULL DEFAULT 'pending', -- pending|approved|rejected
  verification_note text,
  verified_by_id uuid,
  verified_by_name varchar(255),
  verified_at timestamptz,
  
  -- Audit fields
  uploaded_by_id uuid,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  
  -- Ensure one document per slot per request/proposal
  CONSTRAINT unique_leave_request_slot UNIQUE (leave_request_id, slot_code),
  CONSTRAINT unique_proposal_item_slot UNIQUE (leave_proposal_item_id, slot_code),
  
  -- Must have either leave_request_id or leave_proposal_item_id
  CONSTRAINT check_has_parent CHECK (
    (leave_request_id IS NOT NULL AND leave_proposal_item_id IS NULL) OR
    (leave_request_id IS NULL AND leave_proposal_item_id IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_leave_documents_request ON public.leave_documents(leave_request_id);
CREATE INDEX IF NOT EXISTS idx_leave_documents_proposal_item ON public.leave_documents(leave_proposal_item_id);
CREATE INDEX IF NOT EXISTS idx_leave_documents_uploaded_by ON public.leave_documents(uploaded_by_id);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leave_documents TO authenticated;
GRANT ALL ON public.leave_documents TO service_role;

-- Enable RLS (policies will be added later when user_roles table exists)
ALTER TABLE public.leave_documents ENABLE ROW LEVEL SECURITY;

-- Temporary policy: Allow service_role full access
CREATE POLICY "Service role all access" 
  ON public.leave_documents 
  FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- Temporary policy: Allow authenticated users to manage their own documents
CREATE POLICY "Authenticated users can manage documents"
  ON public.leave_documents 
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add comment
COMMENT ON TABLE public.leave_documents IS 'Stores leave request/proposal documents with Google Drive integration';
