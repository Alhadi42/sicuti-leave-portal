-- Fix SSO RLS Policies for SiCuti

-- Helper functions (already exist but let's ensure they're there
CREATE OR REPLACE FUNCTION public.auth_app_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    auth.jwt() -> 'user_metadata' ->> 'role',
    'employee'
  );
$$;

CREATE OR REPLACE FUNCTION public.auth_department()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.jwt() -> 'user_metadata' ->> 'department';
$$;

CREATE OR REPLACE FUNCTION public.auth_employee_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NULLIF(auth.jwt() -> 'user_metadata' ->> 'employee_id', '')::uuid;
$$;

-- =============================================
-- LEAVE_BALANCES RLS POLICIES
-- =============================================
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sso_leave_balances_select" ON public.leave_balances;
DROP POLICY IF EXISTS "sso_leave_balances_write" ON public.leave_balances;

-- Allow anyone authenticated to select their own balances or admins to select all
CREATE POLICY "sso_leave_balances_select" ON public.leave_balances
FOR SELECT TO authenticated
USING (
  public.auth_app_role() IN ('admin_pusat', 'admin_pimpinan', 'admin_unit')
  OR employee_id = public.auth_employee_id()
);

-- Allow admin_pusat and admin_unit to write balances
CREATE POLICY "sso_leave_balances_write" ON public.leave_balances
FOR ALL TO authenticated
USING (public.auth_app_role() IN ('admin_pusat', 'admin_unit'))
WITH CHECK (public.auth_app_role() IN ('admin_pusat', 'admin_unit'));

-- =============================================
-- LEAVE_PROPOSALS RLS POLICIES
-- =============================================
ALTER TABLE public.leave_proposals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Employees can insert their own proposals" ON public.leave_proposals;
DROP POLICY IF EXISTS "Employees can view their own proposals" ON public.leave_proposals;
DROP POLICY IF EXISTS "Employees can delete their own pending proposals" ON public.leave_proposals;
DROP POLICY IF EXISTS "Admin units can update their proposals" ON public.leave_proposals;
DROP POLICY IF EXISTS "sso_leave_proposals_select" ON public.leave_proposals;
DROP POLICY IF EXISTS "sso_leave_proposals_insert" ON public.leave_proposals;
DROP POLICY IF EXISTS "sso_leave_proposals_update" ON public.leave_proposals;
DROP POLICY IF EXISTS "sso_leave_proposals_delete" ON public.leave_proposals;

-- Allow authenticated users to select proposals
CREATE POLICY "sso_leave_proposals_select" ON public.leave_proposals
FOR SELECT TO authenticated
USING (
  public.auth_app_role() IN ('admin_pusat', 'admin_pimpinan', 'admin_unit')
  OR proposed_by = auth.uid()
  OR (public.auth_app_role() = 'admin_unit' AND proposer_unit = public.auth_department())
);

-- Allow authenticated users to insert proposals
CREATE POLICY "sso_leave_proposals_insert" ON public.leave_proposals
FOR INSERT TO authenticated
WITH CHECK (
  public.auth_app_role() IN ('admin_pusat', 'admin_unit')
  OR proposed_by = auth.uid()
);

-- Allow authenticated users to update proposals
CREATE POLICY "sso_leave_proposals_update" ON public.leave_proposals
FOR UPDATE TO authenticated
USING (
  public.auth_app_role() IN ('admin_pusat', 'admin_pimpinan', 'admin_unit')
  OR proposed_by = auth.uid()
)
WITH CHECK (
  public.auth_app_role() IN ('admin_pusat', 'admin_pimpinan', 'admin_unit')
  OR proposed_by = auth.uid()
);

-- Allow authenticated users to delete proposals
CREATE POLICY "sso_leave_proposals_delete" ON public.leave_proposals
FOR DELETE TO authenticated
USING (
  public.auth_app_role() IN ('admin_pusat', 'admin_pimpinan', 'admin_unit')
  OR proposed_by = auth.uid()
);

-- =============================================
-- LEAVE_PROPOSAL_ITEMS RLS POLICIES
-- =============================================
ALTER TABLE public.leave_proposal_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Employees can insert their own proposal items" ON public.leave_proposal_items;
DROP POLICY IF EXISTS "Employees can view their own proposal items" ON public.leave_proposal_items;
DROP POLICY IF EXISTS "Admin units can update their proposal items" ON public.leave_proposal_items;
DROP POLICY IF EXISTS "sso_leave_proposal_items_select" ON public.leave_proposal_items;
DROP POLICY IF EXISTS "sso_leave_proposal_items_insert" ON public.leave_proposal_items;
DROP POLICY IF EXISTS "sso_leave_proposal_items_update" ON public.leave_proposal_items;
DROP POLICY IF EXISTS "sso_leave_proposal_items_delete" ON public.leave_proposal_items;

-- Allow authenticated users to select proposal items
CREATE POLICY "sso_leave_proposal_items_select" ON public.leave_proposal_items
FOR SELECT TO authenticated
USING (
  public.auth_app_role() IN ('admin_pusat', 'admin_pimpinan', 'admin_unit')
  OR EXISTS (
    SELECT 1 FROM public.leave_proposals lp
    WHERE lp.id = leave_proposal_items.proposal_id
    AND (lp.proposed_by = auth.uid() OR (public.auth_app_role() = 'admin_unit' AND lp.proposer_unit = public.auth_department()))
  )
);

-- Allow authenticated users to insert proposal items
CREATE POLICY "sso_leave_proposal_items_insert" ON public.leave_proposal_items
FOR INSERT TO authenticated
WITH CHECK (
  public.auth_app_role() IN ('admin_pusat', 'admin_unit')
  OR EXISTS (
    SELECT 1 FROM public.leave_proposals lp
    WHERE lp.id = leave_proposal_items.proposal_id
    AND lp.proposed_by = auth.uid()
  )
);

-- Allow authenticated users to update proposal items
CREATE POLICY "sso_leave_proposal_items_update" ON public.leave_proposal_items
FOR UPDATE TO authenticated
USING (
  public.auth_app_role() IN ('admin_pusat', 'admin_unit')
  OR EXISTS (
    SELECT 1 FROM public.leave_proposals lp
    WHERE lp.id = leave_proposal_items.proposal_id
    AND (lp.proposed_by = auth.uid() OR (public.auth_app_role() = 'admin_unit' AND lp.proposer_unit = public.auth_department()))
  )
)
WITH CHECK (
  public.auth_app_role() IN ('admin_pusat', 'admin_unit')
  OR EXISTS (
    SELECT 1 FROM public.leave_proposals lp
    WHERE lp.id = leave_proposal_items.proposal_id
    AND lp.proposed_by = auth.uid()
  )
);

-- Allow authenticated users to delete proposal items
CREATE POLICY "sso_leave_proposal_items_delete" ON public.leave_proposal_items
FOR DELETE TO authenticated
USING (
  public.auth_app_role() IN ('admin_pusat', 'admin_unit')
  OR EXISTS (
    SELECT 1 FROM public.leave_proposals lp
    WHERE lp.id = leave_proposal_items.proposal_id
    AND lp.proposed_by = auth.uid()
  )
);
