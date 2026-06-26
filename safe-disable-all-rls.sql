
-- Safe script to disable RLS only for existing tables
DO $$
DECLARE
  _table TEXT;
  _tables TEXT[] := ARRAY[
    'leave_balances', 'leave_proposals', 'leave_proposal_items', 
    'employees', 'leave_types', 'leave_requests', 
    'national_holidays', 'leave_deferrals', 
    'audit_logs', 'notifications',
    'templates', 'template_versions'
  ];
BEGIN
  FOREACH _table IN ARRAY _tables
  LOOP
    IF EXISTS (
      SELECT 1 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = _table
    )
    THEN
      EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY;', _table);
      RAISE NOTICE 'Disabled RLS for public.%', _table;
    ELSE
      RAISE NOTICE 'Table public.% not found, skipping', _table;
    END IF;
  END LOOP;
END $$;

-- Verify RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
