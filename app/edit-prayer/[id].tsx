import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useI18n } from '../../contexts/I18nContext';
import { usePrayerLogs, useOfflineStats, calculateTotalAyahs } from '../../hooks/useOfflineData';
import { PickerModal, PickerOption } from '../../components/PickerModal';
import { SelectField } from '../../components/SelectField';
import {
  calculateVersesBetween,
  getVerseStatus,
  getGradientColors,
  quranData,
  globalIndexToSurahAyah,
  surahAyahToGlobalIndex,
} from '../../utils/quranData';

export default function EditPrayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isRTL, t } = useI18n();
  const insets = useSafeAreaInsets();
  const { logs, updateLog, deleteLog } = usePrayerLogs();
  const { refresh: refreshStats } = useOfflineStats();

  // Find the log by id
  const log = useMemo(() => logs.find((l) => l.id === id), [logs, id]);

  // Form state
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const [ranges, setRanges] = useState<Array<{
    id: string;
    startSurah: string;
    startAyah: number;
    endSurah: string;
    endAyah: number;
  }>>([]);
  const [activeRangeId, setActiveRangeId] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Modal visibility states
  const [showStartSurahPicker, setShowStartSurahPicker] = useState(false);
  const [showStartAyahPicker, setShowStartAyahPicker] = useState(false);
  const [showEndSurahPicker, setShowEndSurahPicker] = useState(false);
  const [showEndAyahPicker, setShowEndAyahPicker] = useState(false);

  const styles = createStyles(isRTL);

  // Initialize form with log data when log is found
  useEffect(() => {
    if (log) {
      setDate(new Date(log.prayer_date));

      if (log.recitations.length > 0) {
        const loadedRanges = log.recitations.map((rec, index) => {
          const startInfo = globalIndexToSurahAyah(rec.start_ayah);
          const endInfo = globalIndexToSurahAyah(rec.end_ayah);
          return {
            id: index.toString(),
            startSurah: startInfo.surahName,
            startAyah: startInfo.ayahNumber,
            endSurah: endInfo.surahName,
            endAyah: endInfo.ayahNumber,
          };
        });
        setRanges(loadedRanges);
        setActiveRangeId('0');
      } else {
         // Fallback default
         setRanges([{
           id: '0',
           startSurah: 'Al-Baqara',
           startAyah: 1,
           endSurah: 'Al-Baqara',
           endAyah: 1,
         }]);
         setActiveRangeId('0');
      }
    }
  }, [log]);

  const activeRange = ranges.find(r => r.id === activeRangeId) || ranges[0];
  const currentSurah = quranData.find((s) => s.name === activeRange?.startSurah);
  const endCurrentSurah = quranData.find((s) => s.name === activeRange?.endSurah);

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

  const totalVerses = useMemo(() => ranges.reduce((acc, range) => {
    return acc + calculateVersesBetween(
      range.startSurah,
      range.startAyah,
      range.endSurah,
      range.endAyah
    );
  }, 0), [ranges]);

  const status = getVerseStatus(totalVerses);
  const gradientColors = useMemo(
    () => getGradientColors(totalVerses),
    [totalVerses]
  );

  const updateRange = (id: string, updates: Partial<typeof ranges[0]>) => {
    setRanges(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const addRange = () => {
    const lastRange = ranges[ranges.length - 1];
    setRanges(prev => [...prev, {
      id: Date.now().toString(),
      startSurah: lastRange.endSurah,
      startAyah: lastRange.endAyah, 
      endSurah: lastRange.endSurah,
      endAyah: lastRange.endAyah,
    }]);
  };

  const removeRange = (id: string) => {
    if (ranges.length > 1) {
      setRanges(prev => prev.filter(r => r.id !== id));
    }
  };

  const handleSave = async () => {
    if (!log) return;

    try {
      setLoading(true);

      const recitations = ranges.map(range => ({
        start_ayah: surahAyahToGlobalIndex(range.startSurah, range.startAyah),
        end_ayah: surahAyahToGlobalIndex(range.endSurah, range.endAyah),
      }));

      await updateLog(log.id, {
        prayer_date: date.toISOString().split('T')[0],
        recitations,
      });

      await refreshStats();
      router.back();
    } catch (error) {
      console.error('Failed to update prayer log:', error);
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
    if (!loading && !deleteLoading) {
      router.back();
    }
  };

  const handleDelete = () => {
    if (!log) return;

    Alert.alert(
      t('confirmDelete'),
      t('deleteConfirmMessage'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleteLoading(true);
              await deleteLog(log.id);
              await refreshStats();
              router.back();
            } catch (error) {
              console.error('Delete failed:', error);
              setDeleteLoading(false);
            }
          },
        },
      ]
    );
  };

  // Show loading state while finding the log
  if (!log || ranges.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

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
        <Text style={styles.title}>{t('editPrayerLog')}</Text>
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
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={styles.statusTextContainer}>
              <Text style={styles.statusTitle}>
                {t(status.status.toLowerCase().replace(/\s+/g, ''))}
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
        {ranges.map((range, index) => (
          <View key={range.id} style={styles.card}>
            <View style={[styles.cardHeader, { justifyContent: 'space-between' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Ionicons
                  name="book-outline"
                  size={20}
                  color="rgba(255,255,255,0.7)"
                />
                <Text style={styles.cardTitle}>
                  {t('readingRange')} {ranges.length > 1 ? index + 1 : ''}
                </Text>
              </View>
              {ranges.length > 1 && (
                <TouchableOpacity onPress={() => removeRange(range.id)}>
                  <Ionicons name="trash-outline" size={20} color="#ff6b6b" />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.pickersSection}>
              {/* Start Point */}
              <Text style={styles.sectionLabel}>{t('startingPoint')}</Text>
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
              <Text style={styles.sectionLabel}>{t('endingPoint')}</Text>
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
            disabled={loading || deleteLoading}
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
              {loading ? t('updating') : t('update')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Delete Button */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          disabled={loading || deleteLoading}
          activeOpacity={0.8}
        >
          {deleteLoading ? (
            <ActivityIndicator size="small" color="#ef4444" />
          ) : (
            <Feather name="trash-2" size={20} color="#ef4444" />
          )}
          <Text style={styles.deleteButtonText}>{t('deleteEntry')}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Picker Modals */}
      <PickerModal
        visible={showStartSurahPicker}
        onClose={() => setShowStartSurahPicker(false)}
        onSelect={(value) => {
          const newSurah = quranData.find((s) => s.name === value);
          if (newSurah && activeRange?.startAyah > newSurah.ayahs) {
            updateRange(activeRangeId, { startSurah: value, startAyah: 1 });
          } else {
            updateRange(activeRangeId, { startSurah: value });
          }
        }}
        options={surahOptions}
        selectedValue={activeRange?.startSurah}
        title={t('startingSurah')}
        searchPlaceholder={t('surah')}
      />

      <PickerModal
        visible={showStartAyahPicker}
        onClose={() => setShowStartAyahPicker(false)}
        onSelect={(value) => updateRange(activeRangeId, { startAyah: Number(value) })}
        options={startAyahOptions}
        selectedValue={String(activeRange?.startAyah)}
        title={t('ayah')}
        showSearch={false}
      />

      <PickerModal
        visible={showEndSurahPicker}
        onClose={() => setShowEndSurahPicker(false)}
        onSelect={(value) => {
          const newSurah = quranData.find((s) => s.name === value);
          if (newSurah && activeRange?.endAyah > newSurah.ayahs) {
            updateRange(activeRangeId, { endSurah: value, endAyah: 1 });
          } else {
            updateRange(activeRangeId, { endSurah: value });
          }
        }}
        options={surahOptions}
        selectedValue={activeRange?.endSurah}
        title={t('endingSurah')}
        searchPlaceholder={t('surah')}
      />

      <PickerModal
        visible={showEndAyahPicker}
        onClose={() => setShowEndAyahPicker(false)}
        onSelect={(value) => updateRange(activeRangeId, { endAyah: Number(value) })}
        options={endAyahOptions}
        selectedValue={String(activeRange?.endAyah)}
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
    centered: {
      justifyContent: 'center',
      alignItems: 'center',
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
    },
    statusTextContainer: {
      flex: 1,
    },
    statusTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#ffffff',
      textAlign: isRTL ? 'right' : 'left',
      fontFamily: isRTL ? 'NotoNaskhArabic-Bold' : undefined,
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
    deleteButton: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      padding: 16,
      borderRadius: 16,
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      borderWidth: 1,
      borderColor: 'rgba(239, 68, 68, 0.3)',
      marginTop: 8,
    },
    deleteButtonText: {
      color: '#ef4444',
      fontSize: 16,
      fontWeight: '600',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
  });
