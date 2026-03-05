-- =====================================================
-- Create Exempt Periods Table
-- =====================================================
-- Stores date ranges during which a user is exempt from
-- prayer tracking (e.g. menstrual period for female users).
-- These ranges are excluded from streak calculations.
-- =====================================================

CREATE TABLE exempt_periods (
  id UUID PRIMARY KEY,  -- Client-generated, same as local
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_exempt_periods_user_id ON exempt_periods(user_id);
CREATE INDEX idx_exempt_periods_dates ON exempt_periods(start_date, end_date);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_exempt_periods_updated_at ON exempt_periods;
CREATE TRIGGER update_exempt_periods_updated_at
  BEFORE UPDATE ON exempt_periods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Enable Row Level Security
-- =====================================================

ALTER TABLE exempt_periods ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS Policies
-- =====================================================

CREATE POLICY "Users can view own exempt periods"
  ON exempt_periods FOR SELECT
  USING (user_id = get_current_custom_user_id());

CREATE POLICY "Users can insert own exempt periods"
  ON exempt_periods FOR INSERT
  WITH CHECK (user_id = get_current_custom_user_id());

CREATE POLICY "Users can update own exempt periods"
  ON exempt_periods FOR UPDATE
  USING (user_id = get_current_custom_user_id());

CREATE POLICY "Users can delete own exempt periods"
  ON exempt_periods FOR DELETE
  USING (user_id = get_current_custom_user_id());

-- =====================================================
-- Grant Permissions
-- =====================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON exempt_periods TO authenticated, anon;
