import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';
import { useAuth } from '../../hooks/useAuth';
import {
  calculateVersesBetween,
  getVerseStatus,
  quranData,
} from '../../utils/quranData';
import { savePrayerLog } from '../../utils/supabase';

const { width } = Dimensions.get('window');

export default function AddPrayerScreen() {
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();
  const { theme } = useTheme();
  const { t, isRTL } = useI18n();
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedSurah, setSelectedSurah] = useState('Al-Baqara');
  const [selectedAyah, setSelectedAyah] = useState(1);
  const [endSurah, setEndSurah] = useState('Al-Baqara');
  const [endAyah, setEndAyah] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const styles = createStyles(theme, isRTL);

  React.useEffect(() => {
    if (authLoading) return;

    if (!session) {
      router.replace('/(auth)/sign-in');
    }
  }, [session, authLoading]);

  const currentSurah = quranData.find((s) => s.name === selectedSurah);
  const endCurrentSurah = quranData.find((s) => s.name === endSurah);

  const totalVerses = calculateVersesBetween(
    selectedSurah,
    selectedAyah,
    endSurah,
    endAyah
  );
  const status = getVerseStatus(totalVerses);

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      await savePrayerLog(
        selectedSurah,
        selectedAyah,
        endSurah,
        endAyah,
        totalVerses,
        status.status,
        date
      );

      router.push('/(tabs)/history');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  if (authLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <MaterialIcons name="book" size={32} color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            {t('loading')}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Image
          source={{
            uri: 'https://images.pexels.com/photos/1850021/pexels-photo-1850021.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
          }}
          style={styles.backgroundImage}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
          style={styles.overlay}
        />
        <View style={styles.headerContent}>
          <View style={styles.iconContainer}>
            <Ionicons name="moon" size={40} color="#ffffff" />
          </View>
          <Text style={styles.headerTitle}>{t('nightPrayer')}</Text>
          <Text style={styles.headerSubtitle}>
            {t('recordYourSpiritualJourney')}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color={theme.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Date Selection Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIcon}>
              <MaterialIcons
                name="calendar-today"
                size={20}
                color={theme.primary}
              />
            </View>
            <Text style={styles.cardTitle}>{t('prayerDate')}</Text>
          </View>
          <View style={styles.dateSection}>
            <View style={styles.dateDisplay}>
              <Text style={styles.dateText}>
                {date.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
            {(showDatePicker || Platform.OS !== 'web') && (
              <DateTimePicker
                value={date}
                mode="date"
                onChange={onDateChange}
                style={styles.datePicker}
              />
            )}
          </View>
        </View>

        {/* Reading Range Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIcon}>
              <Ionicons name="book-outline" size={20} color={theme.primary} />
            </View>
            <Text style={styles.cardTitle}>{t('readingRange')}</Text>
          </View>

          <View style={styles.rangeContainer}>
            <View style={styles.rangeSection}>
              <Text style={styles.rangeSectionTitle}>{t('startingPoint')}</Text>
              <View style={styles.pickerRow}>
                <View style={styles.pickerWrapper}>
                  <Text style={styles.pickerLabel}>{t('surah')}</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={selectedSurah}
                      onValueChange={setSelectedSurah}
                      style={[styles.picker, { color: theme.text }]}
                      dropdownIconColor={theme.textSecondary}
                    >
                      {quranData.map((surah) => (
                        <Picker.Item
                          key={surah.name}
                          label={surah.name}
                          value={surah.name}
                          color={theme.text}
                        />
                      ))}
                    </Picker>
                  </View>
                </View>
                <View style={styles.pickerWrapper}>
                  <Text style={styles.pickerLabel}>{t('ayah')}</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={String(selectedAyah)}
                      onValueChange={(value) => setSelectedAyah(Number(value))}
                      style={[styles.picker, { color: theme.text }]}
                      dropdownIconColor={theme.textSecondary}
                    >
                      {Array.from(
                        { length: currentSurah?.ayahs || 0 },
                        (_, i) => (
                          <Picker.Item
                            key={i + 1}
                            label={String(i + 1)}
                            value={String(i + 1)}
                            color={theme.text}
                          />
                        )
                      )}
                    </Picker>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.rangeDivider}>
              <View style={styles.rangeLine} />
              <Ionicons
                name="arrow-down"
                size={16}
                color={theme.textSecondary}
              />
              <View style={styles.rangeLine} />
            </View>

            <View style={styles.rangeSection}>
              <Text style={styles.rangeSectionTitle}>{t('endingPoint')}</Text>
              <View style={styles.pickerRow}>
                <View style={styles.pickerWrapper}>
                  <Text style={styles.pickerLabel}>{t('surah')}</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={endSurah}
                      onValueChange={setEndSurah}
                      style={[styles.picker, { color: theme.text }]}
                      dropdownIconColor={theme.textSecondary}
                    >
                      {quranData.map((surah) => (
                        <Picker.Item
                          key={surah.name}
                          label={surah.name}
                          value={surah.name}
                          color={theme.text}
                        />
                      ))}
                    </Picker>
                  </View>
                </View>
                <View style={styles.pickerWrapper}>
                  <Text style={styles.pickerLabel}>{t('ayah')}</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={String(endAyah)}
                      onValueChange={(value) => setEndAyah(Number(value))}
                      style={[styles.picker, { color: theme.text }]}
                      dropdownIconColor={theme.textSecondary}
                    >
                      {Array.from(
                        { length: endCurrentSurah?.ayahs || 0 },
                        (_, i) => (
                          <Picker.Item
                            key={i + 1}
                            label={String(i + 1)}
                            value={String(i + 1)}
                            color={theme.text}
                          />
                        )
                      )}
                    </Picker>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Status Card */}
        <View style={[styles.statusCard, { borderColor: status.color }]}>
          <LinearGradient
            colors={[status.color + '10', status.color + '05']}
            style={styles.statusGradient}
          >
            <View style={styles.statusHeader}>
              <View
                style={[
                  styles.statusIcon,
                  { backgroundColor: status.color + '20' },
                ]}
              >
                <Feather name="moon" size={28} color={status.color} />
              </View>
              <View style={styles.statusInfo}>
                <Text style={[styles.statusTitle, { color: status.color }]}>
                  {t(status.status.toLowerCase().replace(' ', ''))}
                </Text>
                <Text style={styles.statusDescription}>
                  {status.description}
                </Text>
              </View>
            </View>
            <View style={styles.versesContainer}>
              <View style={styles.versesBox}>
                <Text style={styles.versesLabel}>{t('totalVerses')}</Text>
                <Text style={[styles.versesCount, { color: status.color }]}>
                  {totalVerses}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={
              loading
                ? [theme.textSecondary, theme.textSecondary]
                : [theme.primary, theme.primary + 'CC']
            }
            style={styles.saveButtonGradient}
          >
            {loading ? (
              <MaterialIcons name="hourglass-empty" size={20} color="white" />
            ) : (
              <Ionicons name="checkmark-circle" size={20} color="white" />
            )}
            <Text style={styles.saveButtonText}>
              {loading ? t('savingPrayerRecord') : t('savePrayerRecord')}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </View>
    </ScrollView>
  );
}

