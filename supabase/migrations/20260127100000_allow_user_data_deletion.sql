-- Migration: Allow user data deletion (App Store/Play Store compliance)
-- This migration enables the "Delete all my data" feature that:
-- 1. Makes user_id nullable so we can preserve anonymized analytics data
-- 2. Updates FK constraints to SET NULL on user deletion
-- 3. Creates an RPC function to safely delete user data

-- Make user_id nullable in prayer_logs
ALTER TABLE prayer_logs ALTER COLUMN user_id DROP NOT NULL;

-- Make user_id nullable in feedback
ALTER TABLE feedback ALTER COLUMN user_id DROP NOT NULL;

-- Drop existing FK constraints and recreate with SET NULL
ALTER TABLE prayer_logs DROP CONSTRAINT IF EXISTS prayer_logs_user_id_fkey;
ALTER TABLE prayer_logs ADD CONSTRAINT prayer_logs_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE feedback DROP CONSTRAINT IF EXISTS feedback_user_id_fkey;
ALTER TABLE feedback ADD CONSTRAINT feedback_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Create RPC function to delete user data
CREATE OR REPLACE FUNCTION delete_user_data(p_device_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get user ID from device_id
  SELECT id INTO v_user_id FROM users WHERE device_id = p_device_id;

  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Anonymize data (SET NULL will happen automatically via FK, but being explicit)
  UPDATE prayer_logs SET user_id = NULL WHERE user_id = v_user_id;
  UPDATE feedback SET user_id = NULL WHERE user_id = v_user_id;

  -- Delete user record
  DELETE FROM users WHERE id = v_user_id;

  RETURN TRUE;
END;
$$;
