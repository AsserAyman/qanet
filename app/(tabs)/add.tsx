import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState, useMemo } from 'react';
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
import { usePrayerLogs, useOfflineData } from '../../hooks/useOfflineData';
import {
  calculateVersesBetween,
  getVerseStatus,
  quranData,
} from '../../utils/quranData';

const { width } = Dimensions.get('window');

export default function AddPrayerScreen() {
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();
  const { t, isRTL } = useI18n();
  const { isInitialized } = useOfflineData();
  const { createLog } = usePrayerLogs();
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedSurah, setSelectedSurah] = useState('Al-Baqara');
  const [selectedAyah, setSelectedAyah] = useState(1);
  const [endSurah, setEndSurah] = useState('Al-Baqara');
  const [endAyah, setEndAyah] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Force dark theme styles
  const styles = createStyles(isRTL);

  const currentSurah = quranData.find((s) => s.name === selectedSurah);
  const endCurrentSurah = quranData.find((s) => s.name === endSurah);

  const totalVerses = calculateVersesBetween(
    selectedSurah,
    selectedAyah,
    endSurah,
    endAyah
  );
  const status = getVerseStatus(totalVerses);

  const gradientColors = useMemo(() => {
    if (totalVerses >= 1000) {
      return ['#492d52', '#210e2b', '#000000'];
    } else if (totalVerses >= 100) {
      return ['#114a28', '#052b14', '#000000'];
    } else if (totalVerses >= 10) {
      return ['#0e2a4a', '#05122b', '#000000'];
    }
    return ['#4a0e0e', '#2b0505', '#000000'];
  }, [totalVerses]);

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      await createLog({
        start_surah: selectedSurah,
        start_ayah: selectedAyah,
        end_surah: endSurah,
        end_ayah: endAyah,
        total_ayahs: totalVerses,
        status: status.status,
        date: date,
      });

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

  if (authLoading || !isInitialized) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <LinearGradient
          colors={gradientColors}
          style={styles.background}
        />
        <MaterialIcons name="book" size={32} color="#ffffff" />
        <Text style={[styles.loadingText, { color: '#ffffff', marginTop: 12 }]}>
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
          <Text style={styles.headerTitle}>{t('nightPrayer')}</Text>
          <Text style={styles.headerSubtitle}>
            {t('recordYourSpiritualJourney')}
          </Text>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color="#ff6b6b" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Image
              source={require('../../assets/images/moon-image.png')}
              style={styles.moonImage}
            />
            <View style={styles.statusTextContainer}>
              <Text style={styles.statusTitle}>
                {t(status.status.toLowerCase().replace(/\s+/g, ''))}
              </Text>
              <Text style={styles.statusDescription}>
                {status.description}
              </Text>
            </View>
          </View>
          
          <View style={styles.totalVersesContainer}>
            <Text style={styles.totalVersesNumber}>{totalVerses}</Text>
            <Text style={styles.totalVersesLabel}>{t('totalVerses')}</Text>
          </View>
        </View>

        {/* Date Selection */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="calendar-today" size={20} color="rgba(255,255,255,0.7)" />
            <Text style={styles.cardTitle}>{t('prayerDate')}</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.dateDisplay}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.dateText}>
              {date.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
            <MaterialIcons name="edit" size={16} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
          
          {(showDatePicker || Platform.OS !== 'web') && showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              onChange={onDateChange}
              style={styles.datePicker}
              textColor="#ffffff"
              themeVariant="dark"
            />
          )}
        </View>

        {/* Reading Range Inputs */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="book-outline" size={20} color="rgba(255,255,255,0.7)" />
            <Text style={styles.cardTitle}>{t('readingRange')}</Text>
          </View>

          <View style={styles.pickersSection}>
            {/* Start Point */}
            <View style={styles.rangeLabelRow}>
              <Text style={styles.sectionLabel}>{t('startingPoint')}</Text>
            </View>
            <View style={styles.pickerRow}>
              <View style={styles.pickerWrapper}>
                <Text style={styles.pickerLabel}>{t('surah')}</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={selectedSurah}
                    onValueChange={setSelectedSurah}
                    style={styles.picker}
                    dropdownIconColor="#ffffff"
                    itemStyle={{ color: '#ffffff' }}
                  >
                    {quranData.map((surah) => (
                      <Picker.Item
                        key={surah.name}
                        label={isRTL ? surah.nameAr : surah.name}
                        value={surah.name}
                        color={Platform.OS === 'android' ? '#000000' : '#ffffff'}
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
                    style={styles.picker}
                    dropdownIconColor="#ffffff"
                    itemStyle={{ color: '#ffffff' }}
                  >
                    {Array.from(
                      { length: currentSurah?.ayahs || 0 },
                      (_, i) => (
                        <Picker.Item
                          key={i + 1}
                          label={String(i + 1)}
                          value={String(i + 1)}
                          color={Platform.OS === 'android' ? '#000000' : '#ffffff'}
                        />
                      )
                    )}
                  </Picker>
                </View>
              </View>
            </View>

            <View style={styles.rangeDivider}>
              <View style={styles.rangeLine} />
              <Ionicons name="arrow-down" size={16} color="rgba(255,255,255,0.3)" />
              <View style={styles.rangeLine} />
            </View>

            {/* End Point */}
            <View style={styles.rangeLabelRow}>
              <Text style={styles.sectionLabel}>{t('endingPoint')}</Text>
            </View>
            <View style={styles.pickerRow}>
              <View style={styles.pickerWrapper}>
                <Text style={styles.pickerLabel}>{t('surah')}</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={endSurah}
                    onValueChange={setEndSurah}
                    style={styles.picker}
                    dropdownIconColor="#ffffff"
                    itemStyle={{ color: '#ffffff' }}
                  >
                    {quranData.map((surah) => (
                      <Picker.Item
                        key={surah.name}
                        label={isRTL ? surah.nameAr : surah.name}
                        value={surah.name}
                        color={Platform.OS === 'android' ? '#000000' : '#ffffff'}
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
                    style={styles.picker}
                    dropdownIconColor="#ffffff"
                    itemStyle={{ color: '#ffffff' }}
                  >
                    {Array.from(
                      { length: endCurrentSurah?.ayahs || 0 },
                      (_, i) => (
                        <Picker.Item
                          key={i + 1}
                          label={String(i + 1)}
                          value={String(i + 1)}
                          color={Platform.OS === 'android' ? '#000000' : '#ffffff'}
                        />
                      )
                    )}
                  </Picker>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
            style={styles.saveButtonGradient}
          >
            {loading ? (
              <MaterialIcons name="hourglass-empty" size={20} color="#ffffff" />
            ) : (
              <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
            )}
            <Text style={styles.saveButtonText}>
              {loading ? t('savingPrayerRecord') : t('savePrayerRecord')}
            </Text>
          </LinearGradient>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
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
  errorContainer: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
    flex: 1,
    fontWeight: '500',
    textAlign: isRTL ? 'right' : 'left',
    fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
  },
  statusCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statusRow: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  moonImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
    textAlign: isRTL ? 'right' : 'left',
    fontFamily: isRTL ? 'NotoNaskhArabic-Bold' : undefined,
  },
  statusDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: isRTL ? 'right' : 'left',
    fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
  },
  totalVersesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 16,
  },
  totalVersesNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    lineHeight: 56,
  },
  totalVersesLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
  },
  card: {
    backgroundColor: '#0f0f0f',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardHeader: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: isRTL ? 'NotoNaskhArabic-Bold' : undefined,
  },
  dateDisplay: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
    fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
  },
  datePicker: {
    alignSelf: 'center',
    marginTop: 12,
  },
  pickersSection: {
    gap: 16,
  },
  rangeLabelRow: {
    marginBottom: 4,
    marginTop: 8,
  },
  sectionLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textAlign: isRTL ? 'right' : 'left',
    fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
  },
  pickerRow: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    gap: 12,
  },
  pickerWrapper: {
    flex: 1,
  },
  pickerLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 6,
    marginLeft: 4,
    textAlign: isRTL ? 'right' : 'left',
    fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
  },
  pickerContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  picker: {
    color: '#ffffff',
    height: Platform.OS === 'android' ? 50 : undefined,
  },
  rangeDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 4,
  },
  rangeLine: {
    height: 1,
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  saveButton: {
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonGradient: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
  },
});