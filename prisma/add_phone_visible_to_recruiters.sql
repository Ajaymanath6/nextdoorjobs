-- Add phone_visible_to_recruiters column for existing databases.
-- Run this once if you see 500 on /api/profile and profile data not loading.
-- PostgreSQL:
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_visible_to_recruiters BOOLEAN DEFAULT false;
