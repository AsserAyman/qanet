import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';
import { deviceIdentityManager } from './deviceIdentity';
import { offlineDataManager } from '../database/offlineDataManager';
import { anonymousAuthManager } from './anonymousAuth';

/**
 * Deletes all user data both locally and in the cloud.
 * This is used for App Store/Play Store compliance with "Delete my data" requirements.
 *
 * Flow:
 * 1. Initialize device identity manager
 * 2. Call Supabase RPC to anonymize cloud data (user_id set to NULL)
 * 3. Clear local SQLite database
 * 4. Sign out from Supabase (clears anonymous session + auth state)
 * 5. Clear all remaining AsyncStorage keys
 * 6. Clear SecureStore (device identity)
 *
 * After this, the app will detect onboarding is not complete and redirect to onboarding.
 */
export async function deleteAllUserData(): Promise<void> {
  // 1. Ensure device identity is initialized, then get device_id
  await deviceIdentityManager.initialize();
  const deviceId = deviceIdentityManager.getDeviceId();

  // 2. Call Supabase RPC to anonymize cloud data
  const { error: rpcError } = await supabase.rpc('delete_user_data', {
    p_device_id: deviceId,
  });

  if (rpcError) {
    console.error('Failed to delete cloud data:', rpcError);
    throw new Error('Failed to delete cloud data');
  }

  // 3. Clear SQLite database
  await offlineDataManager.clearAllLocalData();

  // 4. Sign out from Supabase (clears anonymous session + custom user ID)
  await anonymousAuthManager.signOut();

  // 5. Clear remaining AsyncStorage keys
  const keysToRemove = [
    '@onboarding_completed',
    '@onboarding_version',
    '@onboarding_data',
    '@qanet_themed_colors_enabled',
    '@app_language',
    '@notification_enabled',
    '@anon_session_created',
    '@anon_last_attempt_time',
    '@cached_user_id',
  ];
  await AsyncStorage.multiRemove(keysToRemove);

  // 6. Clear SecureStore (device identity)
  await deviceIdentityManager.clearDeviceIdentity();
}