const createStyles = (theme: any, isRTL: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 12,
    },
    loadingText: {
      fontSize: 16,
      fontWeight: '500',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    header: {
      height: 240,
      position: 'relative',
    },
    backgroundImage: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      resizeMode: 'cover',
    },
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    headerContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: 'rgba(255,255,255,0.15)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.2)',
    },
    headerTitle: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#ffffff',
      marginBottom: 8,
      textAlign: 'center',
      fontFamily: isRTL ? 'NotoNaskhArabic-Bold' : undefined,
    },
    headerSubtitle: {
      fontSize: 16,
      color: '#e2e8f0',
      textAlign: 'center',
      maxWidth: width * 0.8,
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    content: {
      flex: 1,
      marginTop: -32,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      backgroundColor: theme.background,
      paddingHorizontal: 20,
      paddingTop: 32,
    },
    errorContainer: {
      backgroundColor: theme.error + '15',
      borderRadius: 16,
      padding: 16,
      marginBottom: 24,
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 12,
      borderWidth: 1,
      borderColor: theme.error + '30',
    },
    errorText: {
      color: theme.error,
      fontSize: 14,
      flex: 1,
      fontWeight: '500',
      textAlign: isRTL ? 'right' : 'left',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    card: {
      backgroundColor: theme.card,
      borderRadius: 20,
      padding: 24,
      marginBottom: 20,
      shadowColor: theme.text,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
      borderWidth: 1,
      borderColor: theme.border,
    },
    cardHeader: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      marginBottom: 20,
      gap: 12,
    },
    cardIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.primary + '15',
      justifyContent: 'center',
      alignItems: 'center',
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.text,
      fontFamily: isRTL ? 'NotoNaskhArabic-Bold' : undefined,
    },
    dateSection: {
      gap: 16,
    },
    dateDisplay: {
      backgroundColor: theme.background,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    dateText: {
      fontSize: 16,
      color: theme.text,
      fontWeight: '600',
      textAlign: 'center',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    datePicker: {
      alignSelf: 'center',
    },
    rangeContainer: {
      gap: 20,
    },
    rangeSection: {
      gap: 16,
    },
    rangeSectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 8,
      textAlign: isRTL ? 'right' : 'left',
      fontFamily: isRTL ? 'NotoNaskhArabic-Bold' : undefined,
    },
    pickerRow: {
      flexDirection: 'row',
      gap: 12,
    },
    pickerWrapper: {
      flex: 1,
    },
    pickerLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.textSecondary,
      marginBottom: 8,
      textAlign: isRTL ? 'right' : 'left',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    pickerContainer: {
      backgroundColor: theme.background,
      borderRadius: 12,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.border,
      minHeight: 50,
    },
    picker: {
      backgroundColor: theme.background,
    },
    rangeDivider: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginVertical: 8,
    },
    rangeLine: {
      height: 1,
      flex: 1,
      backgroundColor: theme.border,
    },
    statusCard: {
      borderRadius: 20,
      marginBottom: 24,
      overflow: 'hidden',
      borderWidth: 2,
    },
    statusGradient: {
      padding: 24,
    },
    statusHeader: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      marginBottom: 20,
      gap: 16,
    },
    statusIcon: {
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: 'center',
      alignItems: 'center',
    },
    statusInfo: {
      flex: 1,
    },
    statusTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      marginBottom: 4,
      textAlign: isRTL ? 'right' : 'left',
      fontFamily: isRTL ? 'NotoNaskhArabic-Bold' : undefined,
    },
    statusDescription: {
      fontSize: 15,
      color: theme.textSecondary,
      lineHeight: 20,
      textAlign: isRTL ? 'right' : 'left',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    versesContainer: {
      alignItems: 'center',
    },
    versesBox: {
      backgroundColor: theme.background + '80',
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
      minWidth: 120,
      borderWidth: 1,
      borderColor: theme.border,
    },
    versesLabel: {
      fontSize: 12,
      color: theme.textSecondary,
      fontWeight: '500',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 4,
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    versesCount: {
      fontSize: 28,
      fontWeight: 'bold',
    },
    saveButton: {
      borderRadius: 16,
      overflow: 'hidden',
      marginBottom: 16,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    saveButtonDisabled: {
      shadowOpacity: 0.1,
      elevation: 2,
    },
    saveButtonGradient: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 18,
      gap: 8,
    },
    saveButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '700',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    bottomSpacer: {
      height: 20,
    },
  });