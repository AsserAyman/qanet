import AsyncStorage from '@react-native-async-storage/async-storage';
import { anonymousAuthManager } from '../auth/anonymousAuth';
import { deviceIdentityManager } from '../auth/deviceIdentity';
import { getCachedCustomUserId, registerOrGetCustomUser } from '../auth/userRegistration';
import { networkManager } from '../network/networkManager';
import { calculateAyahsBetweenIndices, getVerseStatus } from '../quranData';
import { syncEngine } from '../sync/syncEngine';
import { LocalExemptPeriod, LocalPrayerLog, LocalRecitation, OPERATION_TYPES, SYNC_STATUS, TABLES } from './schema';
import { sqliteManager } from './sqlite';

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
  private initPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this._doInitialize();
    return this.initPromise;
  }

  private async _doInitialize(): Promise<void> {
    try {
      // Critical path — blocks render, all local/fast operations
      await deviceIdentityManager.initialize();
      await sqliteManager.initialize();

      this.isInitialized = true;

      // Background path — network-dependent, fire-and-forget
      this.initializeBackground();
    } catch (error) {
      this.initPromise = null;
      console.error('Failed to initialize app:', error);
      throw error;
    }
  }

  private async initializeBackground(): Promise<void> {
    try {
      await networkManager.initialize();

      if (networkManager.isOnline()) {
        await anonymousAuthManager.initialize();
      }

      await syncEngine.initialize();
    } catch (error) {
      console.error('Background initialization failed (non-blocking):', error);
    }
  }

  async createPrayerLog(data: CreatePrayerLogData): Promise<LocalPrayerLog> {
    await this.ensureInitialized();

    const userId = await this.getCurrentUserId();
    const now = new Date().toISOString();

    const logData = {
      user_id: userId,
      prayer_date: `${data.prayer_date.getFullYear()}-${String(data.prayer_date.getMonth() + 1).padStart(2, '0')}-${String(data.prayer_date.getDate()).padStart(2, '0')}`,
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

  // =====================================================
  // Exempt Period Operations
  // =====================================================

  async createExemptPeriod(startDate: string, endDate: string): Promise<LocalExemptPeriod> {
    await this.ensureInitialized();

    const userId = await this.getCurrentUserId();
    const now = new Date().toISOString();

    const period = await sqliteManager.insertExemptPeriod({
      user_id: userId,
      start_date: startDate,
      end_date: endDate,
      created_at: now,
      updated_at: now,
      sync_status: SYNC_STATUS.PENDING,
      is_deleted: false,
    });

    await sqliteManager.addSyncOperation({
      table_name: TABLES.EXEMPT_PERIODS,
      operation: OPERATION_TYPES.CREATE,
      record_id: period.id,
      created_at: now,
      retry_count: 0,
    });

    if (networkManager.isOnline()) {
      syncEngine.triggerSync();
    }

    return period;
  }

  async getExemptPeriods(): Promise<LocalExemptPeriod[]> {
    await this.ensureInitialized();

    const userId = await this.getCurrentUserId();
    return await sqliteManager.getExemptPeriods(userId);
  }

  async updateExemptPeriod(id: string, startDate: string, endDate: string): Promise<void> {
    await this.ensureInitialized();

    const now = new Date().toISOString();
    await sqliteManager.updateExemptPeriod(id, {
      start_date: startDate,
      end_date: endDate,
      updated_at: now,
      sync_status: SYNC_STATUS.PENDING,
    });

    // Queue for sync (only if no pending CREATE exists)
    const pendingOps = await sqliteManager.getPendingSyncOperations();
    const hasPendingOp = pendingOps.some(
      op => op.record_id === id && (op.operation === OPERATION_TYPES.CREATE || op.operation === OPERATION_TYPES.UPDATE)
    );

    if (!hasPendingOp) {
      await sqliteManager.addSyncOperation({
        table_name: TABLES.EXEMPT_PERIODS,
        operation: OPERATION_TYPES.UPDATE,
        record_id: id,
        created_at: now,
        retry_count: 0,
      });
    }

    if (networkManager.isOnline()) {
      syncEngine.triggerSync();
    }
  }

  async deleteExemptPeriod(id: string): Promise<void> {
    await this.ensureInitialized();

    const now = new Date().toISOString();
    await sqliteManager.deleteExemptPeriod(id);

    await sqliteManager.addSyncOperation({
      table_name: TABLES.EXEMPT_PERIODS,
      operation: OPERATION_TYPES.DELETE,
      record_id: id,
      created_at: now,
      retry_count: 0,
    });

    if (networkManager.isOnline()) {
      syncEngine.triggerSync();
    }
  }

  /**
   * Build a Set of all exempt date strings (YYYY-MM-DD) from period ranges
   */
  private buildExemptDateSet(periods: LocalExemptPeriod[]): Set<string> {
    const exemptDates = new Set<string>();
    for (const period of periods) {
      const start = new Date(period.start_date + 'T00:00:00Z');
      const end = new Date(period.end_date + 'T00:00:00Z');
      for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
        exemptDates.add(d.toISOString().split('T')[0]);
      }
    }
    return exemptDates;
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
    const [logs, periods] = await Promise.all([
      sqliteManager.getPrayerLogs(userId, 365),
      sqliteManager.getExemptPeriods(userId),
    ]);

    if (logs.length === 0 && periods.length === 0) return 0;

    // Pre-aggregate daily totals so lookups are O(1) instead of O(n) per day
    const dailyTotals = new Map<string, number>();
    for (const log of logs) {
      dailyTotals.set(
        log.prayer_date,
        (dailyTotals.get(log.prayer_date) ?? 0) + this.calculateTotalAyahs(log.recitations),
      );
    }
    const dateSet = new Set(dailyTotals.keys());
    const exemptDates = this.buildExemptDateSet(periods);

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const yesterdayDate = new Date(now);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;

    // Night-prayer buffer: if tonight hasn't been logged yet, don't break the streak.
    // Also allow exempt (period) days to not break the streak.
    let startOffset = 0;
    if (!dateSet.has(todayStr) && !exemptDates.has(todayStr)) {
      if (dateSet.has(yesterdayStr) || exemptDates.has(yesterdayStr)) {
        startOffset = 1;
      } else {
        return 0;
      }
    }

    let streak = 0;
    const maxDays = dateSet.size + exemptDates.size + startOffset;
    for (let i = startOffset; i < maxDays; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      // Exempt days: skip silently (don't count, don't break)
      if (exemptDates.has(dateStr)) continue;

      if (!dateSet.has(dateStr)) break;

      const dayTotal = dailyTotals.get(dateStr) ?? 0;
      if (this.getStatusFromAyahCount(dayTotal) !== 'Negligent') {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  async getLongestStreak(): Promise<number> {
    await this.ensureInitialized();

    const userId = await this.getCurrentUserId();
    const [logs, periods] = await Promise.all([
      sqliteManager.getPrayerLogs(userId, 1000),
      sqliteManager.getExemptPeriods(userId),
    ]);

    // Pre-aggregate daily totals
    const dailyTotals = new Map<string, number>();
    for (const log of logs) {
      dailyTotals.set(
        log.prayer_date,
        (dailyTotals.get(log.prayer_date) ?? 0) + this.calculateTotalAyahs(log.recitations),
      );
    }
    const exemptDates = this.buildExemptDateSet(periods);

    // Merge prayer dates + exempt dates, sorted ascending
    const allDates = new Set([...dailyTotals.keys(), ...exemptDates]);
    const dates = Array.from(allDates).sort((a, b) => a.localeCompare(b));

    if (dates.length === 0) return 0;

    let maxStreak = 0;
    let currentStreak = 0;
    let prevDateStr: string | null = null;

    for (const dateStr of dates) {
      // Exempt days: keep the streak alive (don't count, don't break)
      if (exemptDates.has(dateStr)) {
        if (prevDateStr) {
          const diffDays = Math.round(
            (new Date(dateStr).getTime() - new Date(prevDateStr).getTime()) /
              (1000 * 60 * 60 * 24),
          );
          if (diffDays !== 1) {
            currentStreak = 0;
            prevDateStr = null;
          }
        }
        prevDateStr = dateStr;
        continue;
      }

      const dayTotal = dailyTotals.get(dateStr) ?? 0;

      if (this.getStatusFromAyahCount(dayTotal) === 'Negligent') {
        currentStreak = 0;
        prevDateStr = null;
        continue;
      }

      if (prevDateStr) {
        const diffDays = Math.round(
          (new Date(dateStr).getTime() - new Date(prevDateStr).getTime()) /
            (1000 * 60 * 60 * 24),
        );
        currentStreak = diffDays === 1 ? currentStreak + 1 : 1;
      } else {
        currentStreak = 1;
      }

      if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
      }

      prevDateStr = dateStr;
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
    // With the promise lock on registerOrGetCustomUser, concurrent callers
    // share a single in-flight request instead of each making their own
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
