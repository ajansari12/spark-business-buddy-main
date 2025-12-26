-- Add url_status column to canadian_grants table
ALTER TABLE canadian_grants 
ADD COLUMN IF NOT EXISTS url_status text DEFAULT 'unchecked';

-- Add constraint for valid values
ALTER TABLE canadian_grants 
ADD CONSTRAINT url_status_check 
CHECK (url_status IN ('accessible', 'broken', 'timeout', 'unchecked'));