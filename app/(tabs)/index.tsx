import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useMemo } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import {
  calculateVerseRange,
  calculateVersesBetween,
  getVerseStatus,
  getGradientColors,
  quranData,
} from '../../utils/quranData';
import { useI18n } from '../../contexts/I18nContext';
import { usePrayerLogs, useOfflineStats, useOfflineData } from '../../hooks/useOfflineData';
import { SelectField } from '../../components/SelectField';
import { PickerModal, PickerOption } from '../../components/PickerModal';

const { width } = Dimensions.get('window');

export default function NightPrayerScreen() {
  const [mode, setMode] = useState<'target' | 'range'>('target');
  const [selectedSurah, setSelectedSurah] = useState('Al-Baqara');
  const [selectedAyah, setSelectedAyah] = useState(1);
  const [targetVerses, setTargetVerses] = useState(10);

  const [endSurah, setEndSurah] = useState('Al-Baqara');
  const [endAyah, setEndAyah] = useState(1);

  // Modal visibility states
  const [showStartSurahPicker, setShowStartSurahPicker] = useState(false);
  const [showStartAyahPicker, setShowStartAyahPicker] = useState(false);
  const [showEndSurahPicker, setShowEndSurahPicker] = useState(false);
  const [showEndAyahPicker, setShowEndAyahPicker] = useState(false);

  const { t, isRTL } = useI18n();
  const { isInitialized } = useOfflineData();
  const { logs } = usePrayerLogs();
  const { streak, yearlyData } = useOfflineStats();

  const lastEntry = logs.length > 0 ? logs[0] : null;

  const gradientColors = useMemo(() => {
    const totalVerses = lastEntry?.total_ayahs || 0;
    return getGradientColors(totalVerses);
  }, [lastEntry]);

  // Calculate stats from yearlyData
  const computedStats = React.useMemo(() => {
    const values = Object.values(yearlyData).map((d) => d.verses);
    const totalAyahs = values.reduce((sum, v) => sum + v, 0);
    const bestNight = values.length > 0 ? Math.max(...values) : 0;
    const averageAyahs = values.length > 0 ? Math.round(totalAyahs / values.length) : 0;
    return { totalAyahs, bestNight, averageAyahs };
  }, [yearlyData]);

  const getSurahName = (name: string) => {
    const surah = quranData.find(s => s.name === name);
    return isRTL ? surah?.nameAr || name : name;
  };

  const currentSurah = quranData.find((s) => s.name === selectedSurah);
  const endCurrentSurah = quranData.find((s) => s.name === endSurah);

  // Surah picker options
  const surahOptions: PickerOption[] = useMemo(() =>
    quranData.map((surah) => ({
      label: isRTL ? surah.nameAr : surah.name,
      value: surah.name,
      searchTerms: `${surah.name} ${surah.nameAr}`,
    })),
    [isRTL]
  );

  // Ayah picker options for start surah
  const startAyahOptions: PickerOption[] = useMemo(() =>
    Array.from({ length: currentSurah?.ayahs || 0 }, (_, i) => ({
      label: String(i + 1),
      value: String(i + 1),
    })),
    [currentSurah]
  );

  // Ayah picker options for end surah
  const endAyahOptions: PickerOption[] = useMemo(() =>
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

  // Force dark theme styles for this specific design
  const styles = createStyles(isRTL);

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
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Image
            source={require('../../assets/images/moon-image.png')}
            style={styles.heroMoonImage}
          />
          <Text style={styles.heroTitle}>Qanet</Text>
          <Text style={styles.heroSubtitle}>
            {t('calculateYourNightPrayerVerses')}
          </Text>
        </View>

        {/* Streak & Last Entry Card */}
        <View style={styles.dashboardCard}>
          <View style={styles.dashboardRow}>
            <View style={styles.dashboardItem}>
              <View style={styles.streakContainer}>
                <Text style={styles.streakNumber}>{streak}</Text>
                <Text style={styles.streakEmoji}>🔥</Text>
              </View>
              <Text style={styles.dashboardLabel}>{t('currentStreak')}</Text>
            </View>

            <View style={styles.dashboardDivider} />

            <View style={styles.dashboardItem}>
              {lastEntry ? (
                <>
                  <Text style={styles.lastEntryNumber}>{lastEntry.total_ayahs}</Text>
                  <Text style={styles.dashboardLabel}>{t('lastNight')}</Text>
                </>
              ) : (
                <>
                  <Text style={styles.lastEntryNumber}>—</Text>
                  <Text style={styles.dashboardLabel}>{t('lastNight')}</Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStatsRow}>
          <View style={styles.quickStatCard}>
            <Text style={styles.quickStatNumber}>{computedStats.totalAyahs.toLocaleString()}</Text>
            <Text style={styles.quickStatLabel}>{t('totalVerses')}</Text>
          </View>
          <View style={styles.quickStatCard}>
            <Text style={styles.quickStatNumber}>{computedStats.bestNight}</Text>
            <Text style={styles.quickStatLabel}>{t('bestNight')}</Text>
          </View>
          <View style={styles.quickStatCard}>
            <Text style={styles.quickStatNumber}>{computedStats.averageAyahs}</Text>
            <Text style={styles.quickStatLabel}>{t('average')}</Text>
          </View>
        </View>

        {/* Calculator Section Header */}
        <View style={styles.sectionHeader}>
          <Ionicons name="calculator-outline" size={20} color="rgba(255,255,255,0.6)" />
          <Text style={styles.sectionHeaderText}>{t('verseCalculator')}</Text>
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
              <Text style={styles.rangeSurah}>{getSurahName(range.startSurah)}</Text>
              <Text style={styles.rangeAyah}>{t('ayah')} {range.startAyah}</Text>
            </View>
            <Feather name={isRTL ? "arrow-left" : "arrow-right"} size={20} color="#ffffff" style={{ opacity: 0.5 }} />
            <View style={styles.rangeItem}>
              <Text style={styles.rangeSurah}>{getSurahName(range.endSurah)}</Text>
              <Text style={styles.rangeAyah}>{t('ayah')} {range.endAyah}</Text>
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
  // Hero Section
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  heroMoonImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 36,
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
  // Dashboard Card
  dashboardCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  dashboardRow: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
  },
  dashboardItem: {
    flex: 1,
    alignItems: 'center',
  },
  dashboardDivider: {
    width: 1,
    height: 60,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: 20,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streakNumber: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  streakEmoji: {
    fontSize: 28,
  },
  lastEntryNumber: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  dashboardLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
    fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
  },
  // Quick Stats
  quickStatsRow: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    gap: 12,
    marginBottom: 32,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  quickStatNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  quickStatLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
  },
  // Section Header
  sectionHeader: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sectionHeaderText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    fontFamily: isRTL ? 'NotoNaskhArabic-Bold' : undefined,
  },
  // Range Display
  rangeDisplayCard: {
    backgroundColor: '#0f0f0f',
    borderRadius: 20,
    padding: 20,
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