-- =====================================================
-- Custom Users Table Migration
-- =====================================================
-- This migration creates a custom users table for device-based identity
-- and updates the prayer_logs table to reference custom users instead of auth.users
--
-- Architecture:
-- - Device ID is the primary identity (stored in SecureStore)
-- - Anonymous auth provides JWT security
-- - Custom users table is source of truth
-- - Optional email linking for multi-device sync
-- =====================================================

-- =====================================================
-- 1. Create Custom Users Table
-- =====================================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL UNIQUE,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT UNIQUE,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ,

  -- Email validation constraint
  CONSTRAINT valid_email CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Add comment explaining the table
COMMENT ON TABLE public.users IS 'Custom users table for device-based identity. Each user is identified by device_id (from SecureStore), with optional auth_user_id for anonymous sessions and optional email for multi-device sync.';

-- =====================================================
-- 2. Create Indexes for Performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_users_device_id ON public.users(device_id);
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id) WHERE auth_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);

-- =====================================================
-- 3. Create Trigger for updated_at
-- =====================================================

-- Create trigger for users table updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. Enable RLS on Users Table
-- =====================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. Create RLS Policies for Users Table
-- =====================================================

-- Users can read their own record (matched by auth_user_id or device_id in JWT)
CREATE POLICY "Users can read their own record"
  ON public.users FOR SELECT
  USING (
    auth.uid() = auth_user_id OR
    (auth.jwt()->>'device_id')::uuid = device_id
  );

-- Users can insert their own record (one-time during registration)
CREATE POLICY "Users can create their own record"
  ON public.users FOR INSERT
  WITH CHECK (
    auth.uid() = auth_user_id OR
    (auth.jwt()->>'device_id')::uuid = device_id
  );

-- Users can update their own record
CREATE POLICY "Users can update their own record"
  ON public.users FOR UPDATE
  USING (
    auth.uid() = auth_user_id OR
    (auth.jwt()->>'device_id')::uuid = device_id
  )
  WITH CHECK (
    auth.uid() = auth_user_id OR
    (auth.jwt()->>'device_id')::uuid = device_id
  );

-- =====================================================
-- 6. Create Helper Functions
-- =====================================================

