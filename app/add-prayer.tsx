import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { onboardingManager } from '@/utils/onboarding';
import { PickerModal, PickerOption } from '../components/PickerModal';
import { SelectField } from '../components/SelectField';
import { useI18n } from '../contexts/I18nContext';
import { useTheme } from '../contexts/ThemeContext';
import { useExemptPeriods, usePrayerLogs } from '../hooks/useOfflineData';
import {
  calculateVersesBetween,
  getGradientColors,
  getVerseStatus,
  quranData,
  quranDisplayData,
  surahAyahToGlobalIndex,
} from '../utils/quranData';

const SHAF_WITR_SURAHS = [
  "Al-A'la",
  'Al-Kafiroon',
  'Al-Ikhlas',
  'Al-Falaq',
  'An-Nas',
] as const;

export default function AddPrayerScreen() {
  const { isRTL, t } = useI18n();
  const { themedColorsEnabled } = useTheme();
  const insets = useSafeAreaInsets();
  const { createLog } = usePrayerLogs();
  const { createPeriod } = useExemptPeriods();

  // Gender state — only show period option for female users
  const [isMale, setIsMale] = useState<boolean | null>(null);
  useEffect(() => {
    onboardingManager.getOnboardingData().then((data) => {
      setIsMale(data?.isMale ?? true);
    });
  }, []);

  // Form state
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Period exemption state
  const [isPeriodMode, setIsPeriodMode] = useState(false);
  const [periodEndDate, setPeriodEndDate] = useState(new Date());
  const [showPeriodEndPicker, setShowPeriodEndPicker] = useState(false);

  const [ranges, setRanges] = useState<
    Array<{
      id: string;
      startSurah: string;
      startAyah: number;
      endSurah: string;
      endAyah: number;
      isWholeSurah?: boolean;
      isShafWitr?: boolean;
    }>
  >([
    {
      id: '1',
      startSurah: 'Al-Baqara',
      startAyah: 1,
      endSurah: 'Al-Baqara',
      endAyah: 2,
      isWholeSurah: false,
    },
  ]);
  const [activeRangeId, setActiveRangeId] = useState<string>('1');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Shaf' & Witr preset state
  const [shafWitrEnabled, setShafWitrEnabled] = useState(false);

  // Animation state
  const successAnim = useSharedValue(0); // 0: initial, 1: success

  // Modal visibility states
  const [showStartSurahPicker, setShowStartSurahPicker] = useState(false);
  const [showStartAyahPicker, setShowStartAyahPicker] = useState(false);
  const [showEndSurahPicker, setShowEndSurahPicker] = useState(false);
  const [showEndAyahPicker, setShowEndAyahPicker] = useState(false);

  const styles = createStyles(isRTL);

  const userRanges = ranges.filter((r) => !r.isShafWitr);
  const activeRange =
    ranges.find((r) => r.id === activeRangeId) || userRanges[0] || ranges[0];
  const currentSurah = activeRange
    ? quranData.find((s) => s.name === activeRange.startSurah)
    : undefined;
  const endCurrentSurah = activeRange
    ? quranData.find((s) => s.name === activeRange.endSurah)
    : undefined;

  const getSurahName = (name: string) => {
    const surah = quranData.find((s) => s.name === name);
    return isRTL ? surah?.nameAr || name : name;
  };

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
            subtitle: isRTL
              ? `${surah.ayahs} آية`
              : `${surah.ayahs} verses`,
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

  const totalVerses = useMemo(
    () =>
      ranges.reduce((acc, range) => {
        return (
          acc +
          calculateVersesBetween(
            range.startSurah,
            range.startAyah,
            range.endSurah,
            range.endAyah,
          )
        );
      }, 0),
    [ranges],
  );

  const status = getVerseStatus(totalVerses);
  const gradientColors = useMemo(
    () => getGradientColors(totalVerses, themedColorsEnabled),
    [totalVerses, themedColorsEnabled],
  );

  const updateRange = (id: string, updates: Partial<(typeof ranges)[0]>) => {
    setRanges((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    );
  };

  const addRange = () => {
    const userRanges = ranges.filter((r) => !r.isShafWitr);
    const lastRange = userRanges[userRanges.length - 1];
    const newRange = lastRange
      ? {
          id: Date.now().toString(),
          startSurah: lastRange.endSurah,
          startAyah: lastRange.endAyah,
          endSurah: lastRange.endSurah,
          endAyah: lastRange.endAyah,
        }
      : {
          id: Date.now().toString(),
          startSurah: 'Al-Baqara',
          startAyah: 1,
          endSurah: 'Al-Baqara',
          endAyah: 2,
          isWholeSurah: false,
        };
    setRanges((prev) => [...prev, newRange]);
  };

  const removeRange = (id: string) => {
    setRanges((prev) => prev.filter((r) => r.id !== id));
  };

  const handleWholeSurahToggle = (id: string, value: boolean) => {
    const range = ranges.find((r) => r.id === id);
    if (!range) return;

    if (value) {
      const surah = quranData.find((s) => s.name === range.startSurah);
      if (surah) {
        updateRange(id, {
          isWholeSurah: true,
          startAyah: 1,
          endSurah: range.startSurah,
          endAyah: surah.ayahs,
        });
      }
    } else {
      updateRange(id, { isWholeSurah: false });
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      if (isPeriodMode) {
        const startStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const endStr = `${periodEndDate.getFullYear()}-${String(periodEndDate.getMonth() + 1).padStart(2, '0')}-${String(periodEndDate.getDate()).padStart(2, '0')}`;
        await createPeriod(startStr, endStr);
      } else {
        const recitations = ranges.map((range) => ({
          start_ayah: surahAyahToGlobalIndex(range.startSurah, range.startAyah),
          end_ayah: surahAyahToGlobalIndex(range.endSurah, range.endAyah),
        }));

        await createLog({
          prayer_date: date,
          recitations,
        });
      }

      // Success Feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Trigger animation
      successAnim.value = withSpring(1, { damping: 12 });

      // Delay closing to show animation
      setTimeout(() => {
        router.back();
      }, 300);
    } catch (err: any) {
      setError(err.message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setLoading(false);
    }
  };

  const onDateChange = (_event: any, selectedDate?: Date) => {
    // On Android, close the picker immediately. On iOS, keep it open.
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleClose = () => {
    if (!loading && successAnim.value === 0) {
      router.back();
    }
  };

  // Animated Styles
  const buttonTextStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        successAnim.value,
        [0, 0.5],
        [1, 0],
        Extrapolation.CLAMP,
      ),
      maxWidth: interpolate(
        successAnim.value,
        [0, 1],
        [200, 0],
        Extrapolation.CLAMP,
      ), // Collapses width
      transform: [
        {
          translateX: interpolate(
            successAnim.value,
            [0, 1],
            [0, isRTL ? -10 : 10],
            Extrapolation.CLAMP,
          ),
        },
      ],
      marginHorizontal: interpolate(
        successAnim.value,
        [0, 1],
        [4, 0],
        Extrapolation.CLAMP,
      ),
    };
  });

  const iconStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: interpolate(
            successAnim.value,
            [0, 0.5, 1],
            [1, 0.8, 1.2],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });

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
          disabled={loading || successAnim.value > 0}
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

        {/* Status Card — hidden in period mode */}
        {!isPeriodMode && (
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Image
                source={require('../assets/images/moon-image.png')}
                style={styles.moonImage}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
              <View style={styles.statusTextContainer}>
                <Text style={styles.statusTitle}>
                  {t(status.status.toLowerCase().replace(/\s+/g, ''))}
                </Text>
                <Text style={styles.statusDescription}>
                  {t(status.descriptionKey)}
                </Text>
              </View>
            </View>

            <View style={styles.totalVersesContainer}>
              <Text style={styles.totalVersesNumber}>{totalVerses}</Text>
              <Text style={styles.totalVersesLabel}>{t('totalVerses')}</Text>
            </View>
          </View>
        )}

        {/* Date Selection — hidden in period mode (period card has its own date pickers) */}
        {!isPeriodMode && (
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
                {date.toLocaleDateString(isRTL ? 'ar-SA-u-ca-gregory' : 'en-US', {
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
          </View>
        )}

        {/* Period Exemption — only for female users */}
        {isMale === false && (
          <View style={styles.card}>
            <View
              style={[
                styles.cardHeader,
                {
                  justifyContent: 'space-between',
                  marginBottom: isPeriodMode ? 16 : 0,
                },
              ]}
            >
              <View
                style={{
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color="rgba(255,255,255,0.7)"
                />
                <View>
                  <Text style={styles.cardTitle}>{t('markAsPeriod')}</Text>
                  {!isPeriodMode && (
                    <Text style={styles.shafWitrDesc}>
                      {t('periodExemptionDesc')}
                    </Text>
                  )}
                </View>
              </View>
              <Switch
                value={isPeriodMode}
                onValueChange={(val) => {
                  setIsPeriodMode(val);
                  if (val) {
                    // Default end date to 7 days from start
                    const end = new Date(date);
                    end.setDate(end.getDate() + 6);
                    setPeriodEndDate(end);
                  }
                }}
                trackColor={{ false: '#767577', true: '#f472b6' }}
                thumbColor={isPeriodMode ? '#ffffff' : '#f4f3f4'}
                style={
                  Platform.OS === 'ios' ? { transform: [{ scale: 0.8 }] } : {}
                }
              />
            </View>

            {isPeriodMode && (
              <View style={{ gap: 12 }}>
                <View>
                  <Text style={styles.sectionLabel}>
                    {t('periodStartDate')}
                  </Text>
                  <TouchableOpacity
                    style={styles.dateDisplay}
                    onPress={() => setShowDatePicker(true)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.dateText}>
                      {date.toLocaleDateString(isRTL ? 'ar-SA-u-ca-gregory' : 'en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                    <MaterialIcons
                      name="edit"
                      size={16}
                      color="rgba(255,255,255,0.5)"
                    />
                  </TouchableOpacity>
                </View>
                <View>
                  <Text style={styles.sectionLabel}>{t('periodEndDate')}</Text>
                  <TouchableOpacity
                    style={styles.dateDisplay}
                    onPress={() => setShowPeriodEndPicker(true)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.dateText}>
                      {periodEndDate.toLocaleDateString(
                        isRTL ? 'ar-SA-u-ca-gregory' : 'en-US',
                        {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        },
                      )}
                    </Text>
                    <MaterialIcons
                      name="edit"
                      size={16}
                      color="rgba(255,255,255,0.5)"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Shaf' & Witr Preset */}
        {!isPeriodMode && (
          <View style={styles.card}>
            <View
              style={[
                styles.cardHeader,
                { justifyContent: 'space-between', marginBottom: 0 },
              ]}
            >
              <View
                style={{
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <Ionicons
                  name="moon-outline"
                  size={20}
                  color="rgba(255,255,255,0.7)"
                />
                <View>
                  <Text style={styles.cardTitle}>{t('shafWitr')}</Text>
                  {/* {!shafWitrEnabled && (
                  <Text style={styles.shafWitrDesc}>{t('shafWitrDesc')}</Text>
                )} */}
                </View>
              </View>
              <Switch
                value={shafWitrEnabled}
                onValueChange={(val) => {
                  setShafWitrEnabled(val);
                  if (val) {
                    // Replace default range with 5 shaf/witr ranges
                    const shafWitrRanges = SHAF_WITR_SURAHS.map((name) => {
                      const s = quranData.find((q) => q.name === name)!;
                      return {
                        id: `sw-${name}`,
                        startSurah: name,
                        startAyah: 1,
                        endSurah: name,
                        endAyah: s.ayahs,
                        isWholeSurah: true,
                        isShafWitr: true,
                      };
                    });
                    setRanges(shafWitrRanges);
                  } else {
                    // Remove shaf/witr ranges, restore default if nothing left
                    setRanges((prev) => {
                      const userRanges = prev.filter((r) => !r.isShafWitr);
                      return userRanges.length > 0
                        ? userRanges
                        : [
                            {
                              id: Date.now().toString(),
                              startSurah: 'Al-Baqara',
                              startAyah: 1,
                              endSurah: 'Al-Baqara',
                              endAyah: 2,
                              isWholeSurah: false,
                            },
                          ];
                    });
                  }
                }}
                trackColor={{ false: '#767577', true: '#22c55e' }}
                thumbColor={shafWitrEnabled ? '#ffffff' : '#f4f3f4'}
                style={
                  Platform.OS === 'ios' ? { transform: [{ scale: 0.8 }] } : {}
                }
              />
            </View>

            {shafWitrEnabled && (
              <View style={styles.pillsContainer}>
                {SHAF_WITR_SURAHS.map((surahName) => {
                  const surah = quranData.find((s) => s.name === surahName)!;
                  const isActive = ranges.some(
                    (r) => r.isShafWitr && r.startSurah === surahName,
                  );
                  return (
                    <TouchableOpacity
                      key={surahName}
                      style={[
                        styles.surahPill,
                        isActive && styles.surahPillActive,
                      ]}
                      onPress={() => {
                        if (isActive) {
                          const remaining = ranges.filter(
                            (r) =>
                              !(r.isShafWitr && r.startSurah === surahName),
                          );
                          const hasShafWitrLeft = remaining.some(
                            (r) => r.isShafWitr,
                          );
                          if (!hasShafWitrLeft) {
                            // All pills deselected — turn off toggle
                            setShafWitrEnabled(false);
                            const userRemaining = remaining.filter(
                              (r) => !r.isShafWitr,
                            );
                            setRanges(
                              userRemaining.length > 0
                                ? userRemaining
                                : [
                                    {
                                      id: Date.now().toString(),
                                      startSurah: 'Al-Baqara',
                                      startAyah: 1,
                                      endSurah: 'Al-Baqara',
                                      endAyah: 2,
                                      isWholeSurah: false,
                                    },
                                  ],
                            );
                          } else {
                            setRanges(remaining);
                          }
                        } else {
                          setRanges((prev) => [
                            ...prev,
                            {
                              id: `sw-${surahName}`,
                              startSurah: surahName,
                              startAyah: 1,
                              endSurah: surahName,
                              endAyah: surah.ayahs,
                              isWholeSurah: true,
                              isShafWitr: true,
                            },
                          ]);
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.surahPillText,
                          isActive && styles.surahPillTextActive,
                        ]}
                      >
                        {getSurahName(surahName)}
                      </Text>
                      <View
                        style={[
                          styles.surahPillBadge,
                          isActive && styles.surahPillBadgeActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.surahPillBadgeText,
                            isActive && styles.surahPillBadgeTextActive,
                          ]}
                        >
                          {surah.ayahs}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {!isPeriodMode && (
          <>
            {/* Reading Range Inputs */}
            {ranges
              .filter((r) => !r.isShafWitr)
              .map((range, index) => (
                <View key={range.id} style={styles.card}>
                  <View
                    style={[
                      styles.cardHeader,
                      { justifyContent: 'space-between' },
                    ]}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      <Ionicons
                        name="book-outline"
                        size={20}
                        color="rgba(255,255,255,0.7)"
                      />
                      <Text style={styles.cardTitle}>
                        {t('readingRange')}{' '}
                        {ranges.filter((r) => !r.isShafWitr).length > 1
                          ? index + 1
                          : ''}
                      </Text>
                    </View>
                    {(shafWitrEnabled ||
                      ranges.filter((r) => !r.isShafWitr).length > 1) && (
                      <TouchableOpacity onPress={() => removeRange(range.id)}>
                        <Ionicons
                          name="trash-outline"
                          size={20}
                          color="#ff6b6b"
                        />
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.pickersSection}>
                    {/* Whole Surah Toggle */}
                    <View style={styles.toggleRow}>
                      <Text style={styles.toggleLabel}>{t('wholeSurah')}</Text>
                      <Switch
                        value={range.isWholeSurah || false}
                        onValueChange={(val) =>
                          handleWholeSurahToggle(range.id, val)
                        }
                        trackColor={{ false: '#767577', true: '#22c55e' }}
                        thumbColor={range.isWholeSurah ? '#ffffff' : '#f4f3f4'}
                        style={
                          Platform.OS === 'ios'
                            ? { transform: [{ scale: 0.8 }] }
                            : {}
                        }
                      />
                    </View>

                    {range.isWholeSurah ? (
                      <>
                        {/* Whole Surah: surah picker + range info on one line */}
                        <View style={styles.wholeSurahRow}>
                          <View style={{ flex: 5 }}>
                            <SelectField
                              label={t('surah')}
                              value={getSurahName(range.startSurah)}
                              onPress={() => {
                                setActiveRangeId(range.id);
                                setShowStartSurahPicker(true);
                              }}
                            />
                          </View>
                          <View style={styles.wholeSurahRangeChip}>
                            <Text style={styles.wholeSurahAyahNum}>1</Text>
                            <Ionicons
                              name={isRTL ? 'arrow-back' : 'arrow-forward'}
                              size={13}
                              color="rgba(255,255,255,0.25)"
                            />
                            <Text style={styles.wholeSurahAyahNum}>
                              {range.endAyah}
                            </Text>
                          </View>
                        </View>
                      </>
                    ) : (
                      <>
                        {/* Start Point */}
                        <Text style={styles.sectionLabel}>
                          {t('startingPoint')}
                        </Text>
                        <View style={styles.pickerRow}>
                          <SelectField
                            label={t('surah')}
                            value={getSurahName(range.startSurah)}
                            onPress={() => {
                              setActiveRangeId(range.id);
                              setShowStartSurahPicker(true);
                            }}
                          />
                          <SelectField
                            label={t('ayah')}
                            value={String(range.startAyah)}
                            onPress={() => {
                              setActiveRangeId(range.id);
                              setShowStartAyahPicker(true);
                            }}
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
                        <Text style={styles.sectionLabel}>
                          {t('endingPoint')}
                        </Text>
                        <View style={styles.pickerRow}>
                          <SelectField
                            label={t('surah')}
                            value={getSurahName(range.endSurah)}
                            onPress={() => {
                              setActiveRangeId(range.id);
                              setShowEndSurahPicker(true);
                            }}
                          />
                          <SelectField
                            label={t('ayah')}
                            value={String(range.endAyah)}
                            onPress={() => {
                              setActiveRangeId(range.id);
                              setShowEndAyahPicker(true);
                            }}
                          />
                        </View>
                      </>
                    )}
                  </View>
                </View>
              ))}

            {/* Add Range Button */}
            <TouchableOpacity
              style={styles.addRangeButton}
              onPress={addRange}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={20} color="#ffffff" />
              <Text style={styles.addRangeText}>{t('addAnotherRange')}</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleClose}
            disabled={loading || successAnim.value > 0}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.saveButton,
              isPeriodMode && {
                backgroundColor: '#f472b6',
                shadowColor: '#f472b6',
              },
              (loading || successAnim.value > 0) && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={loading || successAnim.value > 0}
            activeOpacity={0.8}
          >
            <Animated.View style={iconStyle}>
              <Ionicons name="checkmark-circle" size={24} color="#ffffff" />
            </Animated.View>

            <Animated.Text
              style={[styles.saveButtonText, buttonTextStyle]}
              numberOfLines={1}
            >
              {isPeriodMode ? t('markAsPeriod') : t('savePrayerRecord')}
            </Animated.Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Picker Modals */}
      <PickerModal
        visible={showStartSurahPicker}
        onClose={() => setShowStartSurahPicker(false)}
        onSelect={(value) => {
          const newSurah = quranData.find((s) => s.name === value);
          if (activeRange.isWholeSurah && newSurah) {
            updateRange(activeRangeId, {
              startSurah: value,
              startAyah: 1,
              endSurah: value,
              endAyah: newSurah.ayahs,
            });
          } else if (newSurah && activeRange.startAyah > newSurah.ayahs) {
            updateRange(activeRangeId, { startSurah: value, startAyah: 1 });
          } else {
            updateRange(activeRangeId, { startSurah: value });
          }
        }}
        sections={surahSections}
        selectedValue={activeRange.startSurah}
        title={t('startingSurah')}
        searchPlaceholder={t('surah')}
      />

      <PickerModal
        visible={showStartAyahPicker}
        onClose={() => setShowStartAyahPicker(false)}
        onSelect={(value) =>
          updateRange(activeRangeId, { startAyah: Number(value) })
        }
        options={startAyahOptions}
        selectedValue={String(activeRange.startAyah)}
        title={t('ayah')}
        showSearch={false}
      />

      <PickerModal
        visible={showEndSurahPicker}
        onClose={() => setShowEndSurahPicker(false)}
        onSelect={(value) => {
          const newSurah = quranData.find((s) => s.name === value);
          if (newSurah && activeRange.endAyah > newSurah.ayahs) {
            updateRange(activeRangeId, { endSurah: value, endAyah: 1 });
          } else {
            updateRange(activeRangeId, { endSurah: value });
          }
        }}
        sections={surahSections}
        selectedValue={activeRange.endSurah}
        title={t('endingSurah')}
        searchPlaceholder={t('surah')}
      />

      <PickerModal
        visible={showEndAyahPicker}
        onClose={() => setShowEndAyahPicker(false)}
        onSelect={(value) =>
          updateRange(activeRangeId, { endAyah: Number(value) })
        }
        options={endAyahOptions}
        selectedValue={String(activeRange.endAyah)}
        title={t('ayah')}
        showSearch={false}
      />

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <TouchableOpacity
          style={styles.datePickerModalOverlay}
          activeOpacity={1}
          onPress={() => setShowDatePicker(false)}
        >
          <View style={styles.datePickerModalContent}>
            <View style={styles.datePickerHeader}>
              <Text style={styles.datePickerTitle}>{t('prayerDate')}</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Ionicons
                  name="close"
                  size={24}
                  color="rgba(255,255,255,0.7)"
                />
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
              textColor="#ffffff"
              themeVariant="dark"
              style={styles.datePickerInModal}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Period End Date Picker Modal */}
      <Modal
        visible={showPeriodEndPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPeriodEndPicker(false)}
      >
        <TouchableOpacity
          style={styles.datePickerModalOverlay}
          activeOpacity={1}
          onPress={() => setShowPeriodEndPicker(false)}
        >
          <View style={styles.datePickerModalContent}>
            <View style={styles.datePickerHeader}>
              <Text style={styles.datePickerTitle}>{t('periodEndDate')}</Text>
              <TouchableOpacity onPress={() => setShowPeriodEndPicker(false)}>
                <Ionicons
                  name="close"
                  size={24}
                  color="rgba(255,255,255,0.7)"
                />
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={periodEndDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(_event: any, selectedDate?: Date) => {
                if (Platform.OS === 'android') setShowPeriodEndPicker(false);
                if (selectedDate) setPeriodEndDate(selectedDate);
              }}
              minimumDate={date}
              textColor="#ffffff"
              themeVariant="dark"
              style={styles.datePickerInModal}
            />
          </View>
        </TouchableOpacity>
      </Modal>
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
      borderRadius: 24,
      padding: 24,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    statusRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      marginBottom: 20,
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
      fontSize: 22,
      fontWeight: 'bold',
      color: '#ffffff',
      marginBottom: 4,
      textAlign: isRTL ? 'right' : 'left',
      fontFamily: isRTL ? 'NotoNaskhArabic-Bold' : undefined,
    },
    statusDescription: {
      fontSize: 14,
      color: 'rgba(255,255,255,0.7)',
      textAlign: isRTL ? 'right' : 'left',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
      lineHeight: 20,
    },
    totalVersesContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,255,255,0.1)',
      paddingTop: 16,
    },
    totalVersesNumber: {
      fontSize: 42,
      fontWeight: 'bold',
      color: '#ffffff',
      lineHeight: 48,
    },
    totalVersesLabel: {
      fontSize: 13,
      color: 'rgba(255,255,255,0.6)',
      textTransform: 'uppercase',
      letterSpacing: 1.5,
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
      marginTop: 4,
    },
    card: {
      backgroundColor: 'rgba(0,0,0,0.3)',
      borderRadius: 20,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
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
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderRadius: 16,
      padding: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.05)',
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
    sectionLabel: {
      fontSize: 14,
      color: 'rgba(255,255,255,0.5)',
      textAlign: isRTL ? 'right' : 'left',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
      marginBottom: 4,
    },
    pickerRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      gap: 12,
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
    addRangeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      padding: 16,
      borderRadius: 16,
      marginBottom: 24,
      gap: 8,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
      borderStyle: 'dashed',
    },
    addRangeText: {
      color: '#ffffff',
      fontSize: 15,
      fontWeight: '600',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    buttonRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      gap: 16,
      marginTop: 12,
      marginBottom: 40,
    },
    cancelButton: {
      flex: 1,
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderRadius: 18,
      paddingVertical: 18,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 60,
    },
    cancelButtonText: {
      color: 'rgba(255,255,255,0.8)',
      fontSize: 16,
      fontWeight: '600',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    saveButton: {
      flex: 2,
      backgroundColor: '#22c55e', // Solid Green
      borderRadius: 18,
      paddingVertical: 18,
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'center',
      // gap: 10, // Removed gap to allow precise animation control
      shadowColor: '#22c55e',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 6,
      minHeight: 60,
    },
    saveButtonDisabled: {
      opacity: 0.9, // Keep opacity high for the success state
      backgroundColor: '#15803d',
    },
    saveButtonText: {
      color: '#ffffff',
      fontSize: 17,
      fontWeight: '700',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    shafWitrDesc: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.4)',
      marginTop: 2,
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    pillsContainer: {
      marginTop: 8,
      flexDirection: isRTL ? 'row-reverse' : 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    surahPill: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.06)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
    },
    surahPillActive: {
      backgroundColor: 'rgba(34, 197, 94, 0.15)',
      borderColor: 'rgba(34, 197, 94, 0.6)',
    },
    surahPillText: {
      color: 'rgba(255,255,255,0.45)',
      fontSize: 13,
      fontWeight: '500',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    surahPillTextActive: {
      color: '#ffffff',
    },
    surahPillBadge: {
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderRadius: 8,
      paddingHorizontal: 5,
      paddingVertical: 1,
    },
    surahPillBadgeActive: {
      backgroundColor: 'rgba(34, 197, 94, 0.3)',
    },
    surahPillBadgeText: {
      color: 'rgba(255,255,255,0.3)',
      fontSize: 11,
      fontWeight: '600',
    },
    surahPillBadgeTextActive: {
      color: '#22c55e',
    },
    toggleRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: 'rgba(255,255,255,0.05)',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.05)',
    },
    toggleLabel: {
      fontSize: 15,
      color: '#ffffff',
      fontWeight: '500',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    wholeSurahRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'flex-end',
      gap: 10,
    },
    wholeSurahRangeChip: {
      flex: 2,
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
      alignSelf: 'flex-end',
      justifyContent: 'center',
    },
    wholeSurahAyahNum: {
      fontSize: 15,
      fontWeight: '600',
      color: '#ffffff',
    },
    datePickerModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    datePickerModalContent: {
      backgroundColor: '#2a2a2a',
      borderRadius: 24,
      padding: 24,
      width: '100%',
      maxWidth: 400,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
    },
    datePickerHeader: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    datePickerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#ffffff',
      fontFamily: isRTL ? 'NotoNaskhArabic-Bold' : undefined,
    },
    datePickerInModal: {
      width: '100%',
      height: Platform.OS === 'ios' ? 200 : undefined,
    },
  });
