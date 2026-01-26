-- =====================================================
-- Fix Concurrent User Registration Race Condition
-- =====================================================
-- Updates get_or_create_user_by_device_id to handle concurrent calls
-- Uses INSERT ... ON CONFLICT to prevent duplicate key errors
-- Preserves all existing parameters: device_os, is_male, language
-- =====================================================

-- Drop existing function (current signature has 5 parameters)
DROP FUNCTION IF EXISTS public.get_or_create_user_by_device_id(UUID, UUID, TEXT, BOOLEAN, TEXT);

-- Recreate function with proper concurrency handling
CREATE OR REPLACE FUNCTION public.get_or_create_user_by_device_id(
  p_device_id UUID,
  p_auth_user_id UUID DEFAULT NULL,
  p_device_os TEXT DEFAULT NULL,
  p_is_male BOOLEAN DEFAULT NULL,
  p_language TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Try to insert new user, or get existing one if device_id already exists
  -- This handles concurrent calls gracefully using ON CONFLICT
  INSERT INTO public.users (device_id, auth_user_id, device_os, is_male, language, last_seen_at)
  VALUES (p_device_id, p_auth_user_id, p_device_os, p_is_male, p_language, NOW())
  ON CONFLICT (device_id) DO UPDATE
  SET
    -- Update auth_user_id if provided
    auth_user_id = CASE
      WHEN p_auth_user_id IS NOT NULL THEN p_auth_user_id
      ELSE users.auth_user_id
    END,
    -- Update device_os if provided
    device_os = CASE
      WHEN p_device_os IS NOT NULL THEN p_device_os
      ELSE users.device_os
    END,
    -- Update is_male if provided
    is_male = CASE
      WHEN p_is_male IS NOT NULL THEN p_is_male
      ELSE users.is_male
    END,
    -- Update language if provided
    language = CASE
      WHEN p_language IS NOT NULL THEN p_language
      ELSE users.language
    END,
    -- Always update timestamps
    last_seen_at = NOW(),
    updated_at = NOW()
  RETURNING id INTO v_user_id;

  RETURN v_user_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_or_create_user_by_device_id(UUID, UUID, TEXT, BOOLEAN, TEXT) TO authenticated, anon;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Successfully fixed concurrent user registration race condition';
  RAISE NOTICE 'Function now uses INSERT ... ON CONFLICT to prevent duplicate key errors';
END $$;
