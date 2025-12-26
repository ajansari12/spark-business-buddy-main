-- Add 'abandoned_notified' to session_status enum
ALTER TYPE session_status ADD VALUE IF NOT EXISTS 'abandoned_notified';

-- Add last_notified_at column to track when we sent the email
ALTER TABLE ft_sessions ADD COLUMN IF NOT EXISTS last_notified_at TIMESTAMPTZ;