-- Function to get or create custom user by device_id
CREATE OR REPLACE FUNCTION get_or_create_user_by_device_id(
  p_device_id UUID,
  p_auth_user_id UUID DEFAULT NULL
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
    INSERT INTO public.users (device_id, auth_user_id, last_seen_at)
    VALUES (p_device_id, p_auth_user_id, NOW())
    RETURNING id INTO v_user_id;

    -- Log the creation
    RAISE NOTICE 'Created new custom user: % for device: %', v_user_id, p_device_id;
  ELSE
    -- Update existing user with new auth_user_id (anonymous sessions can change)
    IF p_auth_user_id IS NOT NULL THEN
      UPDATE public.users
      SET auth_user_id = p_auth_user_id,
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

-- Function to link email to custom user
CREATE OR REPLACE FUNCTION link_email_to_user(
  p_user_id UUID,
  p_email TEXT,
  p_auth_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.users
  SET email = p_email,
      auth_user_id = p_auth_user_id,
      email_verified = TRUE,
      updated_at = NOW()
  WHERE id = p_user_id;

  RETURN FOUND;
END;
$$;

-- Function to get custom user ID from auth.uid() or device_id
CREATE OR REPLACE FUNCTION get_current_custom_user_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_device_id UUID;
BEGIN
  -- First try to get user by auth.uid()
  IF auth.uid() IS NOT NULL THEN
    SELECT id INTO v_user_id
    FROM public.users
    WHERE auth_user_id = auth.uid();

    IF v_user_id IS NOT NULL THEN
      RETURN v_user_id;
    END IF;
  END IF;

  -- Fallback to device_id from JWT claims
  v_device_id := (auth.jwt()->>'device_id')::uuid;
  IF v_device_id IS NOT NULL THEN
    SELECT id INTO v_user_id
    FROM public.users
    WHERE device_id = v_device_id;

    RETURN v_user_id;
  END IF;

  RETURN NULL;
END;
$$;

-- =====================================================
-- 7. Add custom_user_id Column to prayer_logs
-- =====================================================

-- Add new column (nullable initially for backward compatibility)
ALTER TABLE prayer_logs
ADD COLUMN IF NOT EXISTS custom_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;

-- Create index on new column
CREATE INDEX IF NOT EXISTS idx_prayer_logs_custom_user_id ON prayer_logs(custom_user_id);

-- Make old user_id column nullable (for backward compatibility during migration)
ALTER TABLE prayer_logs
ALTER COLUMN user_id DROP NOT NULL;

-- =====================================================
-- 8. Backfill Existing Data
-- =====================================================

-- Create custom users for existing auth.users
-- This handles any users who already have anonymous sessions
INSERT INTO public.users (device_id, auth_user_id, email, email_verified, created_at)
SELECT
  COALESCE(
    (auth.users.raw_user_meta_data->>'device_id')::uuid,
    gen_random_uuid()  -- Fallback for users without device_id in metadata
  ) as device_id,
  auth.users.id as auth_user_id,
  auth.users.email,
  auth.users.email_confirmed_at IS NOT NULL as email_verified,
  auth.users.created_at
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM public.users WHERE public.users.auth_user_id = auth.users.id
)
ON CONFLICT (device_id) DO NOTHING;

-- Link existing prayer_logs to custom users
UPDATE prayer_logs
SET custom_user_id = public.users.id
FROM public.users
WHERE prayer_logs.user_id = public.users.auth_user_id
  AND prayer_logs.custom_user_id IS NULL;

-- Note: We're NOT making custom_user_id NOT NULL yet
-- This allows gradual migration of client code
-- Once all clients are updated, we can make it NOT NULL in a future migration

-- =====================================================
-- 9. Update RLS Policies for prayer_logs
-- =====================================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can view their own prayer logs" ON prayer_logs;
DROP POLICY IF EXISTS "Users can insert their own prayer logs" ON prayer_logs;
DROP POLICY IF EXISTS "Users can update their own prayer logs" ON prayer_logs;
DROP POLICY IF EXISTS "Users can delete their own prayer logs" ON prayer_logs;

-- Create new policies that support both user_id (old) and custom_user_id (new)
-- This provides backward compatibility during migration

CREATE POLICY "Users can view their own prayer logs"
  ON prayer_logs FOR SELECT
  USING (
    -- New way: custom_user_id matches current user
    custom_user_id IN (
      SELECT id FROM public.users
      WHERE auth_user_id = auth.uid()
         OR (auth.jwt()->>'device_id')::uuid = device_id
    )
    OR
    -- Old way: user_id matches auth.uid() (backward compatibility)
    (custom_user_id IS NULL AND auth.uid() = user_id)
  );

CREATE POLICY "Users can insert their own prayer logs"
  ON prayer_logs FOR INSERT
  WITH CHECK (
    -- New way: custom_user_id matches current user
    custom_user_id IN (
      SELECT id FROM public.users
      WHERE auth_user_id = auth.uid()
         OR (auth.jwt()->>'device_id')::uuid = device_id
    )
    OR
    -- Old way: user_id matches auth.uid() (backward compatibility)
    (custom_user_id IS NULL AND auth.uid() = user_id)
  );

CREATE POLICY "Users can update their own prayer logs"
  ON prayer_logs FOR UPDATE
  USING (
    custom_user_id IN (
      SELECT id FROM public.users
      WHERE auth_user_id = auth.uid()
         OR (auth.jwt()->>'device_id')::uuid = device_id
    )
    OR
    (custom_user_id IS NULL AND auth.uid() = user_id)
  )
  WITH CHECK (
    custom_user_id IN (
      SELECT id FROM public.users
      WHERE auth_user_id = auth.uid()
         OR (auth.jwt()->>'device_id')::uuid = device_id
    )
    OR
    (custom_user_id IS NULL AND auth.uid() = user_id)
  );

CREATE POLICY "Users can delete their own prayer logs"
  ON prayer_logs FOR DELETE
  USING (
    custom_user_id IN (
      SELECT id FROM public.users
      WHERE auth_user_id = auth.uid()
         OR (auth.jwt()->>'device_id')::uuid = device_id
    )
    OR
    (custom_user_id IS NULL AND auth.uid() = user_id)
  );

-- =====================================================
-- 10. Grant Necessary Permissions
-- =====================================================

-- Grant authenticated and anon roles access to users table
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated, anon;

-- Grant access to helper functions
GRANT EXECUTE ON FUNCTION get_or_create_user_by_device_id(UUID, UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION link_email_to_user(UUID, TEXT, UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_current_custom_user_id() TO authenticated, anon;

-- =====================================================
-- Migration Complete
-- =====================================================

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Custom users table migration completed successfully';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Update client code to use custom_user_id';
  RAISE NOTICE '2. Enable anonymous sign-ins in Supabase Dashboard';
  RAISE NOTICE '3. Test the new authentication flow';
END $$;
