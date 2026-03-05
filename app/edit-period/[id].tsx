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
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useI18n } from '../../contexts/I18nContext';
import { useExemptPeriods, useOfflineStats } from '../../hooks/useOfflineData';

export default function EditPeriodScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isRTL, t } = useI18n();
  const insets = useSafeAreaInsets();
  const { periods, updatePeriod, deletePeriod } = useExemptPeriods();
  const { refresh: refreshStats } = useOfflineStats();

  const period = useMemo(() => periods.find((p) => p.id === id), [periods, id]);

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const styles = createStyles(isRTL);

  useEffect(() => {
    if (period) {
      setStartDate(new Date(period.start_date + 'T00:00:00'));
      setEndDate(new Date(period.end_date + 'T00:00:00'));
    }
  }, [period]);

  const dayCount = useMemo(() => {
    const diffMs = endDate.getTime() - startDate.getTime();
    return Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1);
  }, [startDate, endDate]);


  const handleSave = async () => {
    if (!period) return;
    try {
      setLoading(true);
      const startStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
      const endStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
      await updatePeriod(period.id, startStr, endStr);
      await refreshStats();
      router.back();
    } catch (error) {
      console.error('Failed to update period:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!period) return;
    Alert.alert(t('deletePeriod'), t('confirmDeletePeriod'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            setDeleteLoading(true);
            await deletePeriod(period.id);
            await refreshStats();
            router.back();
          } catch (error) {
            console.error('Delete period failed:', error);
            setDeleteLoading(false);
          }
        },
      },
    ]);
  };

  const handleClose = () => {
    if (!loading && !deleteLoading) {
      router.back();
    }
  };

  if (!period) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#831843', '#500724', '#1a1a1a']}
        style={styles.gradient}
      />
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />

      {/* Handle */}
      <View style={styles.handleContainer}>
        <View style={styles.handle} />
      </View>

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top > 20 ? 0 : 8 }]}>
        <Text style={styles.title}>{t('editPeriod')}</Text>
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
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Ionicons name="calendar" size={32} color="#f472b6" />
          <Text style={styles.summaryNumber}>{dayCount} Days</Text>
          <Text style={styles.summaryLabel}>{t('periodDays')}</Text>
        </View>

        {/* Start Date */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons
              name="calendar-today"
              size={20}
              color="#f472b6"
            />
            <Text style={styles.cardTitle}>{t('periodStartDate')}</Text>
          </View>
          <TouchableOpacity
            style={styles.dateDisplay}
            onPress={() => setShowStartPicker(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.dateText}>
              {startDate.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
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

        {/* End Date */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons
              name="event"
              size={20}
              color="#f472b6"
            />
            <Text style={styles.cardTitle}>{t('periodEndDate')}</Text>
          </View>
          <TouchableOpacity
            style={styles.dateDisplay}
            onPress={() => setShowEndPicker(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.dateText}>
              {endDate.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
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
          <Text style={styles.deleteButtonText}>{t('deletePeriod')}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Start Date Picker Modal */}
      <Modal
        visible={showStartPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowStartPicker(false)}
      >
        <TouchableOpacity
          style={styles.datePickerModalOverlay}
          activeOpacity={1}
          onPress={() => setShowStartPicker(false)}
        >
          <View style={styles.datePickerModalContent}>
            <View style={styles.datePickerHeader}>
              <Text style={styles.datePickerTitle}>{t('periodStartDate')}</Text>
              <TouchableOpacity onPress={() => setShowStartPicker(false)}>
                <Ionicons name="close" size={24} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={startDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(_event: any, selectedDate?: Date) => {
                if (Platform.OS === 'android') setShowStartPicker(false);
                if (selectedDate) {
                  setStartDate(selectedDate);
                  if (selectedDate > endDate) {
                    setEndDate(selectedDate);
                  }
                }
              }}
              textColor="#ffffff"
              themeVariant="dark"
              style={styles.datePickerInModal}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* End Date Picker Modal */}
      <Modal
        visible={showEndPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEndPicker(false)}
      >
        <TouchableOpacity
          style={styles.datePickerModalOverlay}
          activeOpacity={1}
          onPress={() => setShowEndPicker(false)}
        >
          <View style={styles.datePickerModalContent}>
            <View style={styles.datePickerHeader}>
              <Text style={styles.datePickerTitle}>{t('periodEndDate')}</Text>
              <TouchableOpacity onPress={() => setShowEndPicker(false)}>
                <Ionicons name="close" size={24} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={endDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(_event: any, selectedDate?: Date) => {
                if (Platform.OS === 'android') setShowEndPicker(false);
                if (selectedDate) setEndDate(selectedDate);
              }}
              minimumDate={startDate}
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
      // marginTop: 12,

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
    summaryCard: {
      backgroundColor: 'rgba(244, 114, 182, 0.1)',
      borderRadius: 20,
      padding: 24,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: 'rgba(244, 114, 182, 0.2)',
      alignItems: 'center',
      gap: 8,
    },
    summaryNumber: {
      fontSize: 36,
      fontWeight: 'bold',
      color: '#ffffff',
      lineHeight: 42,
    },
    summaryLabel: {
      fontSize: 13,
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
      backgroundColor: '#f472b6',
      borderRadius: 16,
      padding: 16,
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      shadowColor: '#f472b6',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
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
