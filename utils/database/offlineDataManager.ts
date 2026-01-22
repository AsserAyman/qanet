import { sqliteManager } from './sqlite';
import { LocalPrayerLog, TABLES, SYNC_STATUS, OPERATION_TYPES, LocalRecitation } from './schema';
import { networkManager } from '../network/networkManager';
import { syncEngine } from '../sync/syncEngine';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { deviceIdentityManager } from '../auth/deviceIdentity';
import { anonymousAuthManager } from '../auth/anonymousAuth';
import { getCachedCustomUserId, registerOrGetCustomUser } from '../auth/userRegistration';
import { calculateAyahsBetweenIndices, getVerseStatus } from '../quranData';

// Input data for creating a new prayer log
export interface CreatePrayerLogData {
  prayer_date: Date;
  recitations: {
    start_ayah: number;  // Global index (1-6236)
    end_ayah: number;    // Global index (1-6236)
  }[];
}

// Input data for updating a prayer log
export interface UpdatePrayerLogData {
  prayer_date?: string;
  recitations?: {
    start_ayah: number;
    end_ayah: number;
  }[];
}

class OfflineDataManager {
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // 1. Initialize device identity FIRST (offline-first foundation)
      await deviceIdentityManager.initialize();

      // 2. Initialize local database (always needed)
      await sqliteManager.initialize();

      // 3. Initialize network manager
      await networkManager.initialize();

      // 4. Initialize anonymous auth (only if online, silently)
      if (networkManager.isOnline()) {
        await anonymousAuthManager.initialize();
      }

