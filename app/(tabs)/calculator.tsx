import { Feather } from '@expo/vector-icons';
import {
  CalculationMethod,
  Coordinates,
  HighLatitudeRule,
  PrayerTimes,
  SunnahTimes,
} from 'adhan';
import * as Location from 'expo-location';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AppState,
  Dimensions,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AnimatedGradientBackground } from '../../components/AnimatedGradientBackground';
import { PickerModal, PickerOption } from '../../components/PickerModal';
import { SelectField } from '../../components/SelectField';
import { useI18n } from '../../contexts/I18nContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLastNightStats, usePrayerLogs } from '../../hooks/useOfflineData';
import {
  calculateQuranDivisions,
  calculateVerseRange,
  calculateVersesBetween,
  getVerseStatus,
  globalIndexToSurahAyah,
  quranData,
  quranDisplayData,
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

  const [lastThirdTime, setLastThirdTime] = useState<string | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [showHadithModal, setShowHadithModal] = useState(false);

  const { t, isRTL } = useI18n();
  const { themedColorsEnabled } = useTheme();
  const { logs } = usePrayerLogs();
  const { gradientColors } = useLastNightStats(themedColorsEnabled);

  const lastEntry = logs.length > 0 ? logs[0] : null;

  // Set default starting point based on last entry's end point
  useEffect(() => {
    if (lastEntry && lastEntry.recitations.length > 0) {
      // Get the last recitation's end position
      const lastRecitation =
        lastEntry.recitations[lastEntry.recitations.length - 1];
      const endInfo = globalIndexToSurahAyah(lastRecitation.end_ayah);
      const endSurahData = quranData.find((s) => s.name === endInfo.surahName);
      if (endSurahData) {
        let nextSurahName: string;
        let nextAyah: number;

        // Check if we need to move to the next surah
        if (endInfo.ayahNumber >= endSurahData.ayahs) {
          // Move to the next surah
          const nextIndex = (endInfo.surahIndex + 1) % quranData.length;
          nextSurahName = quranData[nextIndex].name;
          nextAyah = 1;
        } else {
          // Stay in the same surah, increment ayah
          nextSurahName = endInfo.surahName;
          nextAyah = endInfo.ayahNumber + 1;
        }

        // Skip Al-Fatiha (hidden from calculator)
        if (nextSurahName === quranData[0].name) {
          nextSurahName = quranDisplayData[0].name;
          nextAyah = 1;
        }

        setSelectedSurah(nextSurahName);
        setSelectedAyah(nextAyah);
      }
    }
  }, [lastEntry?.id]); // Only run when the last entry changes

  const calculateLastThird = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setLocationDenied(true);
      setLastThirdTime(null);
      return;
    }
    setLocationDenied(false);
    const position = await Location.getCurrentPositionAsync({});
    const coords = new Coordinates(
      position.coords.latitude,
      position.coords.longitude,
    );
    const params = CalculationMethod.MuslimWorldLeague();
    params.highLatitudeRule = HighLatitudeRule.recommended(coords);
    const prayerTimes = new PrayerTimes(coords, new Date(), params);
    const sunnahTimes = new SunnahTimes(prayerTimes);
    setLastThirdTime(
      sunnahTimes.lastThirdOfTheNight.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    );
  }, []);

  useEffect(() => {
    calculateLastThird();
  }, [calculateLastThird]);

  const appState = useRef(AppState.currentState);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        calculateLastThird();
      }
      appState.current = nextAppState;
    });
    return () => subscription.remove();
  }, [calculateLastThird]);

  const getSurahName = (name: string) => {
    const surah = quranData.find((s) => s.name === name);
    return isRTL ? surah?.nameAr || name : name;
  };

  const currentSurah = quranData.find((s) => s.name === selectedSurah);
  const endCurrentSurah = quranData.find((s) => s.name === endSurah);

  // Surah picker options — grouped by Juz' (Al-Fatiha excluded)
  const surahSections = useMemo(() => {
    const grouped: Record<number, typeof quranData> = {};
    quranDisplayData.forEach((surah) => {
      if (!grouped[surah.juz]) grouped[surah.juz] = [];
      grouped[surah.juz].push(surah);
    });
    return Array.from({ length: 30 }, (_, i) => i + 1)
      .filter((juz) => grouped[juz]?.length > 0)
      .map((juz) => ({
        title: isRTL ? `الجزء ${juz}` : `Juz' ${juz}`,
        data: grouped[juz].map((surah) => {
          const globalIndex = quranData.indexOf(surah);
          return {
            label: isRTL ? surah.nameAr : surah.name,
            value: surah.name,
            searchTerms: `${surah.name} ${surah.nameAr}`,
            subtitle: isRTL ? `${surah.ayahs} آية` : `${surah.ayahs} verses`,
            badge: globalIndex + 1,
          };
        }),
      }));
  }, [isRTL]);

  // Ayah picker options for start surah
  const startAyahOptions: PickerOption[] = useMemo(
    () =>
      Array.from({ length: currentSurah?.ayahs || 0 }, (_, i) => ({
        label: String(i + 1),
        value: String(i + 1),
      })),
    [currentSurah],
  );

  // Ayah picker options for end surah
  const endAyahOptions: PickerOption[] = useMemo(
    () =>
      Array.from({ length: endCurrentSurah?.ayahs || 0 }, (_, i) => ({
        label: String(i + 1),
        value: String(i + 1),
      })),
    [endCurrentSurah],
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
            endAyah,
          ),
        };

  const status = getVerseStatus(range.totalAyahs);

  const divisions = calculateQuranDivisions(
    range.startSurah,
    range.startAyah,
    range.endSurah,
    range.endAyah,
  );

  const formatDivision = (value: number) =>
    value < 0.1 ? '<0.1' : value.toFixed(1).replace(/\.0$/, '');

  const formatTime = (minutes: number) => {
    const rounded = Math.floor(minutes / 5) * 5;
    if (rounded < 60) return `~${rounded} ${t('estTimeUnit')}`;
    const h = Math.floor(rounded / 60);
    const m = rounded % 60;
    const hUnit = t('estHourUnit');
    return m > 0 ? `~${h}${hUnit} ${m}${t('estTimeUnit')}` : `~${h}${hUnit}`;
  };

  const wholeJuz = Math.floor(divisions.rub / 8);
  const remainingRub = divisions.rub % 8;
  const showJuz = wholeJuz >= 1;
  const showRemainingRub = remainingRub >= 0.1;

  const styles = createStyles(isRTL);

  return (
    <View style={styles.container}>
      <AnimatedGradientBackground colors={gradientColors} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>{t('verseCalculator')}</Text>
          <Text style={styles.heroSubtitle}>
            {t('calculateYourNightPrayerVerses')}
          </Text>
        </View>

        {/* Last Third of the Night */}
        <View style={styles.lastThirdCard}>
          <View style={styles.lastThirdIconContainer}>
            <Feather name="moon" size={20} color="rgba(255,255,255,0.7)" />
          </View>
          <View style={styles.lastThirdContent}>
            <Text style={styles.lastThirdLabel}>{t('lastThirdOfNight')}</Text>
            {locationDenied ? (
              <TouchableOpacity onPress={() => Linking.openSettings()}>
                <Text style={styles.lastThirdDenied}>
                  {t('locationPermissionDenied')}
                </Text>
              </TouchableOpacity>
            ) : lastThirdTime ? (
              <Text style={styles.lastThirdTime}>{lastThirdTime}</Text>
            ) : (
              <Text style={styles.lastThirdDenied}>{t('loading')}</Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.hadithInfoButton}
            onPress={() => setShowHadithModal(true)}
          >
            <Feather name="info" size={16} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
        </View>

        {/* Hadith Modal */}
        <Modal
          visible={showHadithModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowHadithModal(false)}
        >
          <TouchableOpacity
            style={styles.hadithModalOverlay}
            activeOpacity={1}
            onPress={() => setShowHadithModal(false)}
          >
            <TouchableOpacity activeOpacity={1} style={styles.hadithModalCard}>
              <View style={styles.hadithModalHeader}>
                <Text style={styles.hadithModalTitle}>
                  {t('lastThirdHadithTitle')}
                </Text>
                <TouchableOpacity onPress={() => setShowHadithModal(false)}>
                  <Feather name="x" size={20} color="rgba(255,255,255,0.6)" />
                </TouchableOpacity>
              </View>
              <Text style={styles.hadithModalText}>
                {t('lastThirdHadithText')}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

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
            <View style={{ paddingHorizontal: 12, justifyContent: 'center' }}>
              <Feather
                name={isRTL ? 'arrow-left' : 'arrow-right'}
                size={24}
                color="#ffffff"
                style={{ opacity: 0.5 }}
              />
            </View>
            <View style={[styles.rangeItem, styles.rangeItemEnd]}>
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
          <View style={styles.divisionsRow}>
            <View style={styles.divisionLeft}>
              {showJuz && (
                <View style={styles.divisionChip}>
                  <Text style={styles.divisionValue}>{wholeJuz}</Text>
                  <Text style={styles.divisionLabel}>{t('juzUnit')}</Text>
                </View>
              )}
              {showJuz && showRemainingRub && (
                <Text style={styles.divisionAmpersand}>&</Text>
              )}
              {(!showJuz || showRemainingRub) && (
                <View style={styles.divisionChip}>
                  <Text style={styles.divisionValue}>
                    {formatDivision(showJuz ? remainingRub : divisions.rub)}
                  </Text>
                  <Text style={styles.divisionLabel}>{t('rubUnit')}</Text>
                </View>
              )}
            </View>
            <View style={styles.divisionDivider} />
            <View style={styles.divisionTimeChip}>
              <Text style={styles.divisionValue}>
                {formatTime(divisions.minutes)}
              </Text>
            </View>
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
        sections={surahSections}
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
        sections={surahSections}
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
      marginTop: 32,
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
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
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
      alignItems: 'center',
      flex: 1,
    },
    rangeItemEnd: {
      alignItems: 'center',
    },
    rangeSurah: {
      fontSize: 16,
      fontWeight: '600',
      color: '#ffffff',
      marginBottom: 4,
      textAlign: 'center',
      fontFamily: isRTL ? 'NotoNaskhArabic-Bold' : undefined,
    },
    rangeAyah: {
      fontSize: 14,
      color: 'rgba(255,255,255,0.6)',
      textAlign: 'center',
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
    divisionsRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,255,255,0.08)',
      alignItems: 'center',
    },
    divisionLeft: {
      flex: 2,
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'space-evenly',
    },
    divisionChip: {
      flex: 1,
      alignItems: 'center',
      gap: 2,
    },
    divisionTimeChip: {
      flex: 2,
      alignItems: 'center',
    },
    divisionValue: {
      fontSize: 15,
      fontWeight: '600',
      color: '#ffffff',
    },
    divisionLabel: {
      fontSize: 11,
      color: 'rgba(255,255,255,0.4)',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    divisionDivider: {
      width: 1,
      height: 28,
      backgroundColor: 'rgba(255,255,255,0.1)',
    },
    divisionAmpersand: {
      fontSize: 13,
      color: 'rgba(255,255,255,0.4)',
      alignSelf: 'center',
      paddingBottom: 10,
    },
    controlsContainer: {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
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
      paddingVertical: isRTL ? 6 : 12,
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
    lastThirdCard: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      borderRadius: 20,
      padding: 20,
      marginTop: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
      gap: 16,
    },
    lastThirdIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.1)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    lastThirdContent: {
      flex: 1,
      alignItems: isRTL ? 'flex-end' : 'flex-start',
    },
    lastThirdLabel: {
      fontSize: 13,
      color: 'rgba(255,255,255,0.5)',
      marginBottom: 4,
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    lastThirdTime: {
      fontSize: 22,
      fontWeight: '700',
      color: '#ffffff',
    },
    lastThirdDenied: {
      fontSize: 13,
      color: 'rgba(255,255,255,0.4)',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    hadithInfoButton: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    hadithModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    hadithModalCard: {
      backgroundColor: '#1a1a1a',
      borderRadius: 24,
      padding: 24,
      width: '100%',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
    },
    hadithModalHeader: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    hadithModalTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: '#ffffff',
      fontFamily: isRTL ? 'NotoNaskhArabic-Bold' : undefined,
      flex: 1,
      textAlign: isRTL ? 'right' : 'left',
    },
    hadithModalText: {
      fontSize: isRTL ? 17 : 15,
      color: 'rgba(255,255,255,0.85)',
      lineHeight: isRTL ? 30 : 24,
      textAlign: isRTL ? 'right' : 'left',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
  });
