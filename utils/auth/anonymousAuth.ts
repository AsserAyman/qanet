import { supabase } from '../supabase';
import { deviceIdentityManager } from './deviceIdentity';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerOrGetCustomUser, linkEmailToCustomUser, clearCustomUserId } from './userRegistration';

const ANON_USER_ID_KEY = '@anon_user_id';
const ANON_SESSION_CREATED_KEY = '@anon_session_created';

/**
 * Anonymous Authentication Manager
 *
 * Enables cloud backup and sync WITHOUT requiring email signup.
 * Uses Supabase's anonymous authentication to create temporary user accounts
 * that can later be upgraded to permanent accounts with email.
 *
 * Flow:
 * 1. App launches → Device ID created (offline-first)
 * 2. User goes online → Anonymous Supabase session created
 * 3. Data syncs to cloud without signup
 * 4. User optionally links email → Anonymous account upgraded
 */
class AnonymousAuthManager {
  private anonUserId: string | null = null;
  private isInitialized = false;

  /**
   * Initialize anonymous authentication
   * Attempts to create/restore an anonymous Supabase session
   * Non-blocking: if it fails, app continues working offline
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Check if we already have an active session (could be anonymous or email)
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        this.anonUserId = session.user.id;
        await AsyncStorage.setItem(ANON_USER_ID_KEY, session.user.id);
        this.isInitialized = true;
        return;
      }

      // Try to restore cached anonymous user
      const cachedAnonId = await AsyncStorage.getItem(ANON_USER_ID_KEY);
      if (cachedAnonId) {
        this.anonUserId = cachedAnonId;
        this.isInitialized = true;
        return;
      }

      // Check if we've recently failed (to avoid too many retries)
      // Allow retry after 24 hours
      const lastFailedAttempt = await AsyncStorage.getItem(ANON_SESSION_CREATED_KEY);
      if (lastFailedAttempt === 'failed') {
        const lastAttemptTime = await AsyncStorage.getItem('@anon_last_attempt_time');
        if (lastAttemptTime) {
          const hoursSinceAttempt = (Date.now() - parseInt(lastAttemptTime)) / (1000 * 60 * 60);
          if (hoursSinceAttempt < 24) {
            // Too soon to retry
            this.isInitialized = true;
            return;
          }
        }
        // Clear failed flag to allow retry
        await AsyncStorage.removeItem(ANON_SESSION_CREATED_KEY);
      }

      // Create new anonymous session
      await this.createAnonymousSession();
      this.isInitialized = true;
    } catch (error) {
      console.error('⚠️  Failed to initialize anonymous auth:', error);
      // Don't throw - app should work offline without cloud sync
      this.isInitialized = true;
    }
  }

  /**
   * Create a new anonymous Supabase session
   * Links the session to the device ID for tracking
   */
  private async createAnonymousSession(): Promise<void> {
    try {
      const deviceId = deviceIdentityManager.getDeviceId();

      const { data, error } = await supabase.auth.signInAnonymously({
        options: {
          data: {
            device_id: deviceId,
            is_anonymous_device: true,
          }
        }
      });

      if (error) {
        // Silent failure - mark as failed with timestamp
        if (error.message?.includes('Anonymous sign-ins are disabled')) {
          await AsyncStorage.setItem(ANON_SESSION_CREATED_KEY, 'failed');
          await AsyncStorage.setItem('@anon_last_attempt_time', Date.now().toString());
        }
        console.warn('⚠️  Anonymous session creation failed:', error.message);
        return;
      }

      if (data.user) {
        this.anonUserId = data.user.id;
        await AsyncStorage.setItem(ANON_USER_ID_KEY, data.user.id);
        await AsyncStorage.setItem(ANON_SESSION_CREATED_KEY, 'success');

        // Register custom user after successful anonymous session
        try {
          await registerOrGetCustomUser();
          console.log('✅ Custom user registered after anonymous session');
        } catch (err) {
          console.warn('⚠️  Failed to register custom user (non-blocking):', err);
          // Non-blocking - will retry on next sync
        }
      }
    } catch (error) {
      // Log for debugging but continue - app works offline
      console.warn('[Auth] Anonymous session creation failed:', error);
    }
  }

  /**
   * Get the anonymous user ID if available
   * Returns null if not authenticated
   */
  getAnonymousUserId(): string | null {
    return this.anonUserId;
  }

  /**
   * Check if current user is anonymous (not linked to email)
   */
  async isAnonymous(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    return user.is_anonymous === true || !user.email;
  }

  /**
   * Link anonymous account to email/password
   * Upgrades the anonymous user to a permanent user
   *
   * @param email User's email
   * @param password User's password
   */
  async linkWithEmail(email: string, password: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('No active session to link');
    }

    // 1. Update auth.users with email and password
    const { error: authError } = await supabase.auth.updateUser({
      email,
      password,
    });

    if (authError) {
      throw authError;
    }

    // 2. Update custom users table with email
    try {
      await linkEmailToCustomUser(email, user.id);
      console.log('✅ Email linked to both auth.users and custom users');
    } catch (err) {
      console.error('⚠️  Failed to link email to custom user:', err);
      throw err;
    }
  }

  /**
   * Sign in with email/password
   * Used when user wants to access their account from a new device
   *
   * @param email User's email
   * @param password User's password
   */
  async signInWithEmail(email: string, password: string): Promise<void> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    if (data.user) {
      this.anonUserId = data.user.id;
      await AsyncStorage.setItem(ANON_USER_ID_KEY, data.user.id);

      // Register/get custom user ID
      try {
        await registerOrGetCustomUser();
        console.log('✅ Custom user ID cached after email sign-in');
      } catch (err) {
        console.error('⚠️  Failed to register custom user:', err);
        throw err;
      }
    }
  }

  /**
   * Sign out current user
   * Clears session but keeps local data
   */
  async signOut(): Promise<void> {
    await supabase.auth.signOut();
    this.anonUserId = null;
    await AsyncStorage.removeItem(ANON_USER_ID_KEY);
    await clearCustomUserId();
    console.log('✅ Signed out and cleared custom user ID');
  }

  /**
   * Check if anonymous auth is ready
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Clear cached failed attempts and force retry
   * Useful after enabling anonymous sign-ins in Supabase Dashboard
   */
  async clearFailedAttempts(): Promise<void> {
    await AsyncStorage.removeItem(ANON_SESSION_CREATED_KEY);
    await AsyncStorage.removeItem('@anon_last_attempt_time');
    this.isInitialized = false;
    console.log('✅ Cleared failed anonymous auth attempts - will retry on next initialize()');
  }
}

export const anonymousAuthManager = new AnonymousAuthManager();
