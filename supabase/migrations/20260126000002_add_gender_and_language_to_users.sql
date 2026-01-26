-- =====================================================
-- Add Gender and Language to Users Table
-- =====================================================
-- Adds user gender (boolean for storage optimization) and language preference
-- is_male: true for male, false for female (more storage-efficient than text)
-- language: 'en' or 'ar' for English or Arabic
-- =====================================================

-- Add gender and language columns
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS is_male BOOLEAN,
ADD COLUMN IF NOT EXISTS language TEXT;

-- Add check constraint for language
ALTER TABLE public.users
ADD CONSTRAINT valid_language CHECK (language IS NULL OR language IN ('en', 'ar'));

-- Add comments
COMMENT ON COLUMN public.users.is_male IS 'User gender: true for male, false for female. Null if not specified. Used for personalized content and analytics.';
COMMENT ON COLUMN public.users.language IS 'User language preference: en (English) or ar (Arabic). Set during onboarding.';

-- =====================================================
-- Update RPC Function to Accept gender and language
-- =====================================================

-- Drop existing function (current signature has 3 parameters)
DROP FUNCTION IF EXISTS public.get_or_create_user_by_device_id(UUID, UUID, TEXT);

-- Recreate function with gender and language parameters
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
  -- Try to find existing user by device_id
  SELECT id INTO v_user_id
  FROM public.users
  WHERE device_id = p_device_id;

  IF v_user_id IS NULL THEN
    -- Create new user
    INSERT INTO public.users (device_id, auth_user_id, device_os, is_male, language, last_seen_at)
    VALUES (p_device_id, p_auth_user_id, p_device_os, p_is_male, p_language, NOW())
    RETURNING id INTO v_user_id;

    RAISE NOTICE 'Created new custom user: % for device: % (OS: %, Gender: %, Lang: %)',
      v_user_id, p_device_id, p_device_os, p_is_male, p_language;
  ELSE
    -- Update existing user with new values if provided
    UPDATE public.users
    SET
      auth_user_id = CASE WHEN p_auth_user_id IS NOT NULL THEN p_auth_user_id ELSE auth_user_id END,
      device_os = CASE WHEN p_device_os IS NOT NULL THEN p_device_os ELSE device_os END,
      is_male = CASE WHEN p_is_male IS NOT NULL THEN p_is_male ELSE is_male END,
      language = CASE WHEN p_language IS NOT NULL THEN p_language ELSE language END,
      last_seen_at = NOW(),
      updated_at = NOW()
    WHERE id = v_user_id;
  END IF;

  RETURN v_user_id;
END;
$$;

-- Grant execute permission to the new function signature
GRANT EXECUTE ON FUNCTION public.get_or_create_user_by_device_id(UUID, UUID, TEXT, BOOLEAN, TEXT) TO authenticated, anon;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Successfully added gender and language columns to users table and updated RPC function';
END $$;
