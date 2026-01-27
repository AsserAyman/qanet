import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

const DEVICE_ID_KEY = 'qanet_device_id';
const DEVICE_SECRET_KEY = 'qanet_device_secret';

/**
 * Device Identity Manager
 *
 * Manages a persistent device identity that allows the app to work 100% offline
 * without any authentication. Each device gets a unique UUID that persists
 * across app restarts.
 *
 * This is the foundation of the offline-first architecture:
 * - Device ID is created on first launch
 * - Stored securely in Expo SecureStore
 * - Used as fallback user_id when no Supabase auth exists
 */
class DeviceIdentityManager {
  private deviceId: string | null = null;
  private deviceSecret: string | null = null;
  private isInitialized = false;
  private initPromise: Promise<string> | null = null;

  /**
   * Initialize the device identity system
   * Creates a new device ID if one doesn't exist, or loads existing ID
   * Thread-safe: concurrent calls will wait for the same initialization
   *
   * @returns The device ID (UUID)
   */
  async initialize(): Promise<string> {
    if (this.isInitialized && this.deviceId) {
      return this.deviceId;
    }

    // Prevent race condition: if initialization is in progress, wait for it
    if (this.initPromise) {
      return this.initPromise;
    }

    // Start initialization and store the promise
    this.initPromise = this.doInitialize();

    try {
      return await this.initPromise;
    } finally {
      // Clear the promise after completion (success or failure)
      this.initPromise = null;
    }
  }

  private async doInitialize(): Promise<string> {
    try {
      // Try to get existing device ID
      let deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);

      if (!deviceId) {
        // First launch - generate new device identity
        deviceId = Crypto.randomUUID();
        await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);

        // Also generate a device secret for future cryptographic signing if needed
        const deviceSecret = Crypto.randomUUID();
        await SecureStore.setItemAsync(DEVICE_SECRET_KEY, deviceSecret);
      }

      this.deviceId = deviceId;
      this.isInitialized = true;
      return deviceId;
    } catch (error) {
      console.error('❌ Failed to initialize device identity:', error);
      throw error;
    }
  }

  /**
   * Get the current device ID
   * Must call initialize() first!
   *
   * @returns Device ID (UUID)
   * @throws Error if not initialized
   */
  getDeviceId(): string {
    if (!this.deviceId) {
      throw new Error('DeviceIdentityManager not initialized. Call initialize() first.');
    }
    return this.deviceId;
  }

  /**
   * Get the device secret (for future cryptographic operations)
   *
   * @returns Device secret (UUID)
   * @throws Error if secret not found
   */
  async getDeviceSecret(): Promise<string> {
    if (!this.deviceSecret) {
      const secret = await SecureStore.getItemAsync(DEVICE_SECRET_KEY);
      if (!secret) {
        throw new Error('No device secret found. This should not happen after initialization.');
      }
      this.deviceSecret = secret;
    }
    return this.deviceSecret;
  }

  /**
   * Check if device identity is initialized
   */
  isReady(): boolean {
    return this.isInitialized && this.deviceId !== null;
  }

  /**
   * Clear device identity (for testing or account removal)
   * WARNING: This will make local data inaccessible!
   */
  async clearDeviceIdentity(): Promise<void> {
    await SecureStore.deleteItemAsync(DEVICE_ID_KEY);
    await SecureStore.deleteItemAsync(DEVICE_SECRET_KEY);
    this.deviceId = null;
    this.deviceSecret = null;
    this.isInitialized = false;
    console.log('⚠️  Device identity cleared');
  }
}

export const deviceIdentityManager = new DeviceIdentityManager();
