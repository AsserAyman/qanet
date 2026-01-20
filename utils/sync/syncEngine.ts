import { anonymousAuthManager } from '../auth/anonymousAuth';
import { deviceIdentityManager } from '../auth/deviceIdentity';
import { getCachedCustomUserId, registerOrGetCustomUser } from '../auth/userRegistration';
import { SYNC_STATUS, SyncOperation, TABLES } from '../database/schema';
import { sqliteManager } from '../database/sqlite';
import { networkManager } from '../network/networkManager';
import { supabase } from '../supabase';

const MAX_RETRY_ATTEMPTS = 5;

class SyncEngine {
  private isInitialized = false;
  private isSyncing = false;

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
          // Give up after max retries - remove the operation
          console.error(`Giving up on operation ${operation.id} after ${MAX_RETRY_ATTEMPTS} attempts:`, error instanceof Error ? error.message : 'Unknown error');
          await sqliteManager.removeSyncOperation(operation.id);
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
    const currentLog = await sqliteManager.getPrayerLogById(operation.record_id);

    if (!currentLog) {
      // Record was deleted before sync completed - skip this operation
      console.log(`[Sync] Skipping CREATE for ${operation.record_id} - record no longer exists`);
      return;
    }

    if (currentLog.is_deleted) {
      // Record was deleted before sync completed - skip this operation
      console.log(`[Sync] Skipping CREATE for ${operation.record_id} - record is deleted`);
      return;
    }

    // Check if already synced (sync_status is 'synced')
    if (currentLog.sync_status === SYNC_STATUS.SYNCED) {
      console.log(`[Sync] Skipping CREATE for ${operation.record_id} - already synced`);
      return;
    }

    try {
      // Ensure we have custom user ID
      const customUserId = await this.ensureCustomUserExists();

      // Create prayer_log on server with unified ID (client-generated)
      const { error: prayerLogError } = await supabase
        .from('prayer_logs')
        .insert({
          id: currentLog.id,  // Use the same UUID from client
          user_id: customUserId,
          prayer_date: currentLog.prayer_date,
          created_at: currentLog.created_at,
          updated_at: currentLog.updated_at,
        });

      if (prayerLogError) throw prayerLogError;

      // Insert recitations
      if (currentLog.recitations.length > 0) {
        const recitationInserts = currentLog.recitations.map(rec => ({
          id: rec.id,  // Use the same UUID from client
          prayer_log_id: currentLog.id,
          start_ayah: rec.start_ayah,
          end_ayah: rec.end_ayah,
        }));

        const { error: recitationsError } = await supabase
          .from('recitations')
          .insert(recitationInserts);

        if (recitationsError) throw recitationsError;
      }

      // Update local record as synced
      await sqliteManager.updatePrayerLog(operation.record_id, {
        sync_status: SYNC_STATUS.SYNCED,
      });

      console.log(`[Sync] CREATE successful for ${operation.record_id}`);
    } catch (error: any) {
      // Re-throw to be handled by the caller
      throw error;
    }
  }

  private async syncUpdateOperation(operation: SyncOperation): Promise<void> {
    // Get the current local record
    const currentLog = await sqliteManager.getPrayerLogById(operation.record_id);

    if (!currentLog) {
      // Record was deleted before sync completed - skip this operation
      console.log(`[Sync] Skipping UPDATE for ${operation.record_id} - record no longer exists`);
      return;
    }

    // Check if there's a pending CREATE operation for this record
    const pendingOps = await sqliteManager.getPendingSyncOperations();
    const hasPendingCreate = pendingOps.some(
      op => op.record_id === operation.record_id && op.operation === 'create'
    );

    if (hasPendingCreate) {
      // CREATE is still pending - skip this UPDATE since CREATE will use latest data
      console.log(`[Sync] Skipping UPDATE for ${operation.record_id} - pending CREATE will include latest data`);
      return;
    }

    try {
      // Update prayer_log on server
      const { error: updateError } = await supabase
        .from('prayer_logs')
        .update({
          prayer_date: currentLog.prayer_date,
          updated_at: currentLog.updated_at,
        })
        .eq('id', currentLog.id);

      if (updateError) throw updateError;

      // Replace recitations on server
      // First delete existing recitations
      const { error: deleteError } = await supabase
        .from('recitations')
        .delete()
        .eq('prayer_log_id', currentLog.id);

      if (deleteError) throw deleteError;

      // Then insert new recitations
      if (currentLog.recitations.length > 0) {
        const recitationInserts = currentLog.recitations.map(rec => ({
          id: rec.id,
          prayer_log_id: currentLog.id,
          start_ayah: rec.start_ayah,
          end_ayah: rec.end_ayah,
        }));

        const { error: insertError } = await supabase
          .from('recitations')
          .insert(recitationInserts);

        if (insertError) throw insertError;
      }

      // Update local sync status
      await sqliteManager.updatePrayerLog(operation.record_id, {
        sync_status: SYNC_STATUS.SYNCED,
      });

      console.log(`[Sync] UPDATE successful for ${operation.record_id}`);
    } catch (error: any) {
      throw error;
    }
  }

  private async syncDeleteOperation(operation: SyncOperation): Promise<void> {
    // Get the current local record to check if it exists
    const currentLog = await sqliteManager.getPrayerLogById(operation.record_id);

    try {
      // Delete from server (recitations will cascade delete)
      const { error } = await supabase
        .from('prayer_logs')
        .delete()
        .eq('id', operation.record_id);

      if (error) throw error;

      console.log(`[Sync] DELETE successful for ${operation.record_id}`);
    } catch (error: any) {
      throw error;
    }
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
      .select(`
        *,
        recitations (
          id,
          start_ayah,
          end_ayah
        )
      `)
      .eq('user_id', userId)
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
    });
  }

  private async processServerLog(serverLog: any): Promise<void> {
    const existingLog = await sqliteManager.getPrayerLogById(serverLog.id);

    if (existingLog) {
      // Check if server version is newer
      const serverUpdated = new Date(serverLog.updated_at);
      const localUpdated = new Date(existingLog.updated_at);

      if (serverUpdated > localUpdated) {
        // Server version is newer, update local
        await sqliteManager.updatePrayerLog(existingLog.id, {
          prayer_date: serverLog.prayer_date,
          updated_at: serverLog.updated_at,
          sync_status: SYNC_STATUS.SYNCED,
        });

        // Replace recitations
        const recitations = (serverLog.recitations || []).map((rec: any) => ({
          start_ayah: rec.start_ayah,
          end_ayah: rec.end_ayah,
        }));
        await sqliteManager.replaceRecitationsForPrayerLog(existingLog.id, recitations);
      }
    } else {
      // New record from server, insert locally
      const userId = await this.getCurrentUserId();
      const recitations = (serverLog.recitations || []).map((rec: any) => ({
        start_ayah: rec.start_ayah,
        end_ayah: rec.end_ayah,
      }));

      await sqliteManager.insertPrayerLog(
        {
          user_id: userId,
          prayer_date: serverLog.prayer_date,
          created_at: serverLog.created_at,
          updated_at: serverLog.updated_at,
          sync_status: SYNC_STATUS.SYNCED,
          is_deleted: false,
        },
        recitations
      );
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
