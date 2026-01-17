-- Remove sync_status column from server-side prayer_logs table
-- This column is only needed on the client (local SQLite) to track sync state
-- The server doesn't need to know sync status - if a record exists, it's synced

-- Drop the index first
DROP INDEX IF EXISTS idx_prayer_logs_sync_status;

-- Drop the column
ALTER TABLE prayer_logs DROP COLUMN IF EXISTS sync_status;

-- Drop the enum type if no other tables use it
DROP TYPE IF EXISTS sync_status_enum CASCADE;

COMMENT ON TABLE prayer_logs IS 'Prayer logs table. Sync status is tracked client-side only.';
