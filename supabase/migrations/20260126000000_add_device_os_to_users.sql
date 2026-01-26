-- =====================================================
-- Add device_os to Users Table
-- =====================================================
-- Adds device operating system field for analytics and user segmentation
-- Values: 'ios' or 'android'
-- =====================================================

-- Add device_os column
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS device_os TEXT;

-- Add check constraint to ensure only valid values
ALTER TABLE public.users
ADD CONSTRAINT valid_device_os CHECK (device_os IS NULL OR device_os IN ('ios', 'android'));

-- Add comment
COMMENT ON COLUMN public.users.device_os IS 'Device operating system: ios or android. Used for user segmentation and analytics.';

-- =====================================================
-- Update RPC Function to Accept device_os
-- =====================================================

-- Drop existing function (match current signature with 2 parameters)
DROP FUNCTION IF EXISTS public.get_or_create_user_by_device_id(UUID, UUID);

-- Recreate function with device_os parameter
CREATE OR REPLACE FUNCTION public.get_or_create_user_by_device_id(
  p_device_id UUID,
  p_auth_user_id UUID DEFAULT NULL,
  p_device_os TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Try to find existing user by device_id
  SELECT id INTO v_user_id
  FROM public.users
  WHERE device_id = p_device_id;

  IF v_user_id IS NULL THEN
    -- Create new user
    INSERT INTO public.users (device_id, auth_user_id, device_os, last_seen_at)
    VALUES (p_device_id, p_auth_user_id, p_device_os, NOW())
    RETURNING id INTO v_user_id;

    RAISE NOTICE 'Created new custom user: % for device: % (OS: %)', v_user_id, p_device_id, p_device_os;
  ELSE
    -- Update existing user with new auth_user_id and device_os
    IF p_auth_user_id IS NOT NULL OR p_device_os IS NOT NULL THEN
      UPDATE public.users
      SET
        auth_user_id = CASE WHEN p_auth_user_id IS NOT NULL THEN p_auth_user_id ELSE auth_user_id END,
        device_os = CASE WHEN p_device_os IS NOT NULL THEN p_device_os ELSE device_os END,
        last_seen_at = NOW(),
        updated_at = NOW()
      WHERE id = v_user_id;
    ELSE
      -- Just update last_seen_at
      UPDATE public.users
      SET last_seen_at = NOW()
      WHERE id = v_user_id;
    END IF;
  END IF;

  RETURN v_user_id;
END;
$$;

-- Grant execute permission to the new function signature
GRANT EXECUTE ON FUNCTION public.get_or_create_user_by_device_id(UUID, UUID, TEXT) TO authenticated, anon;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Successfully added device_os column to users table and updated RPC function';
END $$;
