import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useI18n } from '../contexts/I18nContext';
import { usePrayerLogs } from '../hooks/useOfflineData';
import { PickerModal, PickerOption } from '../components/PickerModal';
import { SelectField } from '../components/SelectField';
import {
  calculateVersesBetween,
  getVerseStatus,
  getGradientColors,
  quranData,
} from '../utils/quranData';

export default function AddPrayerScreen() {
  const { isRTL, t } = useI18n();
  const insets = useSafeAreaInsets();
  const { createLog } = usePrayerLogs();

  // Form state
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedSurah, setSelectedSurah] = useState('Al-Baqara');
  const [selectedAyah, setSelectedAyah] = useState(1);
  const [endSurah, setEndSurah] = useState('Al-Baqara');
  const [endAyah, setEndAyah] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal visibility states
  const [showStartSurahPicker, setShowStartSurahPicker] = useState(false);
  const [showStartAyahPicker, setShowStartAyahPicker] = useState(false);
  const [showEndSurahPicker, setShowEndSurahPicker] = useState(false);
  const [showEndAyahPicker, setShowEndAyahPicker] = useState(false);

  const styles = createStyles(isRTL);

  const currentSurah = quranData.find((s) => s.name === selectedSurah);
  const endCurrentSurah = quranData.find((s) => s.name === endSurah);

  const getSurahName = (name: string) => {
    const surah = quranData.find((s) => s.name === name);
    return isRTL ? surah?.nameAr || name : name;
  };

  // Surah picker options
  const surahOptions: PickerOption[] = useMemo(
    () =>
      quranData.map((surah) => ({
        label: isRTL ? surah.nameAr : surah.name,
        value: surah.name,
        searchTerms: `${surah.name} ${surah.nameAr}`,
      })),
    [isRTL]
  );

  // Ayah picker options for start surah
  const startAyahOptions: PickerOption[] = useMemo(
    () =>
      Array.from({ length: currentSurah?.ayahs || 0 }, (_, i) => ({
        label: String(i + 1),
        value: String(i + 1),
      })),
    [currentSurah]
  );

  // Ayah picker options for end surah
  const endAyahOptions: PickerOption[] = useMemo(
    () =>
      Array.from({ length: endCurrentSurah?.ayahs || 0 }, (_, i) => ({
        label: String(i + 1),
        value: String(i + 1),
      })),
    [endCurrentSurah]
  );

  const totalVerses = calculateVersesBetween(
    selectedSurah,
    selectedAyah,
    endSurah,
    endAyah
  );
  const status = getVerseStatus(totalVerses);
  const gradientColors = useMemo(
    () => getGradientColors(totalVerses),
    [totalVerses]
  );

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

      router.back();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (_event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleClose = () => {
    if (!loading) {
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradientColors} style={styles.gradient} />
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />

      {/* Handle */}
      <View style={styles.handleContainer}>
        <View style={styles.handle} />
      </View>

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top > 20 ? 0 : 8 }]}>
        <Text style={styles.title}>{t('nightPrayer')}</Text>
        <TouchableOpacity
          onPress={handleClose}
          style={styles.closeButton}
          disabled={loading}
        >
          <Ionicons name="close" size={24} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
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
              source={require('../assets/images/moon-image.png')}
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
            <MaterialIcons
              name="calendar-today"
              size={20}
              color="rgba(255,255,255,0.7)"
            />
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
            <MaterialIcons
              name="edit"
              size={16}
              color="rgba(255,255,255,0.5)"
            />
          </TouchableOpacity>

          {showDatePicker && (
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
            <Ionicons
              name="book-outline"
              size={20}
              color="rgba(255,255,255,0.7)"
            />
            <Text style={styles.cardTitle}>{t('readingRange')}</Text>
          </View>

          <View style={styles.pickersSection}>
            {/* Start Point */}
            <Text style={styles.sectionLabel}>{t('startingPoint')}</Text>
            <View style={styles.pickerRow}>
              <SelectField
                label={t('surah')}
                value={getSurahName(selectedSurah)}
                onPress={() => setShowStartSurahPicker(true)}
              />
              <SelectField
                label={t('ayah')}
                value={String(selectedAyah)}
                onPress={() => setShowStartAyahPicker(true)}
              />
            </View>

            <View style={styles.rangeDivider}>
              <View style={styles.rangeLine} />
              <Ionicons
                name="arrow-down"
                size={16}
                color="rgba(255,255,255,0.3)"
              />
              <View style={styles.rangeLine} />
            </View>

            {/* End Point */}
            <Text style={styles.sectionLabel}>{t('endingPoint')}</Text>
            <View style={styles.pickerRow}>
              <SelectField
                label={t('surah')}
                value={getSurahName(endSurah)}
                onPress={() => setShowEndSurahPicker(true)}
              />
              <SelectField
                label={t('ayah')}
                value={String(endAyah)}
                onPress={() => setShowEndAyahPicker(true)}
              />
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleClose}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <MaterialIcons
                name="hourglass-empty"
                size={20}
                color="#ffffff"
              />
            ) : (
              <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
            )}
            <Text style={styles.saveButtonText}>
              {loading ? t('savingPrayerRecord') : t('savePrayerRecord')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Picker Modals */}
      <PickerModal
        visible={showStartSurahPicker}
        onClose={() => setShowStartSurahPicker(false)}
        onSelect={(value) => {
          setSelectedSurah(value);
          const newSurah = quranData.find((s) => s.name === value);
          if (newSurah && selectedAyah > newSurah.ayahs) {
            setSelectedAyah(1);
          }
        }}
        options={surahOptions}
        selectedValue={selectedSurah}
        title={t('startingSurah')}
        searchPlaceholder={t('surah')}
      />

      <PickerModal
        visible={showStartAyahPicker}
        onClose={() => setShowStartAyahPicker(false)}
        onSelect={(value) => setSelectedAyah(Number(value))}
        options={startAyahOptions}
        selectedValue={String(selectedAyah)}
        title={t('ayah')}
        showSearch={false}
      />

      <PickerModal
        visible={showEndSurahPicker}
        onClose={() => setShowEndSurahPicker(false)}
        onSelect={(value) => {
          setEndSurah(value);
          const newSurah = quranData.find((s) => s.name === value);
          if (newSurah && endAyah > newSurah.ayahs) {
            setEndAyah(1);
          }
        }}
        options={surahOptions}
        selectedValue={endSurah}
        title={t('endingSurah')}
        searchPlaceholder={t('surah')}
      />

      <PickerModal
        visible={showEndAyahPicker}
        onClose={() => setShowEndAyahPicker(false)}
        onSelect={(value) => setEndAyah(Number(value))}
        options={endAyahOptions}
        selectedValue={String(endAyah)}
        title={t('ayah')}
        showSearch={false}
      />
    </View>
  );
}

