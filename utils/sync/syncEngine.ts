import { sqliteManager } from '../database/sqlite';
import { supabase } from '../supabase';
import { networkManager } from '../network/networkManager';
import { SyncOperation, TABLES, SYNC_STATUS } from '../database/schema';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { deviceIdentityManager } from '../auth/deviceIdentity';
import { anonymousAuthManager } from '../auth/anonymousAuth';
import { getCachedCustomUserId, registerOrGetCustomUser } from '../auth/userRegistration';

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_BASE = 1000; // 1 second base delay

class SyncEngine {
  private isInitialized = false;
  private isSyncing = false;
  private syncQueue: SyncOperation[] = [];

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Listen for network changes - silent background sync
      networkManager.onOnline(async () => {
        // Initialize anonymous auth if not already done
        if (!anonymousAuthManager.isReady()) {
          await anonymousAuthManager.initialize();
        }

        // Trigger background sync silently
        this.triggerSync();
      });

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize SyncEngine:', error);
      throw error;
    }
  }

  async triggerSync(): Promise<void> {
    if (this.isSyncing || !networkManager.isOnline()) {
      return;
    }

    try {
      this.isSyncing = true;
      await this.performSync();
      // Silent success - data synced in background
    } catch (error: any) {
      // Log for debugging but don't surface to user - data is safe locally
      console.warn('[Sync] Background sync failed, will retry:', error?.message);
    } finally {
      this.isSyncing = false;
    }
  }

  async performFullSync(): Promise<void> {
    if (!networkManager.isOnline()) {
      throw new Error('Cannot perform full sync while offline');
    }

    this.isSyncing = true;
    try {
      // Ensure custom user exists before syncing
      await this.ensureCustomUserExists();

      // First, push local changes to server
      await this.pushLocalChanges();

      // Then, pull server changes to local
      await this.pullServerChanges();

      console.log('Full sync completed successfully');
    } catch (error) {
      console.error('Full sync failed:', error);
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Ensure custom user record exists before syncing
   * Creates custom user on server if not already created
   * Also updates auth_user_id linkage if session changed
   *
   * @returns Custom user ID
   */
  private async ensureCustomUserExists(): Promise<string> {
    // Always call registerOrGetCustomUser to update auth_user_id linkage
    // (Anonymous sessions can change, need to keep linkage up to date)
    const customUserId = await registerOrGetCustomUser();

    // Migrate local data if needed (device_id → custom_user_id)
    const deviceId = deviceIdentityManager.getDeviceId();
    if (deviceId !== customUserId) {
      // This is the first time syncing - migrate any local data
      // from device_id to custom_user_id
      const offlineDataManager = await import('../database/offlineDataManager');
      await offlineDataManager.offlineDataManager.migrateLocalDataToNewUserId(
        deviceId,
        customUserId
      );
    }

    return customUserId;
  }

  private async performSync(): Promise<void> {
    try {
      // Check for auth session - skip if no session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('⏭️  Skipping sync - no auth session (offline-only mode)');
        return;
      }

      // Ensure custom user exists before syncing
      await this.ensureCustomUserExists();

      // Push local changes first
      await this.pushLocalChanges();

      // Then pull server changes
      await this.pullServerChanges();

      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Sync operation failed:', error);
      throw error;
    }
  }

  private async pushLocalChanges(): Promise<void> {
    const pendingOperations = await sqliteManager.getPendingSyncOperations();
    
    for (const operation of pendingOperations) {
      try {
        await this.processSyncOperation(operation);
        await sqliteManager.removeSyncOperation(operation.id);
      } catch (error) {
        console.error(`Failed to sync operation ${operation.id}:`, error);
        
        // Increment retry count
        const newRetryCount = operation.retry_count + 1;
        
        if (newRetryCount >= MAX_RETRY_ATTEMPTS) {
          // Mark as error after max retries
          await sqliteManager.updateSyncOperation(operation.id, {
            retry_count: newRetryCount,
            error_message: error instanceof Error ? error.message : 'Unknown error',
          });
        } else {
          // Schedule for retry
          await sqliteManager.updateSyncOperation(operation.id, {
            retry_count: newRetryCount,
            error_message: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }
  }

  private async processSyncOperation(operation: SyncOperation): Promise<void> {
    switch (operation.operation) {
      case 'create':
        await this.syncCreateOperation(operation);
        break;
      case 'update':
        await this.syncUpdateOperation(operation);
        break;
      case 'delete':
        await this.syncDeleteOperation(operation);
        break;
      default:
        throw new Error(`Unknown operation type: ${operation.operation}`);
    }
  }

  private async syncCreateOperation(operation: SyncOperation): Promise<void> {
    // Read the LATEST data from database instead of using potentially stale operation.data
    // This ensures any updates made after the CREATE was queued are included
    const currentLog = await sqliteManager.getPrayerLogByLocalId(operation.local_id);

    if (!currentLog) {
      // Record was deleted before sync completed - skip this operation
      console.log(`[Sync] Skipping CREATE for ${operation.local_id} - record no longer exists`);
      return;
    }

    if (currentLog.is_deleted) {
      // Record was deleted before sync completed - skip this operation
      console.log(`[Sync] Skipping CREATE for ${operation.local_id} - record is deleted`);
      return;
    }

    if (currentLog.server_id) {
      // Record already has server_id - it was already synced, skip to prevent duplicate
      console.log(`[Sync] Skipping CREATE for ${operation.local_id} - already synced (has server_id)`);
      return;
    }

    try {
      // Ensure we have custom user ID
      const customUserId = await this.ensureCustomUserExists();

      // Create on server with custom_user_id using latest local data
      const { data, error } = await supabase
        .from('prayer_logs')
        .insert({
          custom_user_id: customUserId,
          date: currentLog.date,
          start_surah: currentLog.start_surah,
          start_ayah: currentLog.start_ayah,
          end_surah: currentLog.end_surah,
          end_ayah: currentLog.end_ayah,
          total_ayahs: currentLog.total_ayahs,
          status: currentLog.status,
        })
        .select()
        .single();

      if (error) throw error;

      // Update local record with server ID
      // Note: Supabase table uses 'local_id' as primary key, not 'id'
      await sqliteManager.updatePrayerLog(operation.local_id, {
        server_id: data.local_id,
        sync_status: SYNC_STATUS.SYNCED,
        last_synced: new Date().toISOString(),
      });

      console.log(`[Sync] CREATE successful for ${operation.local_id}, server_id: ${data.local_id}`);
    } catch (error: any) {
      // Re-throw to be handled by the caller
      throw error;
    }
  }

  private async syncUpdateOperation(operation: SyncOperation): Promise<void> {
    // Get the current local record to find server_id
    const currentLog = await sqliteManager.getPrayerLogByLocalId(operation.local_id);

    if (!currentLog) {
      // Record was deleted before sync completed - skip this operation
      console.log(`[Sync] Skipping UPDATE for ${operation.local_id} - record no longer exists`);
      return;
    }

    if (!currentLog.server_id) {
      // No server_id yet - this means the CREATE operation hasn't completed
      // Check if there's a pending CREATE operation for this record
      const pendingOps = await sqliteManager.getPendingSyncOperations();
      const hasPendingCreate = pendingOps.some(
        op => op.local_id === operation.local_id && op.operation === 'create'
      );

      if (hasPendingCreate) {
        // CREATE is still pending - skip this UPDATE since CREATE will use latest data
        console.log(`[Sync] Skipping UPDATE for ${operation.local_id} - pending CREATE will include latest data`);
        return;
      }

      // No pending CREATE and no server_id - this is a stale operation
      // The CREATE likely already completed but failed to set server_id, or this is legacy data
      // Skip this operation gracefully instead of failing repeatedly
      console.log(`[Sync] Skipping stale UPDATE for ${operation.local_id} - no server_id and no pending CREATE`);
      return;
    }

    // Read the latest data from database to ensure we sync the most recent version
    // Note: Supabase table uses 'local_id' as primary key, not 'id'
    const { error } = await supabase
      .from('prayer_logs')
      .update({
        date: currentLog.date,
        start_surah: currentLog.start_surah,
        start_ayah: currentLog.start_ayah,
        end_surah: currentLog.end_surah,
        end_ayah: currentLog.end_ayah,
        total_ayahs: currentLog.total_ayahs,
        status: currentLog.status,
      })
      .eq('local_id', currentLog.server_id);

    if (error) throw error;

    // Update local sync status
    await sqliteManager.updatePrayerLog(operation.local_id, {
      sync_status: SYNC_STATUS.SYNCED,
      last_synced: new Date().toISOString(),
    });
  }

  private async syncDeleteOperation(operation: SyncOperation): Promise<void> {
    // Get the current local record to find server_id (including deleted records)
    const currentLog = await sqliteManager.getPrayerLogByLocalId(operation.local_id);

    if (currentLog?.server_id) {
      // Delete from server
      // Note: Supabase table uses 'local_id' as primary key, not 'id'
      const { error } = await supabase
        .from('prayer_logs')
        .delete()
        .eq('local_id', currentLog.server_id);

      if (error) throw error;
    }

    // The local record is already marked as deleted, no need to update
  }

  private async pullServerChanges(): Promise<void> {
    const userId = await this.getCurrentUserId();
    const metadata = await sqliteManager.getSyncMetadata(TABLES.PRAYER_LOGS);
    
    let lastSync = metadata?.last_sync;
    if (!lastSync) {
      // First sync - get all data from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      lastSync = thirtyDaysAgo.toISOString();
    }

    // Fetch changes from server since last sync
    const { data: serverLogs, error } = await supabase
      .from('prayer_logs')
      .select('*')
      .eq('custom_user_id', userId)
      .gte('updated_at', lastSync)
      .order('updated_at', { ascending: true });

    if (error) throw error;

    // Process server changes
    for (const serverLog of serverLogs || []) {
      await this.processServerLog(serverLog);
    }

    // Update sync metadata
    await sqliteManager.updateSyncMetadata({
      table_name: TABLES.PRAYER_LOGS,
      last_sync: new Date().toISOString(),
      sync_version: (metadata?.sync_version || 0) + 1,
    });
  }

  private async processServerLog(serverLog: any): Promise<void> {
    const userId = await this.getCurrentUserId();
    const existingLogs = await sqliteManager.getPrayerLogs(userId, 1000);

    // Note: Supabase table uses 'local_id' as primary key, not 'id'
    const serverRecordId = serverLog.local_id;

    // Check by server_id first
    let existingLog = existingLogs.find(log => log.server_id === serverRecordId);

    // If not found by server_id, check for potential duplicate by content
    // This catches cases where a record was created locally but the server_id wasn't set yet
    if (!existingLog && serverRecordId) {
      existingLog = existingLogs.find(log =>
        !log.server_id &&  // Only match unsynced local records
        log.date === serverLog.date &&
        log.start_surah === serverLog.start_surah &&
        log.start_ayah === serverLog.start_ayah &&
        log.end_surah === serverLog.end_surah &&
        log.end_ayah === serverLog.end_ayah
      );

      if (existingLog) {
        // Found a matching unsynced local record - link it to the server record instead of creating duplicate
        console.log(`[Sync] Linking existing local record ${existingLog.local_id} to server record ${serverRecordId}`);
        await sqliteManager.updatePrayerLog(existingLog.local_id, {
          server_id: serverRecordId,
          sync_status: SYNC_STATUS.SYNCED,
          last_synced: new Date().toISOString(),
        });
        return;
      }
    }

    if (existingLog) {
      // Check if server version is newer
      const serverUpdated = new Date(serverLog.updated_at);
      const localUpdated = new Date(existingLog.updated_at);

      if (serverUpdated > localUpdated) {
        // Server version is newer, update local
        await sqliteManager.updatePrayerLog(existingLog.local_id, {
          date: serverLog.date,
          start_surah: serverLog.start_surah,
          start_ayah: serverLog.start_ayah,
          end_surah: serverLog.end_surah,
          end_ayah: serverLog.end_ayah,
          total_ayahs: serverLog.total_ayahs,
          status: serverLog.status,
          updated_at: serverLog.updated_at,
          sync_status: SYNC_STATUS.SYNCED,
          last_synced: new Date().toISOString(),
        });
      }
    } else {
      // New record from server, insert locally
      // Mark as SYNCED locally since we're pulling from server (server is source of truth)
      await sqliteManager.insertPrayerLog({
        server_id: serverRecordId,
        user_id: serverLog.custom_user_id || userId,
        date: serverLog.date,
        start_surah: serverLog.start_surah,
        start_ayah: serverLog.start_ayah,
        end_surah: serverLog.end_surah,
        end_ayah: serverLog.end_ayah,
        total_ayahs: serverLog.total_ayahs,
        status: serverLog.status,
        created_at: serverLog.created_at,
        updated_at: serverLog.updated_at,
        sync_status: SYNC_STATUS.SYNCED, // Client-side only: mark as synced
        last_synced: new Date().toISOString(),
        is_deleted: false,
      });
    }
  }

  private async getCurrentUserId(): Promise<string> {
    // Get custom user ID (new architecture)
    const customUserId = await getCachedCustomUserId();
    if (customUserId) {
      return customUserId;
    }

    // If not cached, try to register/get from server
    if (networkManager.isOnline()) {
      try {
        return await registerOrGetCustomUser();
      } catch (error) {
        console.warn('Failed to get custom user ID:', error);
      }
    }

    // Fallback to device ID (offline mode)
    return deviceIdentityManager.getDeviceId();
  }
}

export const syncEngine = new SyncEngine();