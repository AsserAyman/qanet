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
import { saveOnboardingPreferences } from '../utils/auth/userRegistration';
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
  const [selectedGender, setSelectedGender] = useState<boolean | null>(null);
  const [selectedReadingVolume, setSelectedReadingVolume] =
    useState<ReadingVolume | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  const totalPages = 6;

  const gradientColors = useMemo(
    () => ['#020617', '#172554', '#1e1b4b'] as const,
    [],
  );

  const handleLanguageSelect = async (lang: Language) => {
    setSelectedLanguage(lang);
    await setLanguage(lang);
    await onboardingManager.saveTemporaryData({ language: lang });
  };

  const handleGenderSelect = (isMale: boolean) => {
    setSelectedGender(isMale);
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
    if (currentPage === 0) return true; // Language page
    if (currentPage === 1) return true; // Purpose page
    if (currentPage === 2) return selectedGender !== null; // Gender page
    if (currentPage === 3) return selectedReadingVolume !== null; // Reading volume page
    return true;
  };

  const handleComplete = async (enableNotifications: boolean = false) => {
    if (!selectedReadingVolume || selectedGender === null) return;

    setIsCompleting(true);

    try {
      const onboardingData: OnboardingData = {
        language: selectedLanguage,
        isMale: selectedGender,
        readingPerNight: selectedReadingVolume,
        notificationsEnabled: enableNotifications,
        completedAt: new Date().toISOString(),
      };

      await onboardingManager.completeOnboarding(onboardingData);

      try {
        await saveOnboardingPreferences(
          selectedGender,
          selectedLanguage,
          selectedReadingVolume,
        );
      } catch (err) {
        console.warn('⚠️  Failed to save onboarding preferences:', err);
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

  const renderPageHeader = () => (
    <View style={styles.pageHeader}>
      <Image
        source={require('../assets/images/moon-image.png')}
        style={styles.headerImageLarge}
        contentFit="contain"
      />
      <Text style={styles.headerTitle}>Qanet</Text>
      <View style={{ height: 32 }} />
    </View>
  );

  const renderLanguagePage = () => (
    <View style={[styles.page, { width: SCREEN_WIDTH }]}>
      <View
        style={[
          styles.pageContent,
          { alignItems: 'center', justifyContent: 'center', flex: 1 },
        ]}
      >
        <Image
          source={require('../assets/images/moon-image.png')}
          style={styles.headerImageLarge}
          contentFit="contain"
        />
        <Text style={styles.headerTitle}>Qanet</Text>

        <View style={{ height: 32 }} />

        <Text style={[styles.title, { textAlign: 'center' }]}>
          {t('chooseYourLanguage')}
        </Text>
        <Text style={[styles.subtitle, { textAlign: 'center' }]}>
          {t('chooseLanguageDesc')}
        </Text>

        <View style={[styles.cardContainer, { width: '100%' }]}>
          <TouchableOpacity
            style={[
              styles.langCard,
              selectedLanguage === 'en' && styles.langCardActive,
            ]}
            onPress={() => handleLanguageSelect('en')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.langText,
                selectedLanguage === 'en' && styles.langTextActive,
              ]}
            >
              English
            </Text>
            {selectedLanguage === 'en' && (
              <View style={styles.checkIcon}>
                <Feather name="check" size={14} color="#fff" />
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.langCard,
              selectedLanguage === 'ar' && styles.langCardActive,
            ]}
            onPress={() => handleLanguageSelect('ar')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.langText,
                selectedLanguage === 'ar' && styles.langTextActive,
              ]}
            >
              العربية
            </Text>
            {selectedLanguage === 'ar' && (
              <View style={styles.checkIcon}>
                <Feather name="check" size={14} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderPurposePage = () => (
    <View style={[styles.page, { width: SCREEN_WIDTH }]}>
      <View
        style={[
          styles.pageContent,
          { alignItems: 'center', justifyContent: 'center', flex: 1 },
        ]}
      >
        {renderPageHeader()}

        <View style={styles.hadithContainer}>
          {/* <View style={styles.hadithQuoteMark}>
            <Text style={styles.hadithQuoteText}>"</Text>
          </View> */}
          <Text
            style={[styles.hadithBody, { textAlign: isRTL ? 'right' : 'left' }]}
          >
            {t('hadithText')}
          </Text>
        </View>

        <View style={{ height: 28 }} />
        <Text style={[styles.purposeSubtext, { textAlign: 'center' }]}>
          {t('purposeIntro')}
        </Text>
        <Text style={[styles.purposeOneNight, { textAlign: 'center' }]}>
          {t('oneNightAtATime')}
        </Text>
      </View>
    </View>
  );

  const renderGenderPage = () => (
    <View style={[styles.page, { width: SCREEN_WIDTH }]}>
      <View
        style={[
          styles.pageContent,
          { alignItems: 'center', justifyContent: 'center', flex: 1 },
        ]}
      >
        {renderPageHeader()}

        <Text style={[styles.title, { textAlign: 'center' }]}>
          {t('selectYourGender')}
        </Text>
        <Text style={[styles.subtitle, { textAlign: 'center' }]}>
          {t('genderDesc')}
        </Text>

        <View style={[styles.cardContainer, { width: '100%' }]}>
          {(
            [
              { value: true, label: t('male') },
              { value: false, label: t('female') },
            ] as { value: boolean; label: string }[]
          ).map(({ value, label }) => (
            <TouchableOpacity
              key={String(value)}
              style={[
                styles.langCard,
                selectedGender === value && styles.langCardActive,
              ]}
              onPress={() => handleGenderSelect(value)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.langText,
                  selectedGender === value && styles.langTextActive,
                ]}
              >
                {label}
              </Text>
              {selectedGender === value && (
                <View style={styles.checkIcon}>
                  <Feather name="check" size={14} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderVolumePage = () => (
    <View style={[styles.page, { width: SCREEN_WIDTH }]}>
      <View
        style={[
          styles.pageContent,
          { alignItems: 'center', justifyContent: 'center', flex: 1 },
        ]}
      >
        {renderPageHeader()}

        <Text style={[styles.title, { textAlign: 'center' }]}>
          {t('tellUsAboutYourReading')}
        </Text>
        <Text style={[styles.subtitle, { textAlign: 'center' }]}>
          {t('readingVolumeDesc')}
        </Text>

        <View style={[styles.cardContainer, { width: '100%' }]}>
          {(['<10', '10-100', '100-1000', '1000+'] as ReadingVolume[]).map(
            (volume) => (
              <TouchableOpacity
                key={volume}
                style={[
                  styles.langCard,
                  selectedReadingVolume === volume && styles.langCardActive,
                ]}
                onPress={() => handleReadingVolumeSelect(volume)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.langText,
                    selectedReadingVolume === volume && styles.langTextActive,
                  ]}
                >
                  {t(`readingVolume${volume.replace(/[<>+-]/g, '')}` as any)}
                </Text>
                {selectedReadingVolume === volume && (
                  <View style={styles.checkIcon}>
                    <Feather name="check" size={14} color="#fff" />
                  </View>
                )}
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
        <View
          style={[
            styles.pageContent,
            { alignItems: 'center', justifyContent: 'center', flex: 1 },
          ]}
        >
          {renderPageHeader()}
          <Text
            style={[styles.title, { textAlign: 'center', marginBottom: 24 }]}
          >
            {t('trackYourJourney')}
          </Text>

          <View style={[styles.cardContainer, { width: '100%' }]}>
            {features.map((feature) => {
              const Icon = feature.iconType;
              return (
                <View key={feature.id} style={styles.featureCard}>
                  <View
                    style={[
                      styles.featureCardRow,
                      { flexDirection: isRTL ? 'row-reverse' : 'row' },
                    ]}
                  >
                    <View
                      style={[
                        styles.featureIconBox,
                        { backgroundColor: `${feature.color}15` },
                      ]}
                    >
                      <Icon
                        name={feature.icon as any}
                        size={18}
                        color={feature.color}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.featureTitle,
                          {
                            color: feature.color,
                            textAlign: isRTL ? 'right' : 'left',
                          },
                        ]}
                      >
                        {feature.title}
                      </Text>
                      <Text
                        style={[
                          styles.featureDesc,
                          { textAlign: isRTL ? 'right' : 'left' },
                        ]}
                      >
                        {feature.desc}
                      </Text>
                    </View>
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
        {renderPageHeader()}

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
          style={[styles.primaryButton, { width: '100%' }]}
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

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderLanguagePage()}
        {renderPurposePage()}
        {renderGenderPage()}
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
  pageHeader: {
    alignItems: 'center',
  },
  headerImageLarge: {
    width: 180,
    height: 180,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1.5,
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
  langCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  langCardActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  langText: {
    fontSize: 20,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.5)',
  },
  langTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Purpose / Hadith page
  hadithContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    width: '100%',
  },
  hadithQuoteMark: {
    marginBottom: 8,
  },
  hadithQuoteText: {
    fontSize: 40,
    color: 'rgba(255, 255, 255, 0.15)',
    fontWeight: 'bold',
    lineHeight: 40,
  },
  hadithBody: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.75)',
    lineHeight: 24,
  },
  purposeTagline: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  purposeSubtext: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.5)',
    lineHeight: 22,
    marginBottom: 16,
  },
  purposeOneNight: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.3)',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  // Feature Cards
  featureCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  featureCardRow: {
    alignItems: 'flex-start',
    gap: 12,
  },
  featureIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  featureDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 18,
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