      // 5. Initialize sync engine
      await syncEngine.initialize();

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize app:', error);
      throw error;
    }
  }

  async createPrayerLog(data: CreatePrayerLogData): Promise<LocalPrayerLog> {
    await this.ensureInitialized();

    const userId = await this.getCurrentUserId();
    const now = new Date().toISOString();

    const logData = {
      user_id: userId,
      prayer_date: data.prayer_date.toISOString().split('T')[0],
      created_at: now,
      updated_at: now,
      sync_status: SYNC_STATUS.PENDING,
      is_deleted: false,
    };

    // Insert into local database first (immediate response)
    const savedLog = await sqliteManager.insertPrayerLog(logData, data.recitations);

    // Queue for sync
    await sqliteManager.addSyncOperation({
      table_name: TABLES.PRAYER_LOGS,
      operation: OPERATION_TYPES.CREATE,
      record_id: savedLog.id,
      created_at: now,
      retry_count: 0,
    });

    // Trigger background sync if online
    if (networkManager.isOnline()) {
      syncEngine.triggerSync();
    }

    return savedLog;
  }

  async getPrayerLogs(limit: number = 30): Promise<LocalPrayerLog[]> {
    await this.ensureInitialized();

    const userId = await this.getCurrentUserId();
    return await sqliteManager.getPrayerLogs(userId, limit);
  }

  async getPrayerLogById(id: string): Promise<LocalPrayerLog | null> {
    await this.ensureInitialized();
    return await sqliteManager.getPrayerLogById(id);
  }

  async updatePrayerLog(id: string, updates: UpdatePrayerLogData): Promise<void> {
    await this.ensureInitialized();

    const now = new Date().toISOString();

    // Update prayer_log fields if provided
    if (updates.prayer_date) {
      await sqliteManager.updatePrayerLog(id, {
        prayer_date: updates.prayer_date,
        updated_at: now,
        sync_status: SYNC_STATUS.PENDING,
      });
    } else {
      await sqliteManager.updatePrayerLog(id, {
        updated_at: now,
        sync_status: SYNC_STATUS.PENDING,
      });
    }

    // Update recitations if provided
    if (updates.recitations) {
      await sqliteManager.replaceRecitationsForPrayerLog(id, updates.recitations);
    }

    // Queue for sync to ensure updates aren't lost
    // Check if there's already a pending operation for this record
    const pendingOps = await sqliteManager.getPendingSyncOperations();
    const hasPendingOp = pendingOps.some(
      op => op.record_id === id && (op.operation === OPERATION_TYPES.CREATE || op.operation === OPERATION_TYPES.UPDATE)
    );

    // Only queue UPDATE if there's no pending CREATE or UPDATE
    // (CREATE will use latest data, so no need for separate UPDATE)
    if (!hasPendingOp) {
      await sqliteManager.addSyncOperation({
        table_name: TABLES.PRAYER_LOGS,
        operation: OPERATION_TYPES.UPDATE,
        record_id: id,
        created_at: now,
        retry_count: 0,
      });
    }

    // Trigger background sync if online
    if (networkManager.isOnline()) {
      syncEngine.triggerSync();
    }
  }

  async deletePrayerLog(id: string): Promise<void> {
    await this.ensureInitialized();

    const now = new Date().toISOString();

    // Mark as deleted locally
    await sqliteManager.deletePrayerLog(id);

    // Queue for sync
    await sqliteManager.addSyncOperation({
      table_name: TABLES.PRAYER_LOGS,
      operation: OPERATION_TYPES.DELETE,
      record_id: id,
      created_at: now,
      retry_count: 0,
    });

    // Trigger background sync if online
    if (networkManager.isOnline()) {
      syncEngine.triggerSync();
    }
  }

  async getStatusStats(): Promise<{ status: string; count: number }[]> {
    await this.ensureInitialized();

    const userId = await this.getCurrentUserId();
    const logs = await sqliteManager.getPrayerLogs(userId, 1000);

    // Group logs by date and calculate total ayahs per day
    const dailyTotals: { [date: string]: number } = {};
    for (const log of logs) {
      const total = this.calculateTotalAyahs(log.recitations);
      dailyTotals[log.prayer_date] = (dailyTotals[log.prayer_date] || 0) + total;
    }

    // Calculate status for each day
    const statusCounts: Record<string, number> = {};
    for (const total of Object.values(dailyTotals)) {
      const status = this.getStatusFromAyahCount(total);
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    }

    return Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
    }));
  }

  async getCurrentStreak(): Promise<number> {
    await this.ensureInitialized();

    const userId = await this.getCurrentUserId();
    const logs = await sqliteManager.getPrayerLogs(userId, 365);

    // Group logs by date
    const dateSet = new Set(logs.map(log => log.prayer_date));
    const dates = Array.from(dateSet).sort((a, b) => b.localeCompare(a));

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < dates.length; i++) {
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      const expectedDateStr = expectedDate.toISOString().split('T')[0];

      if (dates.includes(expectedDateStr)) {
        // Check if the day wasn't 'Negligent'
        const dayLogs = logs.filter(log => log.prayer_date === expectedDateStr);
        const dayTotal = dayLogs.reduce((sum, log) =>
          sum + this.calculateTotalAyahs(log.recitations), 0
        );
        const status = this.getStatusFromAyahCount(dayTotal);

        if (status !== 'Negligent') {
          streak++;
        } else {
          break;
        }
      } else {
        break;
      }
    }

    return streak;
  }

  async getLongestStreak(): Promise<number> {
    await this.ensureInitialized();

    const userId = await this.getCurrentUserId();
    const logs = await sqliteManager.getPrayerLogs(userId, 1000); // Fetch enough logs

    // Group logs by date
    const dateSet = new Set(logs.map(log => log.prayer_date));
    const dates = Array.from(dateSet).sort((a, b) => a.localeCompare(b)); // Ascending order

    if (dates.length === 0) return 0;

    let maxStreak = 0;
    let currentStreak = 0;
    let prevDate: Date | null = null;

    for (const dateStr of dates) {
      const currentDate = new Date(dateStr);
      
      // Calculate status for this day
      const dayLogs = logs.filter(log => log.prayer_date === dateStr);
      const dayTotal = dayLogs.reduce((sum, log) =>
        sum + this.calculateTotalAyahs(log.recitations), 0
      );
      const status = this.getStatusFromAyahCount(dayTotal);

      if (status === 'Negligent') {
        currentStreak = 0;
        prevDate = null;
        continue;
      }

      if (prevDate) {
        const diffTime = Math.abs(currentDate.getTime() - prevDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          currentStreak++;
        } else {
          currentStreak = 1;
        }
      } else {
        currentStreak = 1;
      }

      if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
      }

      prevDate = currentDate;
    }

    return maxStreak;
  }

  async getYearlyData(): Promise<{ [key: string]: { verses: number; status: string } }> {
    await this.ensureInitialized();

    const userId = await this.getCurrentUserId();
    const logs = await sqliteManager.getPrayerLogs(userId, 1000);

    // Group by date and sum verses
    const yearlyData: { [key: string]: { verses: number; status: string } } = {};

    for (const log of logs) {
      const total = this.calculateTotalAyahs(log.recitations);
      if (yearlyData[log.prayer_date]) {
        yearlyData[log.prayer_date].verses += total;
      } else {
        yearlyData[log.prayer_date] = {
          verses: total,
          status: '', // Will be calculated after summing
        };
      }
    }

    // Calculate status for each date
    for (const date of Object.keys(yearlyData)) {
      yearlyData[date].status = this.getStatusFromAyahCount(yearlyData[date].verses);
    }

    return yearlyData;
  }

  async getMonthlyData(): Promise<{ [key: string]: string }> {
    await this.ensureInitialized();

    const yearlyData = await this.getYearlyData();

    const monthlyData: { [key: string]: string } = {};
    for (const [date, data] of Object.entries(yearlyData)) {
      monthlyData[date] = data.status;
    }

    return monthlyData;
  }

  async forceSyncNow(): Promise<void> {
    await this.ensureInitialized();

    if (!networkManager.isOnline()) {
      throw new Error('Cannot sync while offline');
    }

    await syncEngine.performFullSync();
  }

  async getSyncStatus(): Promise<{
    pendingOperations: number;
    lastSync: string | null;
    isOnline: boolean;
  }> {
    await this.ensureInitialized();

    const pendingOps = await sqliteManager.getPendingSyncOperations();
    const metadata = await sqliteManager.getSyncMetadata(TABLES.PRAYER_LOGS);

    return {
      pendingOperations: pendingOps.length,
      lastSync: metadata?.last_sync || null,
      isOnline: networkManager.isOnline(),
    };
  }

  async clearAllLocalData(): Promise<void> {
    await this.ensureInitialized();
    await sqliteManager.clearAllData();
  }

  /**
   * Migrate local data to a new user ID
   * Used when transitioning from device_id → anonymous_user_id → email_user_id
   */
  async migrateLocalDataToNewUserId(oldUserId: string, newUserId: string): Promise<void> {
    await this.ensureInitialized();

    try {
      // Get all logs with the old user_id
      const oldLogs = await sqliteManager.getPrayerLogs(oldUserId, 10000);

      if (oldLogs.length === 0) {
        return;
      }

      // Get all pending operations to avoid creating duplicates
      const pendingOps = await sqliteManager.getPendingSyncOperations();

      // Update all local prayer_logs with new user_id and mark for re-sync
      for (const log of oldLogs) {
        const now = new Date().toISOString();

        // Update the log with new user_id
        await sqliteManager.updatePrayerLog(log.id, {
          user_id: newUserId,
          sync_status: SYNC_STATUS.PENDING,
          updated_at: now,
        });

        // Only queue for re-sync if there's no pending CREATE operation already
        const hasPendingCreate = pendingOps.some(
          op => op.record_id === log.id && op.operation === OPERATION_TYPES.CREATE
        );

        if (!hasPendingCreate) {
          // Queue for re-sync with the new user_id
          await sqliteManager.addSyncOperation({
            table_name: TABLES.PRAYER_LOGS,
            operation: OPERATION_TYPES.CREATE,
            record_id: log.id,
            created_at: now,
            retry_count: 0,
          });
        }
      }

      // Update cached user ID
      await AsyncStorage.setItem('@cached_user_id', newUserId);

      // Trigger background sync if online
      if (networkManager.isOnline()) {
        syncEngine.triggerSync();
      }
    } catch (error) {
      throw error;
    }
  }

  // =====================================================
  // Helper Methods
  // =====================================================

  /**
   * Calculate total ayahs from recitations
   */
  calculateTotalAyahs(recitations: LocalRecitation[]): number {
    return recitations.reduce((sum, rec) => {
      return sum + calculateAyahsBetweenIndices(rec.start_ayah, rec.end_ayah);
    }, 0);
  }

  /**
   * Get status based on ayah count (same logic as getVerseStatus in quranData.ts)
   */
  private getStatusFromAyahCount(totalAyahs: number): string {
    return getVerseStatus(totalAyahs).status;
  }

  private async getCurrentUserId(): Promise<string> {
    // Priority 1: Cached custom user ID (fastest, works offline)
    const cachedCustomUserId = await getCachedCustomUserId();
    if (cachedCustomUserId) {
      return cachedCustomUserId;
    }

    // Priority 2: Try to get custom user ID from server (if online)
    if (networkManager.isOnline()) {
      try {
        const customUserId = await registerOrGetCustomUser();
        return customUserId;
      } catch (error) {
        console.warn('Failed to get custom user ID from server:', error);
        // Fall through to offline mode
      }
    }

    // Priority 3: Device ID as temp fallback (until we can sync)
    return deviceIdentityManager.getDeviceId();
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }
}

export const offlineDataManager = new OfflineDataManager();
