-- =====================================================
-- Add Debug Fields to Feedback Table
-- =====================================================
-- Adds device and app version information to feedback for debugging
-- Helps diagnose user-reported issues by capturing their environment
-- =====================================================

-- Add debug columns
ALTER TABLE public.feedback
ADD COLUMN IF NOT EXISTS device_os TEXT,
ADD COLUMN IF NOT EXISTS device_os_version TEXT,
ADD COLUMN IF NOT EXISTS app_version TEXT,
ADD COLUMN IF NOT EXISTS expo_update_id TEXT;

-- Add check constraint for device_os
ALTER TABLE public.feedback
ADD CONSTRAINT valid_feedback_device_os CHECK (device_os IS NULL OR device_os IN ('ios', 'android'));

-- Add comments
COMMENT ON COLUMN public.feedback.device_os IS 'Device operating system: ios or android. Used for debugging device-specific issues.';
COMMENT ON COLUMN public.feedback.device_os_version IS 'OS version (e.g., "17.2" for iOS, "14" for Android). Helps identify OS-specific bugs.';
COMMENT ON COLUMN public.feedback.app_version IS 'App version from app.json (e.g., "1.0.0"). Helps identify version-specific issues.';
COMMENT ON COLUMN public.feedback.expo_update_id IS 'Unique UUID identifying the currently running OTA update from expo-updates. Null if running embedded build or in development.';

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Successfully added debug fields to feedback table';
END $$;
