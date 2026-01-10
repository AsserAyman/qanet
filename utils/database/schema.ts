export interface LocalPrayerLog {
  local_id: string;
  server_id?: string;
  user_id: string;
  date: string;
  start_surah: string;
  start_ayah: number;
  end_surah: string;
  end_ayah: number;
  total_ayahs: number;
  status: string;
  created_at: string;
  updated_at: string;
  sync_status: 'pending' | 'synced' | 'conflict' | 'error';
  last_synced?: string;
  is_deleted: boolean;
}

export interface SyncOperation {
  id: string;
  table_name: string;
  operation: 'create' | 'update' | 'delete';
  local_id: string;
  data: any;
  created_at: string;
  retry_count: number;
  error_message?: string;
}

export interface SyncMetadata {
  table_name: string;
  last_sync: string;
  sync_version: number;
}

export const TABLES = {
  PRAYER_LOGS: 'prayer_logs',
  SYNC_OPERATIONS: 'sync_operations',
  SYNC_METADATA: 'sync_metadata',
} as const;

export const SYNC_STATUS = {
  PENDING: 'pending',
  SYNCED: 'synced',
  CONFLICT: 'conflict',
  ERROR: 'error',
} as const;

export const OPERATION_TYPES = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
} as const;