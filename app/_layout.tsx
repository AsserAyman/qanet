import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
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
import { onboardingManager } from '../utils/onboarding';

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
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState<boolean | null>(null);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  const [fontsLoaded] = useFonts({
    'NotoNaskhArabic-Regular': NotoNaskhArabic_400Regular,
    'NotoNaskhArabic-Bold': NotoNaskhArabic_700Bold,
  });

  // Check onboarding status
  useEffect(() => {
    const checkOnboarding = async () => {
      const completed = await onboardingManager.isOnboardingCompleted();
      setIsOnboardingCompleted(completed);
      console.log('Onboarding completed:', completed);
    };
    checkOnboarding();
  }, []);

  // Navigate based on onboarding status
  useEffect(() => {
    if (isOnboardingCompleted === null || isCheckingOnboarding) {
      console.log('⏳ Onboarding status not loaded yet or checking...');
      return;
    }

    const inOnboarding = segments[0] === 'onboarding';
    const inTabs = segments[0] === '(tabs)';

    console.log('📍 Current segments:', segments);
    console.log('✅ Onboarding completed:', isOnboardingCompleted);
    console.log('📱 In onboarding screen:', inOnboarding);

    // If we just navigated to tabs, re-check status to be sure
    if (inTabs && !isOnboardingCompleted) {
      console.log('🔄 Re-checking onboarding status after navigation to tabs...');
      setIsCheckingOnboarding(true);
      onboardingManager.isOnboardingCompleted().then((completed) => {
        console.log('🔄 Updated onboarding status:', completed);
        setIsOnboardingCompleted(completed);
        setIsCheckingOnboarding(false);

        // If still not completed, redirect back to onboarding
        if (!completed) {
          console.log('🚀 Still not completed, redirecting to onboarding...');
          router.replace('/onboarding');
        }
      });
      return; // Don't run redirect logic while checking
    }

    if (!isOnboardingCompleted && !inOnboarding) {
      // Not completed and not on onboarding screen -> redirect to onboarding
      console.log('🚀 Redirecting to onboarding...');
      router.replace('/onboarding');
    } else if (isOnboardingCompleted && inOnboarding) {
      // Completed but still on onboarding screen -> redirect to main app
      console.log('🏠 Redirecting to main app...');
      router.replace('/(tabs)');
    }
  }, [isOnboardingCompleted, segments, isCheckingOnboarding]);

  // Hide splash screen when everything is loaded
  useEffect(() => {
    if (fontsLoaded && !loading && !offlineLoading && isInitialized && isOnboardingCompleted !== null) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, loading, offlineLoading, isInitialized, isOnboardingCompleted]);

  // Keep native splash visible while loading (return null instead of ActivityIndicator)
  if (!fontsLoaded || loading || offlineLoading || !isInitialized || isOnboardingCompleted === null) {
    return null;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
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