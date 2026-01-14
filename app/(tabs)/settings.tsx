import { Feather, MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, ThemeMode } from '../../contexts/ThemeContext';
import { useI18n, Language } from '../../contexts/I18nContext';
import { supabase } from '../../utils/supabase';
import { useRouter } from 'expo-router';
import { usePrayerLogs, useOfflineData } from '../../hooks/useOfflineData';
import { getGradientColors } from '../../utils/quranData';

export default function SettingsScreen() {
  const { t, language, setLanguage, isRTL } = useI18n();
  const router = useRouter();
  const { isInitialized } = useOfflineData();
  const { logs, loading: logsLoading } = usePrayerLogs();

  const lastEntry = logs.length > 0 ? logs[0] : null;
  const gradientColors = React.useMemo(() => {
    const totalVerses = lastEntry?.total_ayahs || 0;
    return getGradientColors(totalVerses);
  }, [lastEntry]);

  const handleLanguageChange = async (lang: Language) => {
    await setLanguage(lang);
  };

  const handleSignOut = async () => {
    Alert.alert(
      t('signOut'),
      'Are you sure you want to sign out?',
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('signOut'),
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            router.replace('/(auth)/sign-in');
          },
        },
      ]
    );
  };

  // Force dark styles
  const styles = createStyles(isRTL);

  if (!isInitialized || logsLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <LinearGradient
          colors={gradientColors}
          style={styles.background}
        />
        <Text style={{ color: '#ffffff', fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined }}>
          {t('loading')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradientColors}
        style={styles.background}
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('settings')}</Text>
          <Text style={styles.headerSubtitle}>
            {t('customizeYourAppExperience')}
          </Text>
        </View>

        {/* Language Settings */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('language')}</Text>
          <View style={styles.languageOptions}>
            <TouchableOpacity
              style={[
                styles.languageOption,
                language === 'en' && styles.languageOptionActive,
              ]}
              onPress={() => handleLanguageChange('en')}
            >
              <Text style={styles.languageFlag}>🇺🇸</Text>
              <Text style={[
                styles.languageOptionText,
                language === 'en' && styles.languageOptionTextActive,
              ]}>
                {t('english')}
              </Text>
              {language === 'en' && (
                <Feather name="check" size={16} color="#ffffff" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.languageOption,
                language === 'ar' && styles.languageOptionActive,
              ]}
              onPress={() => handleLanguageChange('ar')}
            >
              <Text style={styles.languageFlag}>🇸🇦</Text>
              <Text style={[
                styles.languageOptionText,
                language === 'ar' && styles.languageOptionTextActive,
              ]}>
                {t('arabic')}
              </Text>
              {language === 'ar' && (
                <Feather name="check" size={16} color="#ffffff" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Prayer Status Information */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('prayerStatusLevels')}</Text>
          
          <View style={styles.statusItem}>
            <View
              style={[
                styles.statusIconContainer,
                { backgroundColor: 'rgba(239, 68, 68, 0.2)' },
              ]}
            >
              <MaterialIcons name="warning" size={24} color="#ef4444" />
            </View>
            <View style={styles.statusContent}>
              <Text style={styles.statusTitle}>{t('negligent')}</Text>
              <Text style={styles.statusSubtitle}>{t('negligentDesc')}</Text>
              <Text style={styles.statusDescription}>
                {t('negligentExplanation')}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.statusItem}>
            <View
              style={[
                styles.statusIconContainer,
                { backgroundColor: 'rgba(59, 130, 246, 0.2)' },
              ]}
            >
              <Feather name="moon" size={24} color="#3b82f6" />
            </View>
            <View style={styles.statusContent}>
              <Text style={styles.statusTitle}>{t('notNegligent')}</Text>
              <Text style={styles.statusSubtitle}>{t('notNegligentDesc')}</Text>
              <Text style={styles.statusDescription}>
                {t('notNegligentExplanation')}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.statusItem}>
            <View
              style={[
                styles.statusIconContainer,
                { backgroundColor: 'rgba(34, 197, 94, 0.2)' },
              ]}
            >
              <MaterialIcons name="military-tech" size={24} color="#22c55e" />
            </View>
            <View style={styles.statusContent}>
              <Text style={styles.statusTitle}>{t('qanet')}</Text>
              <Text style={styles.statusSubtitle}>{t('qanetDesc')}</Text>
              <Text style={styles.statusDescription}>
                {t('qanetExplanation')}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.statusItem}>
            <View
              style={[
                styles.statusIconContainer,
                { backgroundColor: 'rgba(168, 85, 247, 0.2)' },
              ]}
            >
              <MaterialIcons name="military-tech" size={24} color="#a855f7" />
            </View>
            <View style={styles.statusContent}>
              <Text style={styles.statusTitle}>{t('mokantar')}</Text>
              <Text style={styles.statusSubtitle}>{t('mokantarDesc')}</Text>
              <Text style={styles.statusDescription}>
                {t('mokantarExplanation')}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.hadithCard}>
          <Text style={styles.hadithTitle}>{t('hadith')}</Text>
          <Text style={styles.hadithText}>
            {t('hadithText')}
          </Text>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Feather name="log-out" size={20} color="#ef4444" />
          <Text style={styles.signOutText}>{t('signOut')}</Text>
        </TouchableOpacity>
        
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const createStyles = (isRTL: boolean) => StyleSheet.create({
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingTop: 60,
  },
  header: {
    marginBottom: 32,
    alignItems: isRTL ? 'flex-end' : 'flex-start',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
    fontFamily: isRTL ? 'NotoNaskhArabic-Bold' : undefined,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
    textAlign: isRTL ? 'right' : 'left',
    fontFamily: isRTL ? 'NotoNaskhArabic-Bold' : undefined,
  },
  languageOptions: {
    gap: 12,
  },
  languageOption: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  languageOptionActive: {
    borderColor: '#ffffff',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  languageFlag: {
    fontSize: 24,
    marginRight: isRTL ? 0 : 16,
    marginLeft: isRTL ? 16 : 0,
  },
  languageOptionText: {
    flex: 1,
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
    textAlign: isRTL ? 'right' : 'left',
    fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
  },
  languageOptionTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  statusItem: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  statusIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: isRTL ? 0 : 16,
    marginLeft: isRTL ? 16 : 0,
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
    textAlign: isRTL ? 'right' : 'left',
    fontFamily: isRTL ? 'NotoNaskhArabic-Bold' : undefined,
  },
  statusSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 6,
    textAlign: isRTL ? 'right' : 'left',
    fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
  },
  statusDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 20,
    textAlign: isRTL ? 'right' : 'left',
    fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 16,
  },
  hadithCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  hadithTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: isRTL ? 'right' : 'left',
    fontFamily: isRTL ? 'NotoNaskhArabic-Bold' : undefined,
  },
  hadithText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 26,
    fontFamily: 'NotoNaskhArabic-Regular',
    textAlign: isRTL ? 'right' : 'left',
  },
  signOutButton: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    gap: 12,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
    fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
  },
});