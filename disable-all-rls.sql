-- Disable RLS for all tables
ALTER TABLE public.leave_balances DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_proposals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_proposal_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.national_holidays DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_deferrals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_versions DISABLE ROW LEVEL SECURITY;

-- Verify RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'leave_balances', 'leave_proposals', 'leave_proposal_items', 
  'employees', 'leave_types', 'leave_requests', 
  'national_holidays', 'leave_deferrals', 
  'audit_logs', 'notifications',
  'templates', 'template_versions'
);
