import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useI18n, Language } from '../contexts/I18nContext';
import { useNotifications } from '../contexts/NotificationContext';
import {
  onboardingManager,
  ReadingVolume,
  OnboardingData,
} from '../utils/onboarding';
import { saveReadingPreference } from '../utils/auth/userRegistration';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function OnboardingScreen() {
  const { t, language, setLanguage, isRTL } = useI18n();
  const { toggleNotifications } = useNotifications();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);

  const [currentPage, setCurrentPage] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(language);
  const [selectedReadingVolume, setSelectedReadingVolume] =
    useState<ReadingVolume | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  const totalPages = 4;

  const handleLanguageSelect = async (lang: Language) => {
    setSelectedLanguage(lang);
    await setLanguage(lang);
    await onboardingManager.saveTemporaryData({ language: lang });
  };

  const handleReadingVolumeSelect = (volume: ReadingVolume) => {
    setSelectedReadingVolume(volume);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      const nextPage = currentPage + 1;
      scrollViewRef.current?.scrollTo({
        x: nextPage * SCREEN_WIDTH,
        animated: true,
      });
      setCurrentPage(nextPage);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 0) {
      const prevPage = currentPage - 1;
      scrollViewRef.current?.scrollTo({
        x: prevPage * SCREEN_WIDTH,
        animated: true,
      });
      setCurrentPage(prevPage);
    }
  };

  const canProceed = () => {
    if (currentPage === 0) return true; // Language page (already selected)
    if (currentPage === 1) return selectedReadingVolume !== null;
    return true;
  };

  const handleComplete = async (enableNotifications: boolean = false) => {
    if (!selectedReadingVolume) {
      return;
    }

    setIsCompleting(true);

    try {
      // Save onboarding data
      const onboardingData: OnboardingData = {
        language: selectedLanguage,
        readingPerNight: selectedReadingVolume,
        notificationsEnabled: enableNotifications,
        completedAt: new Date().toISOString(),
      };

      await onboardingManager.completeOnboarding(onboardingData);

      // Save reading preference to Supabase (non-blocking)
      try {
        await saveReadingPreference(selectedReadingVolume);
      } catch (err) {
        console.warn('⚠️  Failed to save reading preference (non-blocking):', err);
        // Continue anyway - will sync later
      }

      // Enable notifications if requested
      if (enableNotifications) {
        try {
          await toggleNotifications();
        } catch (err) {
          console.warn('⚠️  Failed to enable notifications:', err);
        }
      }

      // Navigate to main app
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      setIsCompleting(false);
    }
  };

  const renderLanguagePage = () => (
    <View style={[styles.page, { width: SCREEN_WIDTH }]}>
      <View style={styles.pageContent}>
        <View style={styles.iconContainer}>
          <Feather name="globe" size={48} color="#ffffff" />
        </View>

        <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}>
          {t('chooseYourLanguage')}
        </Text>
        <Text
          style={[styles.description, { textAlign: isRTL ? 'right' : 'left' }]}
        >
          {t('chooseLanguageDesc')}
        </Text>

        <View style={styles.languageOptions}>
          <TouchableOpacity
            style={[
              styles.languageOption,
              selectedLanguage === 'en' && styles.languageOptionActive,
            ]}
            onPress={() => handleLanguageSelect('en')}
          >
            <View style={styles.languageContent}>
              <Text
                style={[
                  styles.languageText,
                  selectedLanguage === 'en' && styles.languageTextActive,
                ]}
              >
                English
              </Text>
              {selectedLanguage === 'en' && (
                <Feather name="check-circle" size={24} color="#ffffff" />
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.languageOption,
              selectedLanguage === 'ar' && styles.languageOptionActive,
            ]}
            onPress={() => handleLanguageSelect('ar')}
          >
            <View style={styles.languageContent}>
              <Text
                style={[
                  styles.languageText,
                  selectedLanguage === 'ar' && styles.languageTextActive,
                ]}
              >
                العربية
              </Text>
              {selectedLanguage === 'ar' && (
                <Feather name="check-circle" size={24} color="#ffffff" />
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderReadingVolumePage = () => (
    <View style={[styles.page, { width: SCREEN_WIDTH }]}>
      <View style={styles.pageContent}>
        <View style={styles.iconContainer}>
          <Feather name="book-open" size={48} color="#ffffff" />
        </View>

        <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}>
          {t('tellUsAboutYourReading')}
        </Text>
        <Text
          style={[styles.description, { textAlign: isRTL ? 'right' : 'left' }]}
        >
          {t('readingVolumeDesc')}
        </Text>

        <View style={styles.readingOptions}>
          {(['<10', '10-100', '100-1000', '1000+'] as ReadingVolume[]).map(
            (volume) => (
              <TouchableOpacity
                key={volume}
                style={[
                  styles.readingOption,
                  selectedReadingVolume === volume &&
                    styles.readingOptionActive,
                ]}
                onPress={() => handleReadingVolumeSelect(volume)}
              >
                <View style={styles.readingContent}>
                  <Text
                    style={[
                      styles.readingText,
                      { textAlign: isRTL ? 'right' : 'left' },
                      selectedReadingVolume === volume &&
                        styles.readingTextActive,
                    ]}
                  >
                    {t(`readingVolume${volume.replace(/[<>+-]/g, '')}` as any)}
                  </Text>
                  {selectedReadingVolume === volume && (
                    <Feather name="check-circle" size={20} color="#ffffff" />
                  )}
                </View>
              </TouchableOpacity>
            )
          )}
        </View>
      </View>
    </View>
  );

  const renderFeaturePage = () => (
    <View style={[styles.page, { width: SCREEN_WIDTH }]}>
      <View style={styles.pageContent}>
        <View style={styles.iconContainer}>
          <Feather name="star" size={48} color="#ffffff" />
        </View>

        <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}>
          {t('trackYourJourney')}
        </Text>

        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <View
              style={[
                styles.featureIconContainer,
                { backgroundColor: 'rgba(239, 68, 68, 0.2)' },
              ]}
            >
              <MaterialIcons name="warning" size={24} color="#ef4444" />
            </View>
            <View style={styles.featureTextContainer}>
              <Text
                style={[
                  styles.featureTitle,
                  { textAlign: isRTL ? 'right' : 'left' },
                ]}
              >
                {t('negligent')}
              </Text>
              <Text
                style={[
                  styles.featureDescription,
                  { textAlign: isRTL ? 'right' : 'left' },
                ]}
              >
                {t('negligentDesc')}
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View
              style={[
                styles.featureIconContainer,
                { backgroundColor: 'rgba(59, 130, 246, 0.2)' },
              ]}
            >
              <Feather name="moon" size={24} color="#3b82f6" />
            </View>
            <View style={styles.featureTextContainer}>
              <Text
                style={[
                  styles.featureTitle,
                  { textAlign: isRTL ? 'right' : 'left' },
                ]}
              >
                {t('notnegligent')}
              </Text>
              <Text
                style={[
                  styles.featureDescription,
                  { textAlign: isRTL ? 'right' : 'left' },
                ]}
              >
                {t('notnegligentDesc')}
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View
              style={[
                styles.featureIconContainer,
                { backgroundColor: 'rgba(34, 197, 94, 0.2)' },
              ]}
            >
              <MaterialIcons name="military-tech" size={24} color="#22c55e" />
            </View>
            <View style={styles.featureTextContainer}>
              <Text
                style={[
                  styles.featureTitle,
                  { textAlign: isRTL ? 'right' : 'left' },
                ]}
              >
                {t('qanet')}
              </Text>
              <Text
                style={[
                  styles.featureDescription,
                  { textAlign: isRTL ? 'right' : 'left' },
                ]}
              >
                {t('qanetDesc')}
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View
              style={[
                styles.featureIconContainer,
                { backgroundColor: 'rgba(168, 85, 247, 0.2)' },
              ]}
            >
              <MaterialIcons name="military-tech" size={24} color="#a855f7" />
            </View>
            <View style={styles.featureTextContainer}>
              <Text
                style={[
                  styles.featureTitle,
                  { textAlign: isRTL ? 'right' : 'left' },
                ]}
              >
                {t('mokantar')}
              </Text>
              <Text
                style={[
                  styles.featureDescription,
                  { textAlign: isRTL ? 'right' : 'left' },
                ]}
              >
                {t('mokantarDesc')}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  const renderNotificationPage = () => (
    <View style={[styles.page, { width: SCREEN_WIDTH }]}>
      <View style={styles.pageContent}>
        <View style={styles.iconContainer}>
          <Feather name="bell" size={48} color="#ffffff" />
        </View>

        <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}>
          {t('stayMotivated')}
        </Text>
        <Text
          style={[styles.description, { textAlign: isRTL ? 'right' : 'left' }]}
        >
          {t('enableNotificationsDesc')}
        </Text>

        <View style={styles.notificationActions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => handleComplete(true)}
            disabled={isCompleting}
          >
            {isCompleting ? (
              <ActivityIndicator color="#000000" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {t('enableNotifications')}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => handleComplete(false)}
            disabled={isCompleting}
          >
            <Text style={styles.secondaryButtonText}>{t('enableLater')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1e3a8a', '#312e81', '#1e1b4b']}
        style={styles.background}
      />

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderLanguagePage()}
        {renderReadingVolumePage()}
        {renderFeaturePage()}
        {renderNotificationPage()}
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigation}>
        {/* Back Button */}
        {currentPage > 0 && currentPage < totalPages - 1 && (
          <TouchableOpacity
            style={[
              styles.navButton,
              isRTL ? styles.navButtonRight : styles.navButtonLeft,
            ]}
            onPress={goToPreviousPage}
          >
            <Feather
              name={isRTL ? 'arrow-right' : 'arrow-left'}
              size={24}
              color="#ffffff"
            />
          </TouchableOpacity>
        )}

        {/* Page Indicators */}
        <View style={styles.pageIndicators}>
          {Array.from({ length: totalPages }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.pageIndicator,
                currentPage === index && styles.pageIndicatorActive,
              ]}
            />
          ))}
        </View>

        {/* Next/Skip Button */}
        {currentPage < totalPages - 1 && (
          <TouchableOpacity
            style={[
              styles.navButton,
              isRTL ? styles.navButtonLeft : styles.navButtonRight,
              !canProceed() && styles.navButtonDisabled,
            ]}
            onPress={goToNextPage}
            disabled={!canProceed()}
          >
            {currentPage === 0 || currentPage === 2 ? (
              <Text style={styles.skipText}>{t('skip')}</Text>
            ) : (
              <Feather
                name={isRTL ? 'arrow-left' : 'arrow-right'}
                size={24}
                color="#ffffff"
              />
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '100%',
  },
  scrollContent: {
    flexDirection: 'row',
  },
  page: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  pageContent: {
    width: '100%',
    maxWidth: 400,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 32,
    lineHeight: 24,
  },
  languageOptions: {
    gap: 16,
  },
  languageOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  languageOptionActive: {
    borderColor: '#ffffff',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  languageContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  languageText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
  },
  languageTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  readingOptions: {
    gap: 12,
  },
  readingOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  readingOptionActive: {
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  readingContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  readingText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
    flex: 1,
  },
  readingTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  featuresContainer: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  notificationActions: {
    gap: 16,
    marginTop: 32,
  },
  primaryButton: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  navigation: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  navButton: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  navButtonLeft: {
    left: 32,
  },
  navButtonRight: {
    right: 32,
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  pageIndicators: {
    flexDirection: 'row',
    gap: 8,
  },
  pageIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  pageIndicatorActive: {
    backgroundColor: '#ffffff',
    width: 24,
  },
});
