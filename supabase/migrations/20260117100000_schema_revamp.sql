-- =====================================================
-- Schema Revamp Migration
-- =====================================================
-- This migration implements the new simplified schema:
-- - prayer_logs: Unified ID (client-generated UUID)
-- - recitations: New table for tracking ayah ranges
-- - Removes: server_id, local_id, start_surah/ayah, end_surah/ayah, total_ayahs, status
--
-- WARNING: This migration DROPS existing prayer_logs data!
-- =====================================================

-- =====================================================
-- 1. Drop Existing Tables (clearing data as planned)
-- =====================================================

-- Drop dependent policies first
DROP POLICY IF EXISTS "Users can view their own prayer logs" ON prayer_logs;
DROP POLICY IF EXISTS "Users can insert their own prayer logs" ON prayer_logs;
DROP POLICY IF EXISTS "Users can update their own prayer logs" ON prayer_logs;
DROP POLICY IF EXISTS "Users can delete their own prayer logs" ON prayer_logs;

-- Drop sync tables (not needed on server)
DROP TABLE IF EXISTS sync_operations CASCADE;
DROP TABLE IF EXISTS sync_metadata CASCADE;

-- Drop prayer_logs table
DROP TABLE IF EXISTS prayer_logs CASCADE;

-- Drop unused enum types
DROP TYPE IF EXISTS operation_type_enum CASCADE;

-- =====================================================
-- 2. Create New prayer_logs Table
-- =====================================================

CREATE TABLE prayer_logs (
  id UUID PRIMARY KEY,  -- Client-generated, same as local
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  prayer_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_prayer_logs_user_id ON prayer_logs(user_id);
CREATE INDEX idx_prayer_logs_prayer_date ON prayer_logs(prayer_date);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_prayer_logs_updated_at ON prayer_logs;
CREATE TRIGGER update_prayer_logs_updated_at
  BEFORE UPDATE ON prayer_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 3. Create New recitations Table
-- =====================================================

CREATE TABLE recitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prayer_log_id UUID NOT NULL REFERENCES prayer_logs(id) ON DELETE CASCADE,
  start_ayah INTEGER NOT NULL,  -- Global index (1-6236)
  end_ayah INTEGER NOT NULL     -- Global index (1-6236)
);

-- Index for lookups
CREATE INDEX idx_recitations_prayer_log_id ON recitations(prayer_log_id);

-- =====================================================
-- 4. Enable Row Level Security
-- =====================================================

ALTER TABLE prayer_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE recitations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. Create RLS Policies for prayer_logs
-- =====================================================

-- Users can view their own prayer logs
CREATE POLICY "Users can view own prayer logs"
  ON prayer_logs FOR SELECT
  USING (user_id = get_current_custom_user_id());

-- Users can insert their own prayer logs
CREATE POLICY "Users can insert own prayer logs"
  ON prayer_logs FOR INSERT
  WITH CHECK (user_id = get_current_custom_user_id());

-- Users can update their own prayer logs
CREATE POLICY "Users can update own prayer logs"
  ON prayer_logs FOR UPDATE
  USING (user_id = get_current_custom_user_id());

-- Users can delete their own prayer logs
CREATE POLICY "Users can delete own prayer logs"
  ON prayer_logs FOR DELETE
  USING (user_id = get_current_custom_user_id());

-- =====================================================
-- 6. Create RLS Policies for recitations
-- =====================================================

-- Users can view recitations for their own prayer logs
CREATE POLICY "Users can view own recitations"
  ON recitations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM prayer_logs
    WHERE prayer_logs.id = recitations.prayer_log_id
    AND prayer_logs.user_id = get_current_custom_user_id()
  ));

-- Users can insert recitations for their own prayer logs
CREATE POLICY "Users can insert own recitations"
  ON recitations FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM prayer_logs
    WHERE prayer_logs.id = recitations.prayer_log_id
    AND prayer_logs.user_id = get_current_custom_user_id()
  ));

-- Users can update recitations for their own prayer logs
CREATE POLICY "Users can update own recitations"
  ON recitations FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM prayer_logs
    WHERE prayer_logs.id = recitations.prayer_log_id
    AND prayer_logs.user_id = get_current_custom_user_id()
  ));

-- Users can delete recitations for their own prayer logs
CREATE POLICY "Users can delete own recitations"
  ON recitations FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM prayer_logs
    WHERE prayer_logs.id = recitations.prayer_log_id
    AND prayer_logs.user_id = get_current_custom_user_id()
  ));

-- =====================================================
-- 7. Grant Permissions
-- =====================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON prayer_logs TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON recitations TO authenticated, anon;

-- =====================================================
-- Migration Complete
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Schema revamp migration completed successfully';
  RAISE NOTICE 'Tables created: prayer_logs, recitations';
  RAISE NOTICE 'Note: All existing prayer_logs data has been cleared';
END $$;
