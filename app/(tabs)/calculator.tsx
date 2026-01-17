import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { PickerModal, PickerOption } from '../../components/PickerModal';
import { SelectField } from '../../components/SelectField';
import { useI18n } from '../../contexts/I18nContext';
import { useLastNightStats, usePrayerLogs } from '../../hooks/useOfflineData';
import {
  calculateVerseRange,
  calculateVersesBetween,
  getVerseStatus,
  globalIndexToSurahAyah,
  quranData,
} from '../../utils/quranData';

const { width } = Dimensions.get('window');

export default function CalculatorScreen() {
  const [mode, setMode] = useState<'target' | 'range'>('target');
  const [selectedSurah, setSelectedSurah] = useState('Al-Baqara');
  const [selectedAyah, setSelectedAyah] = useState(1);
  const [targetVerses, setTargetVerses] = useState(100);

  const [endSurah, setEndSurah] = useState('Al-Baqara');
  const [endAyah, setEndAyah] = useState(1);

  // Modal visibility states
  const [showStartSurahPicker, setShowStartSurahPicker] = useState(false);
  const [showStartAyahPicker, setShowStartAyahPicker] = useState(false);
  const [showEndSurahPicker, setShowEndSurahPicker] = useState(false);
  const [showEndAyahPicker, setShowEndAyahPicker] = useState(false);

  const { t, isRTL } = useI18n();
  const { logs } = usePrayerLogs();
  const { gradientColors } = useLastNightStats();

  const lastEntry = logs.length > 0 ? logs[0] : null;

  // Set default starting point based on last entry's end point
  useEffect(() => {
    if (lastEntry && lastEntry.recitations.length > 0) {
      // Get the last recitation's end position
      const lastRecitation = lastEntry.recitations[lastEntry.recitations.length - 1];
      const endInfo = globalIndexToSurahAyah(lastRecitation.end_ayah);
      const endSurahData = quranData.find(
        (s) => s.name === endInfo.surahName
      );
      if (endSurahData) {
        // Check if we need to move to the next surah
        if (endInfo.ayahNumber >= endSurahData.ayahs) {
          // Move to the next surah
          const nextIndex = (endInfo.surahIndex + 1) % quranData.length;
          setSelectedSurah(quranData[nextIndex].name);
          setSelectedAyah(1);
        } else {
          // Stay in the same surah, increment ayah
          setSelectedSurah(endInfo.surahName);
          setSelectedAyah(endInfo.ayahNumber + 1);
        }
      }
    }
  }, [lastEntry?.id]); // Only run when the last entry changes

  const getSurahName = (name: string) => {
    const surah = quranData.find((s) => s.name === name);
    return isRTL ? surah?.nameAr || name : name;
  };

  const currentSurah = quranData.find((s) => s.name === selectedSurah);
  const endCurrentSurah = quranData.find((s) => s.name === endSurah);

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

  const range =
    mode === 'target'
      ? calculateVerseRange(selectedSurah, selectedAyah, targetVerses)
      : {
          startSurah: selectedSurah,
          startAyah: selectedAyah,
          endSurah: endSurah,
          endAyah: endAyah,
          totalAyahs: calculateVersesBetween(
            selectedSurah,
            selectedAyah,
            endSurah,
            endAyah
          ),
        };

  const status = getVerseStatus(range.totalAyahs);

  const styles = createStyles(isRTL);

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradientColors} style={styles.background} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Ionicons
            name="calculator-outline"
            size={80}
            color="rgba(255,255,255,0.8)"
            style={styles.heroIcon}
          />
          <Text style={styles.heroTitle}>{t('verseCalculator')}</Text>
          <Text style={styles.heroSubtitle}>
            {t('calculateYourNightPrayerVerses')}
          </Text>
        </View>

        {/* Controls Container */}
        <View style={styles.controlsContainer}>
          {/* Toggle */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                mode === 'target' && styles.toggleButtonActive,
              ]}
              onPress={() => setMode('target')}
            >
              <Text
                style={[
                  styles.toggleText,
                  mode === 'target' && styles.toggleTextActive,
                ]}
              >
                {t('targetVerses')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                mode === 'range' && styles.toggleButtonActive,
              ]}
              onPress={() => setMode('range')}
            >
              <Text
                style={[
                  styles.toggleText,
                  mode === 'range' && styles.toggleTextActive,
                ]}
              >
                {t('customRange')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Inputs */}
          {mode === 'target' && (
            <View style={styles.targetOptions}>
              <Text style={styles.sectionLabel}>{t('targetVerses')}</Text>
              <View style={styles.targetButtonsRow}>
                {[10, 100, 1000].map((val) => (
                  <TouchableOpacity
                    key={val}
                    style={[
                      styles.targetButton,
                      targetVerses === val && styles.targetButtonActive,
                    ]}
                    onPress={() => setTargetVerses(val)}
                  >
                    <Text
                      style={[
                        styles.targetButtonText,
                        targetVerses === val && styles.targetButtonTextActive,
                      ]}
                    >
                      {val}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={styles.pickersSection}>
            <Text style={styles.sectionLabel}>
              {mode === 'target' ? t('startingPoint') : t('startingPoint')}
            </Text>

            {/* Start Picker */}
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

            {/* End Picker (Range Mode Only) */}
            {mode === 'range' && (
              <>
                <Text style={[styles.sectionLabel, { marginTop: 16 }]}>
                  {t('endingPoint')}
                </Text>
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
              </>
            )}
          </View>
        </View>

        {/* Range Display */}
        <View style={styles.rangeDisplayCard}>
          <View style={styles.rangeRow}>
            <View style={styles.rangeItem}>
              <Text style={styles.rangeSurah}>
                {getSurahName(range.startSurah)}
              </Text>
              <Text style={styles.rangeAyah}>
                {t('ayah')} {range.startAyah}
              </Text>
            </View>
            <Feather
              name={isRTL ? 'arrow-left' : 'arrow-right'}
              size={20}
              color="#ffffff"
              style={{ opacity: 0.5 }}
            />
            <View style={styles.rangeItem}>
              <Text style={styles.rangeSurah}>
                {getSurahName(range.endSurah)}
              </Text>
              <Text style={styles.rangeAyah}>
                {t('ayah')} {range.endAyah}
              </Text>
            </View>
          </View>
          <View style={styles.rangeResultContainer}>
            <Text style={styles.rangeResultNumber}>{range.totalAyahs}</Text>
            <Text style={styles.rangeResultLabel}>{t('verses')}</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Picker Modals */}
      <PickerModal
        visible={showStartSurahPicker}
        onClose={() => setShowStartSurahPicker(false)}
        onSelect={(value) => {
          setSelectedSurah(value);
          // Reset ayah if it exceeds the new surah's ayahs
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
          // Reset ayah if it exceeds the new surah's ayahs
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
    // Hero Section
    heroSection: {
      alignItems: 'center',
      marginBottom: 32,
    },
    heroIcon: {
      marginBottom: 16,
    },
    heroTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#ffffff',
      marginBottom: 8,
      fontFamily: isRTL ? 'NotoNaskhArabic-Bold' : undefined,
    },
    heroSubtitle: {
      fontSize: 16,
      color: 'rgba(255,255,255,0.6)',
      textAlign: 'center',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    // Range Display
    rangeDisplayCard: {
      backgroundColor: '#0f0f0f',
      borderRadius: 20,
      padding: 20,
      marginTop: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
    },
    rangeRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    rangeItem: {
      alignItems: isRTL ? 'flex-end' : 'flex-start',
      flex: 1,
    },
    rangeSurah: {
      fontSize: 16,
      fontWeight: '600',
      color: '#ffffff',
      marginBottom: 4,
      fontFamily: isRTL ? 'NotoNaskhArabic-Bold' : undefined,
    },
    rangeAyah: {
      fontSize: 14,
      color: 'rgba(255,255,255,0.6)',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    rangeResultContainer: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'center',
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,255,255,0.1)',
      gap: 8,
    },
    rangeResultNumber: {
      fontSize: 36,
      fontWeight: 'bold',
      color: '#ffffff',
    },
    rangeResultLabel: {
      fontSize: 16,
      color: 'rgba(255,255,255,0.5)',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    controlsContainer: {
      backgroundColor: '#0f0f0f',
      borderRadius: 24,
      padding: 24,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
    },
    toggleContainer: {
      flexDirection: 'row',
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: 16,
      padding: 4,
      marginBottom: 24,
    },
    toggleButton: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      borderRadius: 12,
    },
    toggleButtonActive: {
      backgroundColor: '#ffffff',
    },
    toggleText: {
      fontSize: 15,
      fontWeight: '600',
      color: 'rgba(255,255,255,0.6)',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    toggleTextActive: {
      color: '#000000',
    },
    targetOptions: {
      marginBottom: 24,
    },
    sectionLabel: {
      fontSize: 14,
      color: 'rgba(255,255,255,0.6)',
      marginBottom: 12,
      marginLeft: 4,
      textAlign: isRTL ? 'right' : 'left',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    targetButtonsRow: {
      flexDirection: 'row',
      gap: 12,
    },
    targetButton: {
      flex: 1,
      backgroundColor: 'rgba(255,255,255,0.1)',
      paddingVertical: 16,
      alignItems: 'center',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    targetButtonActive: {
      borderColor: '#ffffff',
      backgroundColor: 'rgba(255,255,255,0.2)',
    },
    targetButtonText: {
      fontSize: 18,
      fontWeight: '600',
      color: '#ffffff',
    },
    targetButtonTextActive: {
      fontWeight: '700',
    },
    pickersSection: {
      gap: 12,
    },
    pickerRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      gap: 12,
    },
  });
