import { useEffect } from 'react';
import { Redirect, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts, NotoNaskhArabic_400Regular, NotoNaskhArabic_700Bold } from '@expo-google-fonts/noto-naskh-arabic';
import { supabase } from '../utils/supabase';
import { useAuth } from '../hooks/useAuth';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { I18nProvider } from '../contexts/I18nContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { useOfflineData } from '../hooks/useOfflineData';
import { View, ActivityIndicator } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Keep the native splash screen visible while we load resources
try {
  SplashScreen.preventAutoHideAsync();
} catch (e) {
  // During hot refresh, splash screen might already be hidden
  console.warn('SplashScreen.preventAutoHideAsync error:', e);
}

const queryClient = new QueryClient();

function AppContent() {
  const { loading } = useAuth();
  const { theme, isDark } = useTheme();
  const { isInitialized, isLoading: offlineLoading } = useOfflineData();

  const [fontsLoaded] = useFonts({
    'NotoNaskhArabic-Regular': NotoNaskhArabic_400Regular,
    'NotoNaskhArabic-Bold': NotoNaskhArabic_700Bold,
  });

  // Hide splash screen when everything is loaded
  useEffect(() => {
    if (fontsLoaded && !loading && !offlineLoading && isInitialized) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, loading, offlineLoading, isInitialized]);

  // Keep native splash visible while loading (return null instead of ActivityIndicator)
  if (!fontsLoaded || loading || offlineLoading || !isInitialized) {
    return null;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Offline-first: Always show tabs, auth is optional */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* Modal routes - swipeable on iOS */}
        <Stack.Screen
          name="add-prayer"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="edit-prayer/[id]"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="all-history"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
      <StatusBar style={isDark ? "light" : "dark"} />
    </>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <ThemeProvider>
          <NotificationProvider>
            <AppContent />
          </NotificationProvider>
        </ThemeProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}