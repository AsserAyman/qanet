import { Feather, MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AnimatedGradientBackground } from '../../components/AnimatedGradientBackground';
import { DeleteDataModal } from '../../components/DeleteDataModal';
import { FeedbackModal } from '../../components/FeedbackModal';
import { Language, useI18n } from '../../contexts/I18nContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  useLastNightStats,
  useOfflineData,
  usePrayerLogs,
} from '../../hooks/useOfflineData';
import { updateUserLanguage } from '../../utils/auth/userRegistration';
import { onboardingManager } from '../../utils/onboarding';

export default function SettingsScreen() {
  const { t, language, setLanguage, isRTL } = useI18n();
  const { themedColorsEnabled, toggleThemedColors } = useTheme();
  const router = useRouter();
  const { isInitialized } = useOfflineData();
  const { logs, loading: logsLoading } = usePrayerLogs();
  const { gradientColors } = useLastNightStats(themedColorsEnabled);
  const {
    notificationsEnabled,
    toggleNotifications,
    permissionStatus,
    notificationHour,
    notificationMinute,
    setNotificationTime,
  } = useNotifications();
  const [headerPressCount, setHeaderPressCount] = useState(0);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(new Date());

  const openTimePicker = () => {
    const date = new Date();
    date.setHours(notificationHour, notificationMinute, 0, 0);
    setPickerDate(date);
    setShowTimePicker(true);
  };

  const formatTime = (hour: number, minute: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    const displayMinute = minute.toString().padStart(2, '0');
    return `${displayHour}:${displayMinute} ${period}`;
  };
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [deleteDataModalVisible, setDeleteDataModalVisible] = useState(false);

  const handleLanguageChange = async (lang: Language) => {
    await setLanguage(lang);
    // Fire-and-forget sync to database (silent fail if offline)
    updateUserLanguage(lang).catch(() => {});
  };

  const handleHeaderPress = () => {
    const newCount = headerPressCount + 1;
    setHeaderPressCount(newCount);

    // Reset onboarding after 5 taps (hidden dev feature)
    if (newCount === 5) {
      Alert.alert(
        'Reset Onboarding',
        'Do you want to reset the onboarding flow? This is for testing purposes.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setHeaderPressCount(0),
          },
          {
            text: 'Reset',
            style: 'destructive',
            onPress: async () => {
              try {
                await onboardingManager.resetOnboarding();
                Alert.alert(
                  'Success',
                  'Onboarding reset. Please restart the app.',
                );
                setHeaderPressCount(0);
              } catch (error) {
                Alert.alert('Error', 'Failed to reset onboarding');
                setHeaderPressCount(0);
              }
            },
          },
        ],
      );
    }

    // Reset counter after 2 seconds
    setTimeout(() => setHeaderPressCount(0), 2000);
  };

  // Force dark styles
  const styles = createStyles(isRTL);

  return (
    <View style={styles.container}>
      <AnimatedGradientBackground colors={gradientColors} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.header}
          onPress={handleHeaderPress}
          activeOpacity={0.9}
        >
          <Text style={styles.headerTitle}>{t('settings')}</Text>
          <Text style={styles.headerSubtitle}>
            {t('customizeYourAppExperience')}
          </Text>
        </TouchableOpacity>

        <View style={styles.hadithCard}>
          <Text style={styles.hadithTitle}>{t('hadith')}</Text>
          <Text style={styles.hadithText}>{t('hadithText')}</Text>
        </View>

        {/* Appearance Settings */}
        <View style={styles.card}>
          <View style={{ ...styles.notificationHeader, marginBottom: 0 }}>
            <View style={styles.notificationTitleContainer}>
              <Feather
                name="droplet"
                size={24}
                color="#ffffff"
                style={{
                  marginRight: isRTL ? 0 : 12,
                  marginLeft: isRTL ? 12 : 0,
                }}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionTitle, { marginBottom: 4 }]}>
                  {t('themedColors')}
                </Text>
                <Text style={styles.notificationSubtitle}>
                  {t('themedColorsDesc')}
                </Text>
              </View>
            </View>
            <Switch
              value={themedColorsEnabled}
              onValueChange={toggleThemedColors}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: '#3b82f6' }}
              thumbColor={themedColorsEnabled ? '#ffffff' : '#f4f3f4'}
              ios_backgroundColor="rgba(255,255,255,0.1)"
            />
          </View>
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
              <Text
                style={[
                  styles.languageOptionText,
                  language === 'en' && styles.languageOptionTextActive,
                ]}
              >
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
              <Text
                style={[
                  styles.languageOptionText,
                  language === 'ar' && styles.languageOptionTextActive,
                ]}
              >
                {t('arabic')}
              </Text>
              {language === 'ar' && (
                <Feather name="check" size={16} color="#ffffff" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Notification Settings */}
        <View style={styles.card}>
          <View style={styles.notificationHeader}>
            <View style={styles.notificationTitleContainer}>
              <Feather
                name="bell"
                size={24}
                color="#ffffff"
                style={{
                  marginRight: isRTL ? 0 : 12,
                  marginLeft: isRTL ? 12 : 0,
                }}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionTitle, { marginBottom: 4 }]}>
                  {t('notifications')}
                </Text>
                <Text style={styles.notificationSubtitle}>
                  {t('dailyReminderDesc')}
                </Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: '#3b82f6' }}
              thumbColor={notificationsEnabled ? '#ffffff' : '#f4f3f4'}
              ios_backgroundColor="rgba(255,255,255,0.1)"
            />
          </View>

          {notificationsEnabled && (
            <TouchableOpacity
              style={styles.notificationInfo}
              onPress={openTimePicker}
              activeOpacity={0.7}
            >
              <Feather
                name="clock"
                size={16}
                color="rgba(255,255,255,0.6)"
                style={{
                  marginRight: isRTL ? 0 : 8,
                  marginLeft: isRTL ? 8 : 0,
                }}
              />
              <Text style={[styles.notificationInfoText, { flex: 1 }]}>
                {t('reminderTime')}:{' '}
                {formatTime(notificationHour, notificationMinute)}
              </Text>
              <Feather
                name={isRTL ? 'chevron-left' : 'chevron-right'}
                size={14}
                color="rgba(255,255,255,0.4)"
              />
            </TouchableOpacity>
          )}

          {permissionStatus === 'denied' && (
            <TouchableOpacity
              style={styles.permissionWarning}
              onPress={() => Linking.openSettings()}
              activeOpacity={0.7}
            >
              <MaterialIcons
                name="warning"
                size={20}
                color="#ef4444"
                style={{
                  marginRight: isRTL ? 0 : 8,
                  marginLeft: isRTL ? 8 : 0,
                }}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.permissionWarningTitle}>
                  {t('notificationPermissionDenied')}
                </Text>
                <Text style={styles.permissionWarningText}>
                  {t('notificationPermissionDeniedDesc')}
                </Text>
              </View>
              <Feather
                name={isRTL ? 'chevron-left' : 'chevron-right'}
                size={14}
                color="rgba(239, 68, 68, 0.5)"
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Send Feedback */}
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.feedbackButton}
            onPress={() => setFeedbackModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.notificationTitleContainer}>
              <Feather
                name="message-square"
                size={24}
                color="#ffffff"
                style={{
                  marginRight: isRTL ? 0 : 12,
                  marginLeft: isRTL ? 12 : 0,
                }}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionTitle, { marginBottom: 4 }]}>
                  {t('sendFeedback')}
                </Text>
                <Text style={styles.notificationSubtitle}>
                  {t('sendFeedbackDesc')}
                </Text>
              </View>
            </View>
            <Feather
              name={isRTL ? 'chevron-left' : 'chevron-right'}
              size={20}
              color="rgba(255,255,255,0.5)"
            />
          </TouchableOpacity>
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
              {/* <Text style={styles.statusDescription}>
                {t('negligentExplanation')}
              </Text> */}
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
              <Text style={styles.statusTitle}>{t('notnegligent')}</Text>
              <Text style={styles.statusSubtitle}>{t('notnegligentDesc')}</Text>
              {/* <Text style={styles.statusDescription}>
                {t('notnegligentExplanation')}
              </Text> */}
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
              {/* <Text style={styles.statusDescription}>
                {t('qanetExplanation')}
              </Text> */}
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
              <Text style={styles.statusTitle}>{t('muqantar')}</Text>
              <Text style={styles.statusSubtitle}>{t('muqantarDesc')}</Text>
              {/* <Text style={styles.statusDescription}>
                {t('muqantarExplanation')}
              </Text> */}
            </View>
          </View>
        </View>

        {/* Delete All Data */}
        <View style={styles.deleteDataCard}>
          <TouchableOpacity
            style={styles.deleteDataButton}
            onPress={() => setDeleteDataModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.notificationTitleContainer}>
              <Feather
                name="trash-2"
                size={24}
                color="#ef4444"
                style={{
                  marginRight: isRTL ? 0 : 12,
                  marginLeft: isRTL ? 12 : 0,
                }}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.deleteDataTitle, { marginBottom: 4 }]}>
                  {t('deleteAllData')}
                </Text>
                <Text style={styles.deleteDataSubtitle}>
                  {t('deleteDataDesc')}
                </Text>
              </View>
            </View>
            <Feather
              name={isRTL ? 'chevron-left' : 'chevron-right'}
              size={20}
              color="rgba(239, 68, 68, 0.5)"
            />
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Time Picker - iOS modal */}
      {showTimePicker && Platform.OS === 'ios' && (
        <Modal transparent animationType="slide" visible={showTimePicker}>
          <View style={styles.modalOverlay}>
            <View style={styles.timePickerCard}>
              <View style={styles.timePickerHeader}>
                <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                  <Text style={styles.timePickerCancelText}>{t('cancel')}</Text>
                </TouchableOpacity>
                <Text style={styles.timePickerTitle}>
                  {t('setReminderTime')}
                </Text>
                <TouchableOpacity
                  onPress={async () => {
                    setShowTimePicker(false);
                    await setNotificationTime(
                      pickerDate.getHours(),
                      pickerDate.getMinutes(),
                    );
                  }}
                >
                  <Text style={styles.timePickerConfirmText}>
                    {t('confirm')}
                  </Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={pickerDate}
                mode="time"
                display="spinner"
                onChange={(_, date) => date && setPickerDate(date)}
                textColor="#ffffff"
                themeVariant="dark"
                style={{ height: 200 }}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Time Picker - Android dialog */}
      {showTimePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={pickerDate}
          mode="time"
          is24Hour={false}
          onChange={(event, date) => {
            setShowTimePicker(false);
            if (event.type === 'set' && date) {
              setNotificationTime(date.getHours(), date.getMinutes());
            }
          }}
        />
      )}

      <FeedbackModal
        visible={feedbackModalVisible}
        onClose={() => setFeedbackModalVisible(false)}
        onSuccess={() => {
          setFeedbackModalVisible(false);
          Alert.alert(t('success'), t('feedbackSubmitted'));
        }}
      />

      <DeleteDataModal
        visible={deleteDataModalVisible}
        onClose={() => setDeleteDataModalVisible(false)}
      />
    </View>
  );
}

