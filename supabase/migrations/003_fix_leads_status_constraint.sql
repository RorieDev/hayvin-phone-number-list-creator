-- Add missing status values to leads table check constraint
-- This ensures 'need_closing', 'closed_won', etc. can be saved correctly

-- Drop the existing constraint
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;

-- Add the new constraint with all current status values
ALTER TABLE leads ADD CONSTRAINT leads_status_check 
  CHECK (status IN (
    'new',
    'contacted', 
    'callback', 
    'need_closing',
    'closed_won',
    'closed_lost',
    'not_interested', 
    'wrong_number', 
    'do_not_call'
  ));

-- Also backfill any leads that have call logs but are still marked as 'new'
-- This will fix the issue where 'Needs Closing' leads show up in 'Fresh'
UPDATE leads 
SET status = (
  SELECT call_outcome 
  FROM call_logs 
  WHERE lead_id = leads.id 
  ORDER BY called_at DESC 
  LIMIT 1
),
last_called_at = (
  SELECT called_at 
  FROM call_logs 
  WHERE lead_id = leads.id 
  ORDER BY called_at DESC 
  LIMIT 1
)
WHERE id IN (
  SELECT lead_id FROM call_logs
) AND (status = 'new' OR last_called_at IS NULL);

-- Final polish: ensure 'not_yet' outcomes don't move lead out of 'new' but DO set last_called_at
-- This matches our logic in callLogs.js
UPDATE leads 
SET status = 'new'
WHERE id IN (
  SELECT lead_id FROM call_logs WHERE call_outcome = 'not_yet'
);
