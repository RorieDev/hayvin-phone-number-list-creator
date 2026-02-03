-- Add 'not_yet' to call_outcome check constraint
-- This allows logging leads that haven't been called yet

-- Drop the existing constraint
ALTER TABLE call_logs DROP CONSTRAINT IF EXISTS call_logs_call_outcome_check;

-- Add the new constraint with 'not_yet' included
ALTER TABLE call_logs ADD CONSTRAINT call_logs_call_outcome_check 
  CHECK (call_outcome IN (
    'not_yet',
    'answered', 
    'voicemail', 
    'no_answer', 
    'busy', 
    'callback_scheduled', 
    'qualified',
    'need_closing',
    'closed_won',
    'closed_lost',
    'not_interested', 
    'wrong_number', 
    'do_not_call'
  ));
