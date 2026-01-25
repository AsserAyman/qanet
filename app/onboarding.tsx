import { Feather, MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Language, useI18n } from '../contexts/I18nContext';
import { useNotifications } from '../contexts/NotificationContext';
import { saveReadingPreference } from '../utils/auth/userRegistration';
import {
  OnboardingData,
  onboardingManager,
  ReadingVolume,
} from '../utils/onboarding';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function OnboardingScreen() {
  const { t, language, setLanguage, isRTL } = useI18n();
  const { toggleNotifications } = useNotifications();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);

  const [currentPage, setCurrentPage] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(language);
  const [selectedReadingVolume, setSelectedReadingVolume] =
    useState<ReadingVolume | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  const totalPages = 4;

  const gradientColors = useMemo(
    () => ['#020617', '#172554', '#1e1b4b'] as const,
    [],
  );

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
    if (currentPage === 0) return true;
    if (currentPage === 1) return selectedReadingVolume !== null;
    return true;
  };

  const handleComplete = async (enableNotifications: boolean = false) => {
    if (!selectedReadingVolume) return;

    setIsCompleting(true);

    try {
      const onboardingData: OnboardingData = {
        language: selectedLanguage,
        readingPerNight: selectedReadingVolume,
        notificationsEnabled: enableNotifications,
        completedAt: new Date().toISOString(),
      };

      await onboardingManager.completeOnboarding(onboardingData);

      try {
        await saveReadingPreference(selectedReadingVolume);
      } catch (err) {
        console.warn('⚠️  Failed to save reading preference:', err);
      }

      if (enableNotifications) {
        try {
          await toggleNotifications();
        } catch (err) {
          console.warn('⚠️  Failed to enable notifications:', err);
        }
      }

      router.replace('/(tabs)');
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      setIsCompleting(false);
    }
  };

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
      <Image
        source={require('../assets/images/moon-image.png')}
        style={styles.headerImage}
        contentFit="contain"
      />
      <Text style={styles.headerTitle}>Qanet</Text>
    </View>
  );

  const renderLanguagePage = () => (
    <View style={[styles.page, { width: SCREEN_WIDTH }]}>
      <View style={styles.pageContent}>
        <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'center' }]}>
          {t('chooseYourLanguage')}
        </Text>
        <Text
          style={[styles.subtitle, { textAlign: isRTL ? 'right' : 'center' }]}
        >
          {t('chooseLanguageDesc')}
        </Text>

        <View style={styles.cardContainer}>
          <TouchableOpacity
            style={[
              styles.selectionCard,
              selectedLanguage === 'en' && styles.selectionCardActive,
            ]}
            onPress={() => handleLanguageSelect('en')}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.cardRow,
                { flexDirection: isRTL ? 'row-reverse' : 'row' },
              ]}
            >
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: '#3b82f620',
                    marginRight: isRTL ? 0 : 16,
                    marginLeft: isRTL ? 16 : 0,
                  },
                ]}
              >
                <Text style={{ fontSize: 24 }}>🇺🇸</Text>
              </View>
              <Text
                style={[
                  styles.cardTitle,
                  selectedLanguage === 'en' && styles.activeText,
                  { textAlign: isRTL ? 'right' : 'left' },
                ]}
              >
                English
              </Text>
              {selectedLanguage === 'en' && (
                <View style={styles.checkIcon}>
                  <Feather name="check" size={16} color="#fff" />
                </View>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.selectionCard,
              selectedLanguage === 'ar' && styles.selectionCardActive,
            ]}
            onPress={() => handleLanguageSelect('ar')}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.cardRow,
                { flexDirection: isRTL ? 'row-reverse' : 'row' },
              ]}
            >
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: '#10b98120',
                    marginRight: isRTL ? 0 : 16,
                    marginLeft: isRTL ? 16 : 0,
                  },
                ]}
              >
                <Text style={{ fontSize: 24 }}>🇸🇦</Text>
              </View>
              <Text
                style={[
                  styles.cardTitle,
                  selectedLanguage === 'ar' && styles.activeText,
                  { textAlign: isRTL ? 'right' : 'left' },
                ]}
              >
                العربية
              </Text>
              {selectedLanguage === 'ar' && (
                <View style={styles.checkIcon}>
                  <Feather name="check" size={16} color="#fff" />
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderVolumePage = () => (
    <View style={[styles.page, { width: SCREEN_WIDTH }]}>
      <View style={styles.pageContent}>
        <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'center' }]}>
          {t('tellUsAboutYourReading')}
        </Text>
        <Text
          style={[styles.subtitle, { textAlign: isRTL ? 'right' : 'center' }]}
        >
          {t('readingVolumeDesc')}
        </Text>

        <View style={styles.cardContainer}>
          {(['<10', '10-100', '100-1000', '1000+'] as ReadingVolume[]).map(
            (volume) => (
              <TouchableOpacity
                key={volume}
                style={[
                  styles.selectionCard,
                  selectedReadingVolume === volume &&
                    styles.selectionCardActive,
                ]}
                onPress={() => handleReadingVolumeSelect(volume)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.cardRow,
                    { flexDirection: isRTL ? 'row-reverse' : 'row' },
                  ]}
                >
                  <Text
                    style={[
                      styles.cardTitle,
                      selectedReadingVolume === volume && styles.activeText,
                      { textAlign: isRTL ? 'right' : 'left' },
                    ]}
                  >
                    {t(`readingVolume${volume.replace(/[<>+-]/g, '')}` as any)}
                  </Text>
                  {selectedReadingVolume === volume && (
                    <View style={styles.checkIcon}>
                      <Feather name="check" size={16} color="#fff" />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ),
          )}
        </View>
      </View>
    </View>
  );

  const renderFeaturesPage = () => {
    const features = [
      {
        id: 'negligent',
        icon: 'warning',
        iconType: MaterialIcons,
        color: '#ef4444',
        title: t('negligent'),
        desc: t('negligentDesc'),
      },
      {
        id: 'notnegligent',
        icon: 'moon',
        iconType: Feather,
        color: '#3b82f6',
        title: t('notnegligent'),
        desc: t('notnegligentDesc'),
      },
      {
        id: 'qanet',
        icon: 'military-tech',
        iconType: MaterialIcons,
        color: '#22c55e',
        title: t('qanet'),
        desc: t('qanetDesc'),
      },
      {
        id: 'muqantar',
        icon: 'military-tech',
        iconType: MaterialIcons,
        color: '#a855f7',
        title: t('muqantar'),
        desc: t('muqantarDesc'),
      },
    ];

    return (
      <View style={[styles.page, { width: SCREEN_WIDTH }]}>
        <View style={styles.pageContent}>
          <Text
            style={[
              styles.title,
              { textAlign: isRTL ? 'right' : 'center', marginBottom: 24 },
            ]}
          >
            {t('trackYourJourney')}
          </Text>

          <View style={styles.timelineContainer}>
            {features.map((feature, index) => {
              const Icon = feature.iconType;
              return (
                <View
                  key={feature.id}
                  style={[
                    styles.timelineItem,
                    { flexDirection: isRTL ? 'row-reverse' : 'row' },
                  ]}
                >
                  {/* Timeline Connector */}
                  {index !== features.length - 1 && (
                    <View
                      style={[
                        styles.timelineLine,
                        {
                          backgroundColor: 'rgba(255,255,255,0.1)',
                          left: isRTL ? undefined : 24,
                          right: isRTL ? 24 : undefined,
                        },
                      ]}
                    />
                  )}

                  <View
                    style={[
                      styles.timelineIconBox,
                      {
                        backgroundColor: `${feature.color}20`,
                        marginRight: isRTL ? 0 : 16,
                        marginLeft: isRTL ? 16 : 0,
                      },
                    ]}
                  >
                    <Icon
                      name={feature.icon as any}
                      size={20}
                      color={feature.color}
                    />
                  </View>

                  <View style={styles.timelineContent}>
                    <Text
                      style={[
                        styles.timelineTitle,
                        {
                          textAlign: isRTL ? 'right' : 'left',
                          color: feature.color,
                        },
                      ]}
                    >
                      {feature.title}
                    </Text>
                    <Text
                      style={[
                        styles.timelineDesc,
                        { textAlign: isRTL ? 'right' : 'left' },
                      ]}
                    >
                      {feature.desc}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    );
  };

  const renderNotificationsPage = () => (
    <View style={[styles.page, { width: SCREEN_WIDTH }]}>
      <View
        style={[
          styles.pageContent,
          { alignItems: 'center', justifyContent: 'center', flex: 1 },
        ]}
      >
        <View style={[styles.iconCircle, { marginBottom: 32 }]}>
          <Feather name="bell" size={64} color="#fff" />
        </View>

        <Text style={[styles.title, { textAlign: 'center' }]}>
          {t('stayMotivated')}
        </Text>
        <Text style={[styles.subtitle, { textAlign: 'center', maxWidth: 300 }]}>
          {t('enableNotificationsDesc')}
        </Text>

        <View style={{ height: 40 }} />

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => handleComplete(true)}
          disabled={isCompleting}
          activeOpacity={0.9}
        >
          {isCompleting ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.primaryButtonText}>
              {t('enableNotifications')}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.textButton}
          onPress={() => handleComplete(false)}
          disabled={isCompleting}
        >
          <Text style={styles.textButtonText}>{t('enableLater')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradientColors} style={styles.background} />

      {renderHeader()}

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderLanguagePage()}
        {renderVolumePage()}
        {renderFeaturesPage()}
        {renderNotificationsPage()}
      </ScrollView>

      {/* Navigation Footer */}
      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + 20,
            flexDirection: isRTL ? 'row-reverse' : 'row',
          },
        ]}
      >
        {/* Left Action (Back) */}
        <View style={styles.footerAction}>
          {currentPage > 0 && currentPage < totalPages - 1 && (
            <TouchableOpacity
              onPress={goToPreviousPage}
              style={styles.navButton}
            >
              <Feather
                name={isRTL ? 'arrow-right' : 'arrow-left'}
                size={24}
                color="#fff"
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Indicators */}
        <View style={styles.indicators}>
          {Array.from({ length: totalPages }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                currentPage === index && styles.indicatorActive,
              ]}
            />
          ))}
        </View>

        {/* Right Action (Next) */}
        <View style={styles.footerAction}>
          {currentPage < totalPages - 1 && (
            <TouchableOpacity
              onPress={goToNextPage}
              disabled={!canProceed()}
              style={[
                styles.navButton,
                !canProceed() && styles.navButtonDisabled,
                {
                  backgroundColor: canProceed()
                    ? '#ffffff'
                    : 'rgba(255,255,255,0.1)',
                },
              ]}
            >
              <Feather
                name={isRTL ? 'arrow-left' : 'arrow-right'}
                size={24}
                color={canProceed() ? '#000' : 'rgba(255,255,255,0.3)'}
              />
            </TouchableOpacity>
          )}
        </View>
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
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    alignItems: 'center',
    marginBottom: 10,
  },
  headerImage: {
    width: 120,
    height: 120,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  page: {
    flex: 1,
  },
  pageContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 32,
    lineHeight: 24,
  },
  cardContainer: {
    gap: 12,
  },
  selectionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  selectionCardActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderColor: '#ffffff',
  },
  cardRow: {
    alignItems: 'center',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    flex: 1,
  },
  activeText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Timeline Styles
  timelineContainer: {
    paddingHorizontal: 4,
  },
  timelineItem: {
    alignItems: 'flex-start',
    marginBottom: 24,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    top: 48,
    width: 2,
    height: 30, // Connects to next item
    zIndex: -1,
  },
  timelineIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  timelineContent: {
    flex: 1,
    paddingTop: 2,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  timelineDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 20,
  },
  // Footer / Nav
  footer: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  footerAction: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  indicators: {
    flexDirection: 'row',
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  indicatorActive: {
    width: 24,
    backgroundColor: '#fff',
  },
  // Notification Page specific
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  primaryButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  textButton: {
    padding: 12,
  },
  textButtonText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontWeight: '600',
  },
});
