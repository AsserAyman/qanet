// Prayer log with unified ID (same on client and server)
export interface LocalPrayerLog {
  id: string;                    // Client-generated UUID (same as server)
  user_id: string;
  prayer_date: string;           // YYYY-MM-DD format
  created_at: string;
  updated_at: string;
  sync_status: 'pending' | 'synced' | 'conflict' | 'error';
  last_synced?: string;
  is_deleted: boolean;
  recitations: LocalRecitation[];  // Always includes recitations
}

// Recitation range (stores global ayah indices 1-6236)
export interface LocalRecitation {
  id: string;
  prayer_log_id: string;
  start_ayah: number;            // Global index (1-6236)
  end_ayah: number;              // Global index (1-6236)
}

// Type for creating a new prayer log (without system fields)
export interface CreatePrayerLogInput {
  prayer_date: string;
  recitations: CreateRecitationInput[];
}

// Type for creating a new recitation
export interface CreateRecitationInput {
  start_ayah: number;            // Global index (1-6236)
  end_ayah: number;              // Global index (1-6236)
}

export interface SyncOperation {
  id: string;
  table_name: string;
  operation: 'create' | 'update' | 'delete';
  record_id: string;             // Renamed from local_id (unified ID)
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
  RECITATIONS: 'recitations',
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
