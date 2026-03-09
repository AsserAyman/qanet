-- =====================================================
-- Add reading_per_night to get_or_create_user_by_device_id RPC
-- =====================================================
-- Fixes offline onboarding: when a user completes onboarding offline
-- and goes online, all three preferences (is_male, language,
-- reading_per_night) are now included in the initial user creation call.
-- =====================================================

DROP FUNCTION IF EXISTS public.get_or_create_user_by_device_id(UUID, UUID, TEXT, BOOLEAN, TEXT);

CREATE OR REPLACE FUNCTION public.get_or_create_user_by_device_id(
  p_device_id UUID,
  p_auth_user_id UUID DEFAULT NULL,
  p_device_os TEXT DEFAULT NULL,
  p_is_male BOOLEAN DEFAULT NULL,
  p_language TEXT DEFAULT NULL,
  p_reading_per_night TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  INSERT INTO public.users (device_id, auth_user_id, device_os, is_male, language, reading_per_night, last_seen_at)
  VALUES (p_device_id, p_auth_user_id, p_device_os, p_is_male, p_language, p_reading_per_night, NOW())
  ON CONFLICT (device_id) DO UPDATE
  SET
    auth_user_id = CASE
      WHEN p_auth_user_id IS NOT NULL THEN p_auth_user_id
      ELSE users.auth_user_id
    END,
    device_os = CASE
      WHEN p_device_os IS NOT NULL THEN p_device_os
      ELSE users.device_os
    END,
    is_male = CASE
      WHEN p_is_male IS NOT NULL THEN p_is_male
      ELSE users.is_male
    END,
    language = CASE
      WHEN p_language IS NOT NULL THEN p_language
      ELSE users.language
    END,
    reading_per_night = CASE
      WHEN p_reading_per_night IS NOT NULL THEN p_reading_per_night
      ELSE users.reading_per_night
    END,
    last_seen_at = NOW(),
    updated_at = NOW()
  RETURNING id INTO v_user_id;

  RETURN v_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_or_create_user_by_device_id(UUID, UUID, TEXT, BOOLEAN, TEXT, TEXT) TO authenticated, anon;
