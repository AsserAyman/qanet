import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language } from '../contexts/I18nContext';

const ONBOARDING_COMPLETED_KEY = '@onboarding_completed';
const ONBOARDING_VERSION_KEY = '@onboarding_version';
const ONBOARDING_DATA_KEY = '@onboarding_data';

// Current onboarding version - increment this when you add new onboarding screens
const CURRENT_ONBOARDING_VERSION = '1.0.0';

export type ReadingVolume = '<10' | '10-100' | '100-1000' | '1000+';

export interface OnboardingData {
  language: Language;
  readingPerNight: ReadingVolume;
  notificationsEnabled?: boolean;
  completedAt: string;
}

/**
 * Onboarding Manager
 *
 * Handles first-time user onboarding experience
 * Tracks completion status and stores user preferences
 */
class OnboardingManager {
  /**
   * Check if user has completed onboarding
   * Returns false on first launch
   */
  async isOnboardingCompleted(): Promise<boolean> {
    try {
      const completed = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
      return completed === 'true';
    } catch (error) {
      console.error('Failed to check onboarding status:', error);
      return false;
    }
  }

  /**
   * Get the version of onboarding the user completed
   * Used to show updated onboarding if app has new features
   */
  async getCompletedVersion(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(ONBOARDING_VERSION_KEY);
    } catch (error) {
      console.error('Failed to get onboarding version:', error);
      return null;
    }
  }

  /**
   * Check if user needs to see updated onboarding
   * (Current version is different from completed version)
   */
  async needsOnboardingUpdate(): Promise<boolean> {
    const completedVersion = await this.getCompletedVersion();
    if (!completedVersion) return false;
    return completedVersion !== CURRENT_ONBOARDING_VERSION;
  }

  /**
   * Save temporary onboarding data during the flow
   * This gets stored locally until user completes onboarding
   */
  async saveTemporaryData(data: Partial<OnboardingData>): Promise<void> {
    try {
      const existing = await this.getTemporaryData();
      const updated = { ...existing, ...data };
      await AsyncStorage.setItem(ONBOARDING_DATA_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save temporary onboarding data:', error);
      throw error;
    }
  }

  /**
   * Get temporary onboarding data
   */
  async getTemporaryData(): Promise<Partial<OnboardingData>> {
    try {
      const data = await AsyncStorage.getItem(ONBOARDING_DATA_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Failed to get temporary onboarding data:', error);
      return {};
    }
  }

  /**
   * Mark onboarding as completed
   * Saves the completion status and version
   */
  async completeOnboarding(data: OnboardingData): Promise<void> {
    try {
      // Save completion flag
      await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');

      // Save version
      await AsyncStorage.setItem(ONBOARDING_VERSION_KEY, CURRENT_ONBOARDING_VERSION);

      // Save final data
      await AsyncStorage.setItem(ONBOARDING_DATA_KEY, JSON.stringify(data));

      console.log('✅ Onboarding completed:', data);
    } catch (error) {
      console.error('Failed to mark onboarding as completed:', error);
      throw error;
    }
  }

  /**
   * Get completed onboarding data
   */
  async getOnboardingData(): Promise<OnboardingData | null> {
    try {
      const data = await AsyncStorage.getItem(ONBOARDING_DATA_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to get onboarding data:', error);
      return null;
    }
  }

  /**
   * Reset onboarding (for testing or if user wants to see it again)
   */
  async resetOnboarding(): Promise<void> {
    try {
      await AsyncStorage.removeItem(ONBOARDING_COMPLETED_KEY);
      await AsyncStorage.removeItem(ONBOARDING_VERSION_KEY);
      await AsyncStorage.removeItem(ONBOARDING_DATA_KEY);
      console.log('✅ Onboarding reset');
    } catch (error) {
      console.error('Failed to reset onboarding:', error);
      throw error;
    }
  }

  /**
   * Get current onboarding version
   */
  getCurrentVersion(): string {
    return CURRENT_ONBOARDING_VERSION;
  }
}

export const onboardingManager = new OnboardingManager();
