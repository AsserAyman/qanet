import { supabase } from '../supabase';
import { deviceIdentityManager } from './deviceIdentity';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CUSTOM_USER_ID_KEY = '@custom_user_id';

/**
 * User Registration Manager
 *
 * Manages custom user records in the public.users table.
 * Links device IDs to custom user IDs for offline-first identity.
 *
 * Flow:
 * 1. Device ID generated on first launch (SecureStore)
 * 2. When online, create custom user record with device_id
 * 3. Custom user ID cached locally for offline access
 * 4. Custom user ID used for all data operations
 */

/**
 * Register or get custom user record
 * Creates a new custom user if one doesn't exist for this device
 *
 * @returns Custom user ID (UUID)
 */
export async function registerOrGetCustomUser(): Promise<string> {
  // Check cache first (fastest, works offline)
  const cachedUserId = await getCachedCustomUserId();
  if (cachedUserId) {
    return cachedUserId;
  }

  // Get device_id from SecureStore
  const deviceId = deviceIdentityManager.getDeviceId();

  // Get auth session (if available)
  const { data: { user } } = await supabase.auth.getUser();
  const authUserId = user?.id || null;

  // Call Supabase RPC to get or create custom user
  const { data, error } = await supabase.rpc('get_or_create_user_by_device_id', {
    p_device_id: deviceId,
    p_auth_user_id: authUserId
  });

  if (error) {
    console.error('Failed to register custom user:', error);
    throw new Error(`Failed to register custom user: ${error.message}`);
  }

  // Cache the custom user ID
  await AsyncStorage.setItem(CUSTOM_USER_ID_KEY, data);

  console.log('✅ Custom user registered:', data);
  return data;
}

/**
 * Get cached custom user ID
 * Returns null if not cached
 *
 * @returns Custom user ID or null
 */
export async function getCachedCustomUserId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(CUSTOM_USER_ID_KEY);
  } catch (error) {
    console.error('Failed to get cached custom user ID:', error);
    return null;
  }
}

/**
 * Clear cached custom user ID
 * Used when signing out or resetting the app
 */
export async function clearCustomUserId(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CUSTOM_USER_ID_KEY);
    console.log('✅ Custom user ID cleared');
  } catch (error) {
    console.error('Failed to clear custom user ID:', error);
  }
}

/**
 * Link email to current custom user
 * Updates the custom users table with email and auth_user_id
 *
 * @param email User's email
 * @param authUserId Auth user ID from Supabase auth
 */
export async function linkEmailToCustomUser(
  email: string,
  authUserId: string
): Promise<void> {
  const customUserId = await getCachedCustomUserId();
  if (!customUserId) {
    throw new Error('No custom user ID found. Cannot link email.');
  }

  // Update custom users table
  const { error } = await supabase
    .from('users')
    .update({
      email,
      auth_user_id: authUserId,
      email_verified: false, // Will be set to true after email verification
      updated_at: new Date().toISOString()
    })
    .eq('id', customUserId);

  if (error) {
    console.error('Failed to link email to custom user:', error);
    throw new Error(`Failed to link email: ${error.message}`);
  }

  console.log('✅ Email linked to custom user:', email);
}

/**
 * Get custom user record from server
 * Fetches full user record including email, device_id, etc.
 *
 * @returns Custom user record or null
 */
export async function getCustomUserRecord(): Promise<{
  id: string;
  device_id: string;
  auth_user_id: string | null;
  email: string | null;
  email_verified: boolean;
  created_at: string;
} | null> {
  const customUserId = await getCachedCustomUserId();
  if (!customUserId) {
    return null;
  }

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', customUserId)
    .single();

  if (error) {
    console.error('Failed to get custom user record:', error);
    return null;
  }

  return data;
}

/**
 * Check if custom user has email linked
 *
 * @returns True if email is linked
 */
export async function hasEmailLinked(): Promise<boolean> {
  const userRecord = await getCustomUserRecord();
  return userRecord?.email !== null;
}

/**
 * Save user's reading per night preference
 * Called during onboarding or when user updates preference
 *
 * @param readingPerNight Reading volume: <10, 10-100, 100-1000, 1000+
 */
export async function saveReadingPreference(
  readingPerNight: '<10' | '10-100' | '100-1000' | '1000+'
): Promise<void> {
  const customUserId = await getCachedCustomUserId();
  if (!customUserId) {
    throw new Error('No custom user ID found. Cannot save reading preference.');
  }

  // Update custom users table
  const { error } = await supabase
    .from('users')
    .update({
      reading_per_night: readingPerNight,
      updated_at: new Date().toISOString()
    })
    .eq('id', customUserId);

  if (error) {
    console.error('Failed to save reading preference:', error);
    throw new Error(`Failed to save reading preference: ${error.message}`);
  }

  console.log('✅ Reading preference saved:', readingPerNight);
}
