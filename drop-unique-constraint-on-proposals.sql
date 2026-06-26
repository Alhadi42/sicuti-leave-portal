
-- Drop the unique constraint that causes conflicts on (proposer_unit, proposal_date
ALTER TABLE public.leave_proposals DROP CONSTRAINT IF EXISTS leave_proposals_proposer_unit_proposal_date_key;
