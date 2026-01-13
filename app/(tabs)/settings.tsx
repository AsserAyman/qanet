import { Feather, MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { useTheme, ThemeMode } from '../../contexts/ThemeContext';
import { useI18n, Language } from '../../contexts/I18nContext';
import { supabase } from '../../utils/supabase';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const { theme } = useTheme();
  const { t, language, setLanguage, isRTL } = useI18n();
  const router = useRouter();

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

  const styles = createStyles(theme, isRTL);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={{
            uri: 'https://images.pexels.com/photos/1624438/pexels-photo-1624438.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
          }}
          style={styles.backgroundImage}
        />
        <View style={styles.overlay} />
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{t('settings')}</Text>
          <Text style={styles.headerSubtitle}>
            {t('customizeYourAppExperience')}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
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
                <Feather name="check" size={16} color={theme.primary} />
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
                <Feather name="check" size={16} color={theme.primary} />
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
                { backgroundColor: theme.error + '20' },
              ]}
            >
              <MaterialIcons name="warning" size={24} color={theme.error} />
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
                { backgroundColor: theme.warning + '20' },
              ]}
            >
              <Feather name="moon" size={24} color={theme.warning} />
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
                { backgroundColor: theme.primary + '20' },
              ]}
            >
              <MaterialIcons name="military-tech" size={24} color={theme.primary} />
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
                { backgroundColor: theme.success + '20' },
              ]}
            >
              <MaterialIcons name="military-tech" size={24} color={theme.success} />
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
          <Feather name="log-out" size={20} color={theme.error} />
          <Text style={styles.signOutText}>{t('signOut')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const createStyles = (theme: any, isRTL: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    height: 200,
    position: 'relative',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.overlay,
  },
  headerContent: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: isRTL ? 'right' : 'left',
    fontFamily: isRTL ? 'NotoNaskhArabic-Bold' : undefined,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#e2e8f0',
    textAlign: isRTL ? 'right' : 'left',
    fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
  },
  content: {
    flex: 1,
    marginTop: -24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: theme.background,
    padding: 24,
  },
  card: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 16,
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
    borderRadius: 12,
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.border,
  },
  languageOptionActive: {
    borderColor: theme.primary,
    backgroundColor: theme.primary + '10',
  },
  languageFlag: {
    fontSize: 20,
    marginRight: isRTL ? 0 : 12,
    marginLeft: isRTL ? 12 : 0,
  },
  languageOptionText: {
    flex: 1,
    fontSize: 16,
    color: theme.text,
    fontWeight: '500',
    textAlign: isRTL ? 'right' : 'left',
    fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
  },
  languageOptionTextActive: {
    color: theme.primary,
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
    color: theme.text,
    marginBottom: 4,
    textAlign: isRTL ? 'right' : 'left',
    fontFamily: isRTL ? 'NotoNaskhArabic-Bold' : undefined,
  },
  statusSubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 8,
    textAlign: isRTL ? 'right' : 'left',
    fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
  },
  statusDescription: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 20,
    textAlign: isRTL ? 'right' : 'left',
    fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
  },
  divider: {
    height: 1,
    backgroundColor: theme.border,
    marginVertical: 12,
  },
  hadithCard: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  hadithTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 16,
    textAlign: isRTL ? 'right' : 'left',
    fontFamily: isRTL ? 'NotoNaskhArabic-Bold' : undefined,
  },
  hadithText: {
    fontSize: 16,
    color: theme.text,
    lineHeight: 24,
    fontFamily: 'NotoNaskhArabic-Regular',
    textAlign: isRTL ? 'right' : 'left',
  },
  signOutButton: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.error + '30',
    gap: 12,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.error,
    fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
  },
});