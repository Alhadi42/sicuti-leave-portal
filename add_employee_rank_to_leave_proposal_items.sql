-- Add employee_rank column to leave_proposal_items table
-- This column stores the employee's rank at the time of the proposal

ALTER TABLE leave_proposal_items 
ADD COLUMN IF NOT EXISTS employee_rank TEXT;

-- Add comment
COMMENT ON COLUMN leave_proposal_items.employee_rank IS 'The employee''s rank at the time of proposal submission';