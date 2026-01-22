-- =====================================================
-- Add Reading Per Night Column to Users Table
-- =====================================================
-- This migration adds a reading_per_night column to track
-- user's typical reading volume for personalization
-- =====================================================

-- =====================================================
-- 1. Add reading_per_night Column
-- =====================================================

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS reading_per_night TEXT
  CHECK (reading_per_night IN ('<10', '10-100', '100-1000', '1000+'));

-- Add comment explaining the column
COMMENT ON COLUMN public.users.reading_per_night IS 'User''s typical reading volume per night, collected during onboarding. Used for personalization and analytics.';


