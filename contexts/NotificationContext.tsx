import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

interface NotificationContextType {
  notificationsEnabled: boolean;
  toggleNotifications: () => Promise<void>;
  permissionStatus: Notifications.PermissionStatus | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

const NOTIFICATION_STORAGE_KEY = '@notification_enabled';
const NOTIFICATION_ID = 'daily-prayer-reminder';

// Set up notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [permissionStatus, setPermissionStatus] =
    useState<Notifications.PermissionStatus | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    initializeNotifications();
  }, []);

  const initializeNotifications = async () => {
    try {
      // Create Android notification channel first (required for Android 13+)
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('daily-reminder', {
          name: 'Daily Prayer Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          sound: 'default',
        });
      }

      // Check current permission status
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionStatus(status);

      // Load saved preference
      const savedPreference = await AsyncStorage.getItem(
        NOTIFICATION_STORAGE_KEY
      );
      const enabled = savedPreference === 'true';

      if (enabled && status === 'granted') {
        // Re-schedule notification on app startup if it was enabled
        await scheduleNotification();
      }

      setNotificationsEnabled(enabled);
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const scheduleNotification = async () => {
    try {
      // Cancel any existing notifications first
      await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_ID);

      // Schedule daily notification at 9PM
      await Notifications.scheduleNotificationAsync({
        identifier: NOTIFICATION_ID,
        content: {
          title: 'Time for Night Prayer',
          body: "Don't forget to log your night prayer reading. Strive to read at least 10 verses!",
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 21,
          minute: 0,
        },
      });
    } catch (error) {
      console.error('Failed to schedule notification:', error);
      throw error;
    }
  };

  const toggleNotifications = async () => {
    try {
      if (!notificationsEnabled) {
        // Request permissions
        const { status } = await Notifications.requestPermissionsAsync();
        setPermissionStatus(status);

        if (status !== 'granted') {
          console.log('Notification permission denied');
          return;
        }

        // Enable notifications
        await scheduleNotification();
        await AsyncStorage.setItem(NOTIFICATION_STORAGE_KEY, 'true');
        setNotificationsEnabled(true);
      } else {
        // Disable notifications
        await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_ID);
        await AsyncStorage.setItem(NOTIFICATION_STORAGE_KEY, 'false');
        setNotificationsEnabled(false);
      }
    } catch (error) {
      console.error('Failed to toggle notifications:', error);
    }
  };

  if (!isLoaded) {
    return null; // Wait for initialization
  }

  return (
    <NotificationContext.Provider
      value={{ notificationsEnabled, toggleNotifications, permissionStatus }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      'useNotifications must be used within a NotificationProvider'
    );
  }
  return context;
}
