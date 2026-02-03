-- SQL script to update lead status by phone number
UPDATE leads 
SET 
  status = 'wants_callback',
  updated_at = NOW()
WHERE phone_number = '07400 938971';
