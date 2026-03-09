import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert, Linking, Platform } from 'react-native';

interface NotificationContextType {
  notificationsEnabled: boolean;
  toggleNotifications: () => Promise<void>;
  permissionStatus: Notifications.PermissionStatus | null;
  notificationHour: number;
  notificationMinute: number;
  setNotificationTime: (hour: number, minute: number) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

const NOTIFICATION_STORAGE_KEY = '@notification_enabled';
const NOTIFICATION_TIME_STORAGE_KEY = '@notification_time';
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
  const [notificationHour, setNotificationHour] = useState(21);
  const [notificationMinute, setNotificationMinute] = useState(0);
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

      // Load saved time preference
      const savedTime = await AsyncStorage.getItem(NOTIFICATION_TIME_STORAGE_KEY);
      let hour = 21;
      let minute = 0;
      if (savedTime) {
        const parsed = JSON.parse(savedTime);
        hour = parsed.hour;
        minute = parsed.minute;
        setNotificationHour(hour);
        setNotificationMinute(minute);
      }

      // Load saved preference
      const savedPreference = await AsyncStorage.getItem(
        NOTIFICATION_STORAGE_KEY
      );
      const enabled = savedPreference === 'true';

      if (enabled && status === 'granted') {
        // Re-schedule notification on app startup if it was enabled
        await scheduleNotification(hour, minute);
      }

      setNotificationsEnabled(enabled);
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const scheduleNotification = async (hour: number = 21, minute: number = 0) => {
    try {
      // Cancel any existing notifications first
      await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_ID);

      await Notifications.scheduleNotificationAsync({
        identifier: NOTIFICATION_ID,
        content: {
          title: 'Time for Night Prayer',
          body: "Don't forget to log your night prayer reading. Strive to read at least 10 verses!",
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
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
          Alert.alert(
            'Notifications Disabled',
            'To enable notifications, please go to your device Settings and allow notifications for this app.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
          );
          return;
        }

        // Enable notifications
        await scheduleNotification(notificationHour, notificationMinute);
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

  const setNotificationTime = async (hour: number, minute: number) => {
    try {
      setNotificationHour(hour);
      setNotificationMinute(minute);
      await AsyncStorage.setItem(
        NOTIFICATION_TIME_STORAGE_KEY,
        JSON.stringify({ hour, minute })
      );
      if (notificationsEnabled) {
        await scheduleNotification(hour, minute);
      }
    } catch (error) {
      console.error('Failed to set notification time:', error);
    }
  };

  if (!isLoaded) {
    return null; // Wait for initialization
  }

  return (
    <NotificationContext.Provider
      value={{
        notificationsEnabled,
        toggleNotifications,
        permissionStatus,
        notificationHour,
        notificationMinute,
        setNotificationTime,
      }}
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
