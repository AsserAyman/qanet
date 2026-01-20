import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto';
import { LocalPrayerLog, LocalRecitation, SyncMetadata, SyncOperation, TABLES } from './schema';

// Column whitelists for SQL injection protection
const PRAYER_LOG_COLUMNS = [
  'user_id', 'prayer_date', 'updated_at',
  'sync_status', 'is_deleted'
] as const;

const SYNC_OPERATION_COLUMNS = [
  'table_name', 'operation', 'record_id',
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

    // Prayer logs table (simplified - no start/end fields)
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS ${TABLES.PRAYER_LOGS} (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        prayer_date TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        sync_status TEXT DEFAULT 'pending',
        is_deleted INTEGER DEFAULT 0
      );
    `);

    // Recitations table (NEW)
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS ${TABLES.RECITATIONS} (
        id TEXT PRIMARY KEY,
        prayer_log_id TEXT NOT NULL,
        start_ayah INTEGER NOT NULL,
        end_ayah INTEGER NOT NULL,
        FOREIGN KEY (prayer_log_id) REFERENCES ${TABLES.PRAYER_LOGS}(id) ON DELETE CASCADE
      );
    `);

    // Sync operations queue (simplified)
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS ${TABLES.SYNC_OPERATIONS} (
        id TEXT PRIMARY KEY,
        table_name TEXT NOT NULL,
        operation TEXT NOT NULL,
        record_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        retry_count INTEGER DEFAULT 0,
        error_message TEXT
      );
    `);

    // Sync metadata
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS ${TABLES.SYNC_METADATA} (
        table_name TEXT PRIMARY KEY,
        last_sync TEXT NOT NULL
      );
    `);

    // Create indexes for better performance
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_prayer_logs_user_id ON ${TABLES.PRAYER_LOGS}(user_id);
      CREATE INDEX IF NOT EXISTS idx_prayer_logs_prayer_date ON ${TABLES.PRAYER_LOGS}(prayer_date);
      CREATE INDEX IF NOT EXISTS idx_prayer_logs_sync_status ON ${TABLES.PRAYER_LOGS}(sync_status);
      CREATE INDEX IF NOT EXISTS idx_recitations_prayer_log_id ON ${TABLES.RECITATIONS}(prayer_log_id);
      CREATE INDEX IF NOT EXISTS idx_sync_operations_created_at ON ${TABLES.SYNC_OPERATIONS}(created_at);
    `);

    console.log('Database tables created successfully');
  }

  // Generate a UUID for client-generated IDs
  async generateUUID(): Promise<string> {
    return await Crypto.randomUUID();
  }

  // =====================================================
  // Prayer Log Operations
  // =====================================================

  async insertPrayerLog(
    log: Omit<LocalPrayerLog, 'id' | 'recitations'>,
    recitations: { start_ayah: number; end_ayah: number }[]
  ): Promise<LocalPrayerLog> {
    if (!this.db) throw new Error('Database not initialized');

    const id = await this.generateUUID();

    await this.db.runAsync(
      `INSERT INTO ${TABLES.PRAYER_LOGS} (
        id, user_id, prayer_date, created_at, updated_at,
        sync_status, is_deleted
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        log.user_id,
        log.prayer_date,
        log.created_at,
        log.updated_at,
        log.sync_status,
        log.is_deleted ? 1 : 0,
      ]
    );

    // Insert recitations
    const insertedRecitations: LocalRecitation[] = [];
    for (const rec of recitations) {
      const recId = await this.generateUUID();
      await this.db.runAsync(
        `INSERT INTO ${TABLES.RECITATIONS} (id, prayer_log_id, start_ayah, end_ayah)
         VALUES (?, ?, ?, ?)`,
        [recId, id, rec.start_ayah, rec.end_ayah]
      );
      insertedRecitations.push({
        id: recId,
        prayer_log_id: id,
        start_ayah: rec.start_ayah,
        end_ayah: rec.end_ayah,
      });
    }

    return {
      ...log,
      id,
      recitations: insertedRecitations,
    };
  }

  async getPrayerLogs(
    userId: string,
    limit: number = 30
  ): Promise<LocalPrayerLog[]> {
    if (!this.db) throw new Error('Database not initialized');

    const prayerLogs = await this.db.getAllAsync(
      `SELECT * FROM ${TABLES.PRAYER_LOGS}
       WHERE user_id = ? AND is_deleted = 0
       ORDER BY prayer_date DESC, created_at DESC
       LIMIT ?`,
      [userId, limit]
    );

    // Get recitations for all prayer logs
    const logs: LocalPrayerLog[] = [];
    for (const row of prayerLogs) {
      const recitations = await this.getRecitationsForPrayerLog((row as any).id);
      logs.push(this.mapRowToPrayerLog(row, recitations));
    }

    return logs;
  }

  async getPrayerLogById(id: string): Promise<LocalPrayerLog | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync(
      `SELECT * FROM ${TABLES.PRAYER_LOGS} WHERE id = ?`,
      [id]
    );

    if (!result) return null;

    const recitations = await this.getRecitationsForPrayerLog(id);
    return this.mapRowToPrayerLog(result, recitations);
  }

  async updatePrayerLog(
    id: string,
    updates: Partial<Omit<LocalPrayerLog, 'id' | 'recitations'>>
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Validate column names against whitelist
    const validKeys = Object.keys(updates).filter(key =>
      PRAYER_LOG_COLUMNS.includes(key as any)
    );

    if (validKeys.length === 0) return;

    const setClause = validKeys.map((key) => `${key} = ?`).join(', ');
    const values = validKeys.map(key => {
      const val = updates[key as keyof typeof updates];
      return val === undefined ? null : val;
    }) as SQLite.SQLiteBindValue[];
    values.push(id);

    await this.db.runAsync(
      `UPDATE ${TABLES.PRAYER_LOGS} SET ${setClause} WHERE id = ?`,
      values
    );
  }

  async deletePrayerLog(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      `UPDATE ${TABLES.PRAYER_LOGS} SET is_deleted = 1, updated_at = ? WHERE id = ?`,
      [new Date().toISOString(), id]
    );
  }

  async hardDeletePrayerLog(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Recitations will be deleted via CASCADE
    await this.db.runAsync(
      `DELETE FROM ${TABLES.PRAYER_LOGS} WHERE id = ?`,
      [id]
    );
  }

  // =====================================================
  // Recitation Operations
  // =====================================================

  async getRecitationsForPrayerLog(prayerLogId: string): Promise<LocalRecitation[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(
      `SELECT * FROM ${TABLES.RECITATIONS} WHERE prayer_log_id = ?`,
      [prayerLogId]
    );

    return result.map((row: any) => ({
      id: row.id,
      prayer_log_id: row.prayer_log_id,
      start_ayah: row.start_ayah,
      end_ayah: row.end_ayah,
    }));
  }

  async insertRecitation(
    prayerLogId: string,
    startAyah: number,
    endAyah: number
  ): Promise<LocalRecitation> {
    if (!this.db) throw new Error('Database not initialized');

    const id = await this.generateUUID();
    await this.db.runAsync(
      `INSERT INTO ${TABLES.RECITATIONS} (id, prayer_log_id, start_ayah, end_ayah)
       VALUES (?, ?, ?, ?)`,
      [id, prayerLogId, startAyah, endAyah]
    );

    return {
      id,
      prayer_log_id: prayerLogId,
      start_ayah: startAyah,
      end_ayah: endAyah,
    };
  }

  async deleteRecitationsForPrayerLog(prayerLogId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      `DELETE FROM ${TABLES.RECITATIONS} WHERE prayer_log_id = ?`,
      [prayerLogId]
    );
  }

  async replaceRecitationsForPrayerLog(
    prayerLogId: string,
    recitations: { start_ayah: number; end_ayah: number }[]
  ): Promise<LocalRecitation[]> {
    if (!this.db) throw new Error('Database not initialized');

    // Delete existing recitations
    await this.deleteRecitationsForPrayerLog(prayerLogId);

    // Insert new recitations
    const insertedRecitations: LocalRecitation[] = [];
    for (const rec of recitations) {
      const inserted = await this.insertRecitation(prayerLogId, rec.start_ayah, rec.end_ayah);
      insertedRecitations.push(inserted);
    }

    return insertedRecitations;
  }

  // =====================================================
  // Sync Operations
  // =====================================================

  async addSyncOperation(operation: Omit<SyncOperation, 'id'>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const id = await this.generateUUID();
    await this.db.runAsync(
      `INSERT INTO ${TABLES.SYNC_OPERATIONS} (
        id, table_name, operation, record_id, created_at, retry_count, error_message
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        operation.table_name,
        operation.operation,
        operation.record_id,
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

    return result.map((row: any) => ({
      id: row.id as string,
      table_name: row.table_name as string,
      operation: row.operation as 'create' | 'update' | 'delete',
      record_id: row.record_id as string,
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

    const values = validKeys.map((key) => updates[key as keyof SyncOperation]) as SQLite.SQLiteBindValue[];
    values.push(id);

    await this.db.runAsync(
      `UPDATE ${TABLES.SYNC_OPERATIONS} SET ${setClause} WHERE id = ?`,
      values
    );
  }

  // =====================================================
  // Sync Metadata
  // =====================================================

  async getSyncMetadata(tableName: string): Promise<SyncMetadata | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync(
      `SELECT * FROM ${TABLES.SYNC_METADATA} WHERE table_name = ?`,
      [tableName]
    ) as any;

    if (!result) return null;

    return {
      table_name: result.table_name as string,
      last_sync: result.last_sync as string,
    };
  }

  async updateSyncMetadata(metadata: SyncMetadata): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      `INSERT OR REPLACE INTO ${TABLES.SYNC_METADATA} (table_name, last_sync)
       VALUES (?, ?)`,
      [metadata.table_name, metadata.last_sync]
    );
  }

  // =====================================================
  // Utility Methods
  // =====================================================

  async getUnsyncedPrayerLogs(userId: string): Promise<LocalPrayerLog[]> {
    if (!this.db) throw new Error('Database not initialized');

    const prayerLogs = await this.db.getAllAsync(
      `SELECT * FROM ${TABLES.PRAYER_LOGS}
       WHERE user_id = ? AND sync_status != 'synced'
       ORDER BY created_at ASC`,
      [userId]
    );

    const logs: LocalPrayerLog[] = [];
    for (const row of prayerLogs) {
      const recitations = await this.getRecitationsForPrayerLog((row as any).id);
      logs.push(this.mapRowToPrayerLog(row, recitations));
    }

    return logs;
  }

  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.execAsync(`DELETE FROM ${TABLES.RECITATIONS}`);
    await this.db.execAsync(`DELETE FROM ${TABLES.PRAYER_LOGS}`);
    await this.db.execAsync(`DELETE FROM ${TABLES.SYNC_OPERATIONS}`);
    await this.db.execAsync(`DELETE FROM ${TABLES.SYNC_METADATA}`);
  }

  private mapRowToPrayerLog(row: any, recitations: LocalRecitation[]): LocalPrayerLog {
    return {
      id: row.id,
      user_id: row.user_id,
      prayer_date: row.prayer_date,
      created_at: row.created_at,
      updated_at: row.updated_at,
      sync_status: row.sync_status,
      is_deleted: Boolean(row.is_deleted),
      recitations,
    };
  }
}

export const sqliteManager = new SQLiteManager();
