import { sqliteManager } from './sqlite';
import { supabase } from '../supabase';
import { LocalPrayerLog, TABLES, SYNC_STATUS, OPERATION_TYPES } from './schema';
import { networkManager } from '../network/networkManager';
import { syncEngine } from '../sync/syncEngine';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { deviceIdentityManager } from '../auth/deviceIdentity';
import { anonymousAuthManager } from '../auth/anonymousAuth';
import { getCachedCustomUserId, registerOrGetCustomUser } from '../auth/userRegistration';

export interface CreatePrayerLogData {
  start_surah: string;
  start_ayah: number;
  end_surah: string;
  end_ayah: number;
  total_ayahs: number;
  status: string;
  date: Date;
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

    const logData: Omit<LocalPrayerLog, 'local_id'> = {
      user_id: userId,
      date: data.date.toISOString().split('T')[0],
      start_surah: data.start_surah,
      start_ayah: data.start_ayah,
      end_surah: data.end_surah,
      end_ayah: data.end_ayah,
      total_ayahs: data.total_ayahs,
      status: data.status,
      created_at: now,
      updated_at: now,
      sync_status: SYNC_STATUS.PENDING,
      is_deleted: false,
    };

    // Insert into local database first (immediate response)
    const savedLog = await sqliteManager.insertPrayerLog(logData);

    // Queue for sync
    await sqliteManager.addSyncOperation({
      table_name: TABLES.PRAYER_LOGS,
      operation: OPERATION_TYPES.CREATE,
      local_id: savedLog.local_id,
      data: savedLog,
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

  async updatePrayerLog(localId: string, updates: Partial<LocalPrayerLog>): Promise<void> {
    await this.ensureInitialized();

    const now = new Date().toISOString();
    const updateData = {
      ...updates,
      updated_at: now,
      sync_status: SYNC_STATUS.PENDING,
    };

    // Update local database first
    await sqliteManager.updatePrayerLog(localId, updateData);

    // Trigger background sync if online
    if (networkManager.isOnline()) {
      syncEngine.triggerSync();
    }
  }

  async deletePrayerLog(localId: string): Promise<void> {
    await this.ensureInitialized();

    const now = new Date().toISOString();

    // Mark as deleted locally
    await sqliteManager.deletePrayerLog(localId);

    // Queue for sync
    await sqliteManager.addSyncOperation({
      table_name: TABLES.PRAYER_LOGS,
      operation: OPERATION_TYPES.DELETE,
      local_id: localId,
      data: { deleted_at: now },
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
    const logs = await sqliteManager.getPrayerLogs(userId, 1000); // Get more for stats

    const statusCounts = logs.reduce((acc, log) => {
      acc[log.status] = (acc[log.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
    }));
  }

  async getCurrentStreak(): Promise<number> {
    await this.ensureInitialized();

    const userId = await this.getCurrentUserId();
    const logs = await sqliteManager.getPrayerLogs(userId, 365); // Get a year's worth

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Sort logs by date descending
    const sortedLogs = logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    for (let i = 0; i < sortedLogs.length; i++) {
      const logDate = new Date(sortedLogs[i].date);
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);

      if (
        logDate.getTime() === expectedDate.getTime() &&
        sortedLogs[i].status !== 'Negligent'
      ) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  async getYearlyData(): Promise<{ [key: string]: { verses: number; status: string } }> {
    await this.ensureInitialized();

    const userId = await this.getCurrentUserId();
    const logs = await sqliteManager.getPrayerLogs(userId, 1000);

    const yearlyData: { [key: string]: { verses: number; status: string } } = {};
    
    logs.forEach((log) => {
      yearlyData[log.date] = {
        verses: log.total_ayahs,
        status: log.status,
      };
    });

    return yearlyData;
  }

  async getMonthlyData(): Promise<{ [key: string]: string }> {
    await this.ensureInitialized();

    const userId = await this.getCurrentUserId();
    const logs = await sqliteManager.getPrayerLogs(userId, 1000);

    const monthlyData: { [key: string]: string } = {};
    
    logs.forEach((log) => {
      monthlyData[log.date] = log.status;
    });

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
   *
   * This function:
   * 1. Updates all local prayer_logs with the new user_id
   * 2. Marks them as pending sync
   * 3. Re-queues them for sync to the cloud
   *
   * @param oldUserId The previous user_id (device_id or anonymous_id)
   * @param newUserId The new user_id (anonymous_id or email_id)
   */
  async migrateLocalDataToNewUserId(oldUserId: string, newUserId: string): Promise<void> {
    await this.ensureInitialized();

    try {
      // Get all logs with the old user_id
      const oldLogs = await sqliteManager.getPrayerLogs(oldUserId, 10000);

      if (oldLogs.length === 0) {
        return;
      }

      // Update all local prayer_logs with new user_id and mark for re-sync
      for (const log of oldLogs) {
        const now = new Date().toISOString();

        // Update the log with new user_id
        await sqliteManager.updatePrayerLog(log.local_id, {
          user_id: newUserId,
          sync_status: SYNC_STATUS.PENDING,
          updated_at: now,
        });

        // Queue for re-sync with the new user_id
        await sqliteManager.addSyncOperation({
          table_name: TABLES.PRAYER_LOGS,
          operation: OPERATION_TYPES.CREATE, // Re-create on server with new user_id
          local_id: log.local_id,
          data: { ...log, user_id: newUserId },
          created_at: now,
          retry_count: 0,
        });
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
    // Note: This won't work for Supabase inserts, but allows local SQLite to work
    // When the app goes online, we'll create the custom user and migrate this data
    return deviceIdentityManager.getDeviceId();
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }
}

export const offlineDataManager = new OfflineDataManager();