const createStyles = (isRTL: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#000',
    },
    scrollView: {
      flex: 1,
    },
    contentContainer: {
      padding: 24,
      paddingTop: 80,
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
      paddingVertical: isRTL ? 6 : 12,
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
    notificationHeader: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    notificationTitleContainer: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'flex-start',
      flex: 1,
      marginRight: isRTL ? 0 : 16,
      marginLeft: isRTL ? 16 : 0,
    },
    notificationSubtitle: {
      fontSize: 14,
      color: 'rgba(255,255,255,0.6)',
      marginTop: 4,
      textAlign: isRTL ? 'right' : 'left',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    notificationInfo: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      paddingVertical: isRTL ? 6 : 12,
      paddingHorizontal: 16,
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
    },
    notificationInfoText: {
      fontSize: 14,
      color: 'rgba(255,255,255,0.8)',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    permissionWarning: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'flex-start',
      padding: 16,
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'rgba(239, 68, 68, 0.3)',
      marginTop: 16,
    },
    permissionWarningTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#ef4444',
      marginBottom: 4,
      textAlign: isRTL ? 'right' : 'left',
      fontFamily: isRTL ? 'NotoNaskhArabic-Bold' : undefined,
    },
    permissionWarningText: {
      fontSize: 13,
      color: 'rgba(239, 68, 68, 0.8)',
      lineHeight: 18,
      textAlign: isRTL ? 'right' : 'left',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    feedbackButton: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    deleteDataCard: {
      backgroundColor: 'rgba(239, 68, 68, 0.08)',
      borderRadius: 24,
      padding: 24,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    deleteDataButton: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    deleteDataTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#ef4444',
      textAlign: isRTL ? 'right' : 'left',
      fontFamily: isRTL ? 'NotoNaskhArabic-Bold' : undefined,
    },
    deleteDataSubtitle: {
      fontSize: 14,
      color: 'rgba(239, 68, 68, 0.8)',
      textAlign: isRTL ? 'right' : 'left',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'flex-end',
    },
    timePickerCard: {
      backgroundColor: '#1a1a1a',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      paddingBottom: 40,
      borderTopWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
    },
    timePickerHeader: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    timePickerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#ffffff',
      fontFamily: isRTL ? 'NotoNaskhArabic-Bold' : undefined,
    },
    timePickerCancelText: {
      fontSize: 16,
      color: 'rgba(255,255,255,0.5)',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    timePickerConfirmText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#ffffff',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
  });
