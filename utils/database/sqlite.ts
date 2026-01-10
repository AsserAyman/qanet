import * as SQLite from 'expo-sqlite';
import { LocalPrayerLog, SyncMetadata, SyncOperation, TABLES } from './schema';

// Column whitelists for SQL injection protection
const PRAYER_LOG_COLUMNS = [
  'server_id', 'user_id', 'date', 'start_surah', 'start_ayah',
  'end_surah', 'end_ayah', 'total_ayahs', 'status', 'updated_at',
  'sync_status', 'last_synced', 'is_deleted'
] as const;

const SYNC_OPERATION_COLUMNS = [
  'table_name', 'operation', 'local_id', 'data',
  'retry_count', 'error_message'
] as const;

class SQLiteManager {
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.db = await SQLite.openDatabaseAsync('qanet_offline.db');
      await this.createTables();
      this.isInitialized = true;
      console.log('SQLite database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize SQLite database:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Prayer logs table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS ${TABLES.PRAYER_LOGS} (
        local_id TEXT PRIMARY KEY,
        server_id TEXT UNIQUE,
        user_id TEXT NOT NULL,
        date TEXT NOT NULL,
        start_surah TEXT NOT NULL,
        start_ayah INTEGER NOT NULL,
        end_surah TEXT NOT NULL,
        end_ayah INTEGER NOT NULL,
        total_ayahs INTEGER NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        sync_status TEXT DEFAULT 'pending',
        last_synced TEXT,
        is_deleted INTEGER DEFAULT 0
      );
    `);

    // Sync operations queue
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS ${TABLES.SYNC_OPERATIONS} (
        id TEXT PRIMARY KEY,
        table_name TEXT NOT NULL,
        operation TEXT NOT NULL,
        local_id TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at TEXT NOT NULL,
        retry_count INTEGER DEFAULT 0,
        error_message TEXT
      );
    `);

    // Sync metadata
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS ${TABLES.SYNC_METADATA} (
        table_name TEXT PRIMARY KEY,
        last_sync TEXT NOT NULL,
        sync_version INTEGER DEFAULT 1
      );
    `);

    // Create indexes for better performance
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_prayer_logs_user_id ON ${TABLES.PRAYER_LOGS}(user_id);
      CREATE INDEX IF NOT EXISTS idx_prayer_logs_date ON ${TABLES.PRAYER_LOGS}(date);
      CREATE INDEX IF NOT EXISTS idx_prayer_logs_sync_status ON ${TABLES.PRAYER_LOGS}(sync_status);
      CREATE INDEX IF NOT EXISTS idx_sync_operations_created_at ON ${TABLES.SYNC_OPERATIONS}(created_at);
    `);

    console.log('Database tables created successfully');
  }

  async insertPrayerLog(
    log: Omit<LocalPrayerLog, 'local_id'>
  ): Promise<LocalPrayerLog> {
    if (!this.db) throw new Error('Database not initialized');

    const localId = this.generateId();
    const fullLog: LocalPrayerLog = {
      ...log,
      local_id: localId,
    };

    await this.db.runAsync(
      `INSERT INTO ${TABLES.PRAYER_LOGS} (
        local_id, server_id, user_id, date, start_surah, start_ayah,
        end_surah, end_ayah, total_ayahs, status, created_at, updated_at,
        sync_status, last_synced, is_deleted
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        fullLog.local_id,
        fullLog.server_id || null,
        fullLog.user_id,
        fullLog.date,
        fullLog.start_surah,
        fullLog.start_ayah,
        fullLog.end_surah,
        fullLog.end_ayah,
        fullLog.total_ayahs,
        fullLog.status,
        fullLog.created_at,
        fullLog.updated_at,
        fullLog.sync_status,
        fullLog.last_synced || null,
        fullLog.is_deleted ? 1 : 0,
      ]
    );

    return fullLog;
  }

  async getPrayerLogs(
    userId: string,
    limit: number = 30
  ): Promise<LocalPrayerLog[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(
      `SELECT * FROM ${TABLES.PRAYER_LOGS}
       WHERE user_id = ? AND is_deleted = 0
       ORDER BY date DESC, created_at DESC
       LIMIT ?`,
      [userId, limit]
    );

    return result.map(this.mapRowToPrayerLog);
  }

  async getPrayerLogByLocalId(localId: string): Promise<LocalPrayerLog | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync(
      `SELECT * FROM ${TABLES.PRAYER_LOGS} WHERE local_id = ?`,
      [localId]
    );

    return result ? this.mapRowToPrayerLog(result) : null;
  }

  async updatePrayerLog(
    localId: string,
    updates: Partial<LocalPrayerLog>
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Validate column names against whitelist
    const validKeys = Object.keys(updates).filter(key =>
      PRAYER_LOG_COLUMNS.includes(key as any)
    );

    if (validKeys.length === 0) return;

    const setClause = validKeys.map((key) => `${key} = ?`).join(', ');
    const values = validKeys.map(key => updates[key as keyof LocalPrayerLog]);
    values.push(localId);

    await this.db.runAsync(
      `UPDATE ${TABLES.PRAYER_LOGS} SET ${setClause} WHERE local_id = ?`,
      values
    );
  }

  async deletePrayerLog(localId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      `UPDATE ${TABLES.PRAYER_LOGS} SET is_deleted = 1, updated_at = ? WHERE local_id = ?`,
      [new Date().toISOString(), localId]
    );
  }

  async addSyncOperation(operation: Omit<SyncOperation, 'id'>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const id = this.generateId();
    await this.db.runAsync(
      `INSERT INTO ${TABLES.SYNC_OPERATIONS} (
        id, table_name, operation, local_id, data, created_at, retry_count, error_message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        operation.table_name,
        operation.operation,
        operation.local_id,
        JSON.stringify(operation.data),
        operation.created_at,
        operation.retry_count,
        operation.error_message || null,
      ]
    );
  }

  async getPendingSyncOperations(): Promise<SyncOperation[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(
      `SELECT * FROM ${TABLES.SYNC_OPERATIONS} ORDER BY created_at ASC`
    );

    return result.map((row) => ({
      id: row.id as string,
      table_name: row.table_name as string,
      operation: row.operation as 'create' | 'update' | 'delete',
      local_id: row.local_id as string,
      data: JSON.parse(row.data as string),
      created_at: row.created_at as string,
      retry_count: row.retry_count as number,
      error_message: row.error_message as string | undefined,
    }));
  }

  async removeSyncOperation(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      `DELETE FROM ${TABLES.SYNC_OPERATIONS} WHERE id = ?`,
      [id]
    );
  }

  async updateSyncOperation(
    id: string,
    updates: Partial<SyncOperation>
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Validate column names against whitelist
    const validKeys = Object.keys(updates)
      .filter((key) => key !== 'id' && SYNC_OPERATION_COLUMNS.includes(key as any));

    if (validKeys.length === 0) return;

    const setClause = validKeys.map((key) => `${key} = ?`).join(', ');

    const values = validKeys.map((key) =>
      key === 'data'
        ? JSON.stringify(updates[key as keyof SyncOperation])
        : updates[key as keyof SyncOperation]
    );
    values.push(id);

    await this.db.runAsync(
      `UPDATE ${TABLES.SYNC_OPERATIONS} SET ${setClause} WHERE id = ?`,
      values
    );
  }

  async getSyncMetadata(tableName: string): Promise<SyncMetadata | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync(
      `SELECT * FROM ${TABLES.SYNC_METADATA} WHERE table_name = ?`,
      [tableName]
    );

    if (!result) return null;

    return {
      table_name: result.table_name as string,
      last_sync: result.last_sync as string,
      sync_version: result.sync_version as number,
    };
  }

  async updateSyncMetadata(metadata: SyncMetadata): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      `INSERT OR REPLACE INTO ${TABLES.SYNC_METADATA} (table_name, last_sync, sync_version)
       VALUES (?, ?, ?)`,
      [metadata.table_name, metadata.last_sync, metadata.sync_version]
    );
  }

  async getUnsyncedPrayerLogs(userId: string): Promise<LocalPrayerLog[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(
      `SELECT * FROM ${TABLES.PRAYER_LOGS} 
       WHERE user_id = ? AND sync_status != 'synced'
       ORDER BY created_at ASC`,
      [userId]
    );

    return result.map(this.mapRowToPrayerLog);
  }

  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.execAsync(`DELETE FROM ${TABLES.PRAYER_LOGS}`);
    await this.db.execAsync(`DELETE FROM ${TABLES.SYNC_OPERATIONS}`);
    await this.db.execAsync(`DELETE FROM ${TABLES.SYNC_METADATA}`);
  }

  private mapRowToPrayerLog(row: any): LocalPrayerLog {
    return {
      local_id: row.local_id,
      server_id: row.server_id,
      user_id: row.user_id,
      date: row.date,
      start_surah: row.start_surah,
      start_ayah: row.start_ayah,
      end_surah: row.end_surah,
      end_ayah: row.end_ayah,
      total_ayahs: row.total_ayahs,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      sync_status: row.sync_status,
      last_synced: row.last_synced,
      is_deleted: Boolean(row.is_deleted),
    };
  }

  private generateId(): string {
    return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const sqliteManager = new SQLiteManager();