const createStyles = (isRTL: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#1a1a1a',
    },
    gradient: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      height: '100%',
      opacity: 0.3,
    },
    handleContainer: {
      alignItems: 'center',
      paddingTop: 12,
      paddingBottom: 8,
    },
    handle: {
      width: 36,
      height: 4,
      backgroundColor: 'rgba(255,255,255,0.3)',
      borderRadius: 2,
    },
    header: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingBottom: 16,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: '#ffffff',
      fontFamily: isRTL ? 'NotoNaskhArabic-Bold' : undefined,
    },
    closeButton: {
      padding: 4,
    },
    scrollView: {
      flex: 1,
      paddingHorizontal: 20,
    },
    errorContainer: {
      backgroundColor: 'rgba(255, 107, 107, 0.2)',
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
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
      borderRadius: 20,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
    },
    statusRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      marginBottom: 16,
      gap: 16,
    },
    moonImage: {
      width: 56,
      height: 56,
      borderRadius: 28,
    },
    statusTextContainer: {
      flex: 1,
    },
    statusTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#ffffff',
      marginBottom: 4,
      textAlign: isRTL ? 'right' : 'left',
      fontFamily: isRTL ? 'NotoNaskhArabic-Bold' : undefined,
    },
    statusDescription: {
      fontSize: 13,
      color: 'rgba(255,255,255,0.6)',
      textAlign: isRTL ? 'right' : 'left',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    totalVersesContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,255,255,0.1)',
      paddingTop: 12,
    },
    totalVersesNumber: {
      fontSize: 36,
      fontWeight: 'bold',
      color: '#ffffff',
      lineHeight: 42,
    },
    totalVersesLabel: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.6)',
      textTransform: 'uppercase',
      letterSpacing: 1,
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    card: {
      backgroundColor: 'rgba(0,0,0,0.3)',
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
    },
    cardHeader: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      marginBottom: 12,
      gap: 10,
    },
    cardTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: '#ffffff',
      fontFamily: isRTL ? 'NotoNaskhArabic-Bold' : undefined,
    },
    dateDisplay: {
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: 12,
      padding: 14,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    dateText: {
      fontSize: 15,
      color: '#ffffff',
      fontWeight: '500',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    datePicker: {
      alignSelf: 'center',
      marginTop: 12,
    },
    pickersSection: {
      gap: 10,
    },
    sectionLabel: {
      fontSize: 13,
      color: 'rgba(255,255,255,0.5)',
      textAlign: isRTL ? 'right' : 'left',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
      marginBottom: 2,
    },
    pickerRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      gap: 10,
    },
    rangeDivider: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginVertical: 2,
    },
    rangeLine: {
      height: 1,
      flex: 1,
      backgroundColor: 'rgba(255,255,255,0.1)',
    },
    buttonRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      gap: 12,
      marginTop: 8,
      marginBottom: 20,
    },
    cancelButton: {
      flex: 1,
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
    },
    cancelButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    saveButton: {
      flex: 1,
      backgroundColor: 'rgba(34, 197, 94, 0.3)',
      borderRadius: 16,
      padding: 16,
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderWidth: 1,
      borderColor: 'rgba(34, 197, 94, 0.5)',
    },
    saveButtonDisabled: {
      opacity: 0.7,
    },
    saveButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
  });
