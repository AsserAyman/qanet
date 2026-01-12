-- Create enum types for sync_status and operation types
DO $$ BEGIN
  CREATE TYPE sync_status_enum AS ENUM ('pending', 'synced', 'conflict', 'error');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE operation_type_enum AS ENUM ('create', 'update', 'delete');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create prayer_logs table
CREATE TABLE IF NOT EXISTS prayer_logs (
  local_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_surah VARCHAR(255) NOT NULL,
  start_ayah INTEGER NOT NULL,
  end_surah VARCHAR(255) NOT NULL,
  end_ayah INTEGER NOT NULL,
  total_ayahs INTEGER NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sync_status sync_status_enum NOT NULL DEFAULT 'pending',
  last_synced TIMESTAMPTZ,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- Create sync_operations table
CREATE TABLE IF NOT EXISTS sync_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name VARCHAR(255) NOT NULL,
  operation operation_type_enum NOT NULL,
  local_id UUID NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  retry_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT
);

-- Create sync_metadata table
CREATE TABLE IF NOT EXISTS sync_metadata (
  table_name VARCHAR(255) PRIMARY KEY,
  last_sync TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sync_version INTEGER NOT NULL DEFAULT 1
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_prayer_logs_user_id ON prayer_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_prayer_logs_date ON prayer_logs(date);
CREATE INDEX IF NOT EXISTS idx_prayer_logs_sync_status ON prayer_logs(sync_status);
CREATE INDEX IF NOT EXISTS idx_prayer_logs_is_deleted ON prayer_logs(is_deleted);
CREATE INDEX IF NOT EXISTS idx_sync_operations_table_name ON sync_operations(table_name);
CREATE INDEX IF NOT EXISTS idx_sync_operations_local_id ON sync_operations(local_id);
CREATE INDEX IF NOT EXISTS idx_sync_operations_created_at ON sync_operations(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for prayer_logs updated_at
DROP TRIGGER IF EXISTS update_prayer_logs_updated_at ON prayer_logs;
CREATE TRIGGER update_prayer_logs_updated_at
  BEFORE UPDATE ON prayer_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE prayer_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_metadata ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for prayer_logs
CREATE POLICY "Users can view their own prayer logs"
  ON prayer_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own prayer logs"
  ON prayer_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prayer logs"
  ON prayer_logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prayer logs"
  ON prayer_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for sync_operations
CREATE POLICY "Users can manage their own sync operations"
  ON sync_operations FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create RLS policies for sync_metadata
CREATE POLICY "Users can view sync metadata"
  ON sync_metadata FOR SELECT
  USING (true);

CREATE POLICY "Users can manage sync metadata"
  ON sync_metadata FOR ALL
  USING (true)
  WITH CHECK (true);
