-- Remove 'contacted' status value from leads table check constraint
-- First, migrate any existing 'contacted' leads to 'new'
UPDATE leads SET status = 'new' WHERE status = 'contacted';

-- Drop the existing constraint
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;

-- Add the new constraint without 'contacted'
ALTER TABLE leads ADD CONSTRAINT leads_status_check 
  CHECK (status IN (
    'new',
    'callback', 
    'need_closing',
    'closed_won',
    'closed_lost',
    'not_interested', 
    'wrong_number', 
    'do_not_call'
  ));
