-- Create table for leave request documents (integrated with Google Drive)
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
CREATE INDEX idx_leave_documents_request ON public.leave_documents(leave_request_id);
CREATE INDEX idx_leave_documents_proposal_item ON public.leave_documents(leave_proposal_item_id);
CREATE INDEX idx_leave_documents_uploaded_by ON public.leave_documents(uploaded_by_id);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leave_documents TO authenticated;
GRANT ALL ON public.leave_documents TO service_role;

-- Enable RLS
ALTER TABLE public.leave_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Admin pusat can access all documents
CREATE POLICY "Admin pusat all access leave_documents"
  ON public.leave_documents FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin_pusat'
    )
  );

-- Admin unit can access documents from their department
CREATE POLICY "Admin unit access own dept leave_documents"
  ON public.leave_documents FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      INNER JOIN public.profiles p ON p.id = auth.uid()
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin_unit'
      AND (
        -- For leave_requests
        (leave_documents.leave_request_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.leave_requests lr
          INNER JOIN public.employees e ON e.id = lr.employee_id
          WHERE lr.id = leave_documents.leave_request_id
          AND e.department = p.department
        ))
        OR
        -- For leave_proposal_items
        (leave_documents.leave_proposal_item_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.leave_proposal_items lpi
          INNER JOIN public.leave_proposals lp ON lp.id = lpi.leave_proposal_id
          WHERE lpi.id = leave_documents.leave_proposal_item_id
          AND lp.proposer_unit = p.department
        ))
      )
    )
  );

-- Admin unit can insert/update/delete documents from their department
CREATE POLICY "Admin unit modify own dept leave_documents"
  ON public.leave_documents FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      INNER JOIN public.profiles p ON p.id = auth.uid()
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin_unit'
      AND (
        (leave_documents.leave_request_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.leave_requests lr
          INNER JOIN public.employees e ON e.id = lr.employee_id
          WHERE lr.id = leave_documents.leave_request_id
          AND e.department = p.department
        ))
        OR
        (leave_documents.leave_proposal_item_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.leave_proposal_items lpi
          INNER JOIN public.leave_proposals lp ON lp.id = lpi.leave_proposal_id
          WHERE lpi.id = leave_documents.leave_proposal_item_id
          AND lp.proposer_unit = p.department
        ))
      )
    )
  );

-- Employees can view documents for their own leave proposals
CREATE POLICY "Employee view own leave_documents"
  ON public.leave_documents FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'employee'
      AND (
        (leave_documents.leave_proposal_item_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.leave_proposal_items lpi
          INNER JOIN public.leave_proposals lp ON lp.id = lpi.leave_proposal_id
          WHERE lpi.id = leave_documents.leave_proposal_item_id
          AND lp.proposer_id::text = auth.uid()::text
        ))
      )
    )
  );

-- Employees can upload documents for their own proposals (pending approval)
CREATE POLICY "Employee upload own proposal leave_documents"
  ON public.leave_documents FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'employee'
      AND leave_documents.leave_proposal_item_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.leave_proposal_items lpi
        INNER JOIN public.leave_proposals lp ON lp.id = lpi.leave_proposal_id
        WHERE lpi.id = leave_documents.leave_proposal_item_id
        AND lp.proposer_id::text = auth.uid()::text
        AND lp.status IN ('draft', 'pending')
      )
    )
  );

-- Employees can update/delete their own proposal documents (if status is draft/pending)
CREATE POLICY "Employee modify own proposal leave_documents"
  ON public.leave_documents FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'employee'
      AND leave_documents.leave_proposal_item_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.leave_proposal_items lpi
        INNER JOIN public.leave_proposals lp ON lp.id = lpi.leave_proposal_id
        WHERE lpi.id = leave_documents.leave_proposal_item_id
        AND lp.proposer_id::text = auth.uid()::text
        AND lp.status IN ('draft', 'pending')
      )
    )
  );

CREATE POLICY "Employee delete own proposal leave_documents"
  ON public.leave_documents FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'employee'
      AND leave_documents.leave_proposal_item_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.leave_proposal_items lpi
        INNER JOIN public.leave_proposals lp ON lp.id = lpi.leave_proposal_id
        WHERE lpi.id = leave_documents.leave_proposal_item_id
        AND lp.proposer_id::text = auth.uid()::text
        AND lp.status IN ('draft', 'pending')
      )
    )
  );

-- Add comment
COMMENT ON TABLE public.leave_documents IS 'Stores leave request/proposal documents with Google Drive integration';
