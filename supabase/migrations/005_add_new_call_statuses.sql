-- Add 'sent_number' and 'wants_callback' to call_outcome and lead status check constraints

-- 1. Update call_logs constraint
ALTER TABLE call_logs DROP CONSTRAINT IF EXISTS call_logs_call_outcome_check;
ALTER TABLE call_logs ADD CONSTRAINT call_logs_call_outcome_check 
  CHECK (call_outcome IN (
    'not_yet',
    'answered', 
    'voicemail', 
    'no_answer', 
    'busy', 
    'callback_scheduled', 
    'sent_number',
    'wants_callback',
    'qualified',
    'need_closing',
    'closed_won',
    'closed_lost',
    'not_interested', 
    'wrong_number', 
    'do_not_call'
  ));

-- 2. Update leads constraint
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;
ALTER TABLE leads ADD CONSTRAINT leads_status_check 
  CHECK (status IN (
    'new',
    'callback', 
    'sent_number',
    'wants_callback',
    'need_closing',
    'closed_won',
    'closed_lost',
    'not_interested', 
    'wrong_number', 
    'do_not_call'
  ));
