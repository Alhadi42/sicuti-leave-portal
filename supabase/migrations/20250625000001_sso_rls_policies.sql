-- SSO RLS policies — menggunakan JWT user_metadata dari session SiCuti
-- Role: admin_pusat | admin_pimpinan | admin_unit | employee

-- Helper: ambil app role dari JWT
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

CREATE OR REPLACE FUNCTION public.auth_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.auth_app_role() IN ('admin_pusat', 'admin_pimpinan', 'admin_unit');
$$;

CREATE OR REPLACE FUNCTION public.auth_is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.auth_app_role() = 'admin_pusat';
$$;

-- ─── leave_requests ───────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'leave_requests') THEN
    ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "sso_leave_requests_select" ON public.leave_requests;
    DROP POLICY IF EXISTS "sso_leave_requests_insert" ON public.leave_requests;
    DROP POLICY IF EXISTS "sso_leave_requests_update" ON public.leave_requests;
    DROP POLICY IF EXISTS "sso_leave_requests_delete" ON public.leave_requests;

    CREATE POLICY "sso_leave_requests_select" ON public.leave_requests
      FOR SELECT TO authenticated
      USING (
        public.auth_app_role() IN ('admin_pusat', 'admin_pimpinan')
        OR (
          public.auth_app_role() = 'admin_unit'
          AND employee_id IN (
            SELECT id FROM public.employees
            WHERE department = public.auth_department()
          )
        )
        OR (
          public.auth_app_role() = 'employee'
          AND employee_id = public.auth_employee_id()
        )
      );

    CREATE POLICY "sso_leave_requests_insert" ON public.leave_requests
      FOR INSERT TO authenticated
      WITH CHECK (
        public.auth_app_role() IN ('admin_pusat', 'admin_unit')
        OR (
          public.auth_app_role() = 'employee'
          AND employee_id = public.auth_employee_id()
        )
      );

    CREATE POLICY "sso_leave_requests_update" ON public.leave_requests
      FOR UPDATE TO authenticated
      USING (
        public.auth_app_role() IN ('admin_pusat', 'admin_pimpinan', 'admin_unit')
        OR (
          public.auth_app_role() = 'employee'
          AND employee_id = public.auth_employee_id()
          AND status IN ('draft', 'pending', 'submitted')
        )
      );

    CREATE POLICY "sso_leave_requests_delete" ON public.leave_requests
      FOR DELETE TO authenticated
      USING (
        public.auth_app_role() IN ('admin_pusat', 'admin_unit')
        OR (
          public.auth_app_role() = 'employee'
          AND employee_id = public.auth_employee_id()
          AND status IN ('draft', 'pending', 'submitted')
        )
      );
  END IF;
END $$;

-- ─── leave_balances ───────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'leave_balances') THEN
    ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "sso_leave_balances_select" ON public.leave_balances;
    DROP POLICY IF EXISTS "sso_leave_balances_write" ON public.leave_balances;

    CREATE POLICY "sso_leave_balances_select" ON public.leave_balances
      FOR SELECT TO authenticated
      USING (
        public.auth_app_role() IN ('admin_pusat', 'admin_pimpinan', 'admin_unit')
        OR employee_id = public.auth_employee_id()
      );

    CREATE POLICY "sso_leave_balances_write" ON public.leave_balances
      FOR ALL TO authenticated
      USING (public.auth_app_role() IN ('admin_pusat', 'admin_unit'))
      WITH CHECK (public.auth_app_role() IN ('admin_pusat', 'admin_unit'));
  END IF;
END $$;

-- ─── leave_types (read-only untuk semua authenticated) ────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'leave_types') THEN
    ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "sso_leave_types_read" ON public.leave_types;
    CREATE POLICY "sso_leave_types_read" ON public.leave_types
      FOR SELECT TO authenticated USING (true);

    DROP POLICY IF EXISTS "sso_leave_types_write" ON public.leave_types;
    CREATE POLICY "sso_leave_types_write" ON public.leave_types
      FOR ALL TO authenticated
      USING (public.auth_is_super_admin())
      WITH CHECK (public.auth_is_super_admin());
  END IF;
END $$;

-- ─── notifications ────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') THEN
    DROP POLICY IF EXISTS "sso_notifications_own" ON public.notifications;
    CREATE POLICY "sso_notifications_own" ON public.notifications
      FOR ALL TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- ─── templates ────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'templates') THEN
    DROP POLICY IF EXISTS "sso_templates_read" ON public.templates;
    DROP POLICY IF EXISTS "sso_templates_write" ON public.templates;

    CREATE POLICY "sso_templates_read" ON public.templates
      FOR SELECT TO authenticated
      USING (
        public.auth_is_admin()
        OR scope = 'global'
        OR (scope = 'unit' AND unit_kerja = public.auth_department())
      );

    CREATE POLICY "sso_templates_write" ON public.templates
      FOR ALL TO authenticated
      USING (
        public.auth_is_super_admin()
        OR (public.auth_app_role() = 'admin_unit' AND unit_kerja = public.auth_department())
      )
      WITH CHECK (
        public.auth_is_super_admin()
        OR (public.auth_app_role() = 'admin_unit' AND unit_kerja = public.auth_department())
      );
  END IF;
END $$;
