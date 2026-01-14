import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar } from '../../components/Calendar';
import { CategoryBreakdownChart } from '../../components/CategoryBreakdownChart';
import { DailyBreakdownChart } from '../../components/DailyBreakdownChart';
import { StatsOverview } from '../../components/StatsOverview';
import { WeeklyTrendsChart } from '../../components/WeeklyTrendsChart';
import { YearlyGraph } from '../../components/YearlyGraph';
import { LocalPrayerLog } from '../../utils/database/schema';

import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';
import { useAuth } from '../../hooks/useAuth';
import { usePrayerLogs, useOfflineStats, useOfflineData } from '../../hooks/useOfflineData';
import { quranData, getGradientColors } from '../../utils/quranData';

export default function HistoryScreen() {
  const { session, loading: authLoading } = useAuth();
  const { t, isRTL } = useI18n();
  const { isInitialized } = useOfflineData();
  const { logs, loading: logsLoading, refresh: refreshLogs, deleteLog } = usePrayerLogs();
  const {
    stats,
    streak,
    yearlyData,
    monthlyData,
    loading: statsLoading,
    error: statsError,
    refresh: refreshStats
  } = useOfflineStats();

  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [refreshing, setRefreshing] = React.useState(false);

  // Force dark styles
  const styles = createStyles(isRTL);

  const getSurahName = (name: string) => {
    const surah = quranData.find(s => s.name === name);
    return isRTL ? surah?.nameAr || name : name;
  };

  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refreshLogs(), refreshStats()]);
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshLogs, refreshStats]);

  const handleDelete = React.useCallback((log: LocalPrayerLog) => {
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
              await deleteLog(log.local_id);
              await refreshStats();
            } catch (error) {
              console.error('Delete failed:', error);
            }
          },
        },
      ]
    );
  }, [deleteLog, refreshStats, t]);

  const handleEdit = React.useCallback((log: LocalPrayerLog) => {
    router.push(`/edit-prayer/${log.local_id}`);
  }, []);

  const lastEntry = logs.length > 0 ? logs[0] : null;
  const gradientColors = React.useMemo(() => {
    const totalVerses = lastEntry?.total_ayahs || 0;
    return getGradientColors(totalVerses);
  }, [lastEntry]);

  if (authLoading || !isInitialized || logsLoading || statsLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <LinearGradient
          colors={gradientColors}
          style={styles.background}
        />
        <Text style={{ color: '#ffffff', fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined }}>
          {t('loading')}
        </Text>
      </View>
    );
  }

  if (statsError) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <LinearGradient
          colors={gradientColors}
          style={styles.background}
        />
        <Text style={[styles.errorText, { color: '#ff6b6b', fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined }]}>
          {statsError}
        </Text>
      </View>
    );
  }

  const totalNights = logs.length;

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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#ffffff"
            colors={['#ffffff']}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('prayerHistory')}</Text>
          <Text style={styles.headerSubtitle}>
            {t('trackYourProgressAndConsistency')}
          </Text>
        </View>

        <StatsOverview
          streak={streak}
          totalNights={totalNights}
          data={Object.fromEntries(
            Object.entries(yearlyData).map(([date, dayData]) => [
              date,
              dayData.verses,
            ])
          )}
          stats={stats}
        />

        <CategoryBreakdownChart stats={stats} />

        <WeeklyTrendsChart
          data={Object.fromEntries(
            Object.entries(yearlyData).map(([date, dayData]) => [
              date,
              dayData.verses,
            ])
          )}
        />

        <DailyBreakdownChart
          data={Object.fromEntries(
            Object.entries(yearlyData).map(([date, dayData]) => [
              date,
              dayData.verses,
            ])
          )}
        />

        <YearlyGraph data={yearlyData} />

        <Calendar
          date={selectedDate}
          markedDates={monthlyData}
          onDateChange={setSelectedDate}
        />

        <View style={styles.historyCard}>
          <Text style={styles.sectionTitle}>{t('recentHistory')}</Text>
          {logs.map((log) => (
            <View key={log.local_id} style={styles.historyItem}>
              <View
                style={[
                  styles.historyIconContainer,
                  { backgroundColor: getStatusColor(log.status) + '20' },
                ]}
              >
                <Feather
                  name="moon"
                  size={20}
                  color={getStatusColor(log.status)}
                />
              </View>
              <View style={styles.historyContent}>
                <Text style={styles.historyDate}>
                  {new Date(log.date).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
                </Text>
                <Text style={styles.historyRange}>
                  {getSurahName(log.start_surah)} {log.start_ayah} → {getSurahName(log.end_surah)}{' '}
                  {log.end_ayah}
                </Text>
                <Text style={styles.historyVerses}>
                  {log.total_ayahs} {t('verses')}
                </Text>
              </View>
              <View style={styles.rightContainer}>
                <View style={styles.syncStatusContainer}>
                  <Text
                    style={[
                      styles.historyStatus,
                      { color: getStatusColor(log.status) },
                    ]}
                  >
                    {t(log.status.toLowerCase().replace(' ', ''))}
                  </Text>
                  {log.sync_status !== 'synced' && (
                    <View style={[styles.syncIndicator, { backgroundColor: getSyncStatusColor(log.sync_status) }]} />
                  )}
                </View>
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleEdit(log)}
                    activeOpacity={0.7}
                  >
                    <Feather name="edit-2" size={16} color="rgba(255,255,255,0.6)" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDelete(log)}
                    activeOpacity={0.7}
                  >
                    <Feather name="trash-2" size={16} color="rgba(239,68,68,0.8)" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'Mokantar':
      return '#a855f7';
    case 'Qanet':
      return '#22c55e';
    case 'Not Negligent':
      return '#3b82f6';
    default:
      return '#ef4444';
  }
}

function getSyncStatusColor(syncStatus: string): string {
  switch (syncStatus) {
    case 'pending':
      return '#eab308';
    case 'error':
      return '#ef4444';
    case 'conflict':
      return '#f97316';
    default:
      return '#22c55e';
  }
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
    errorText: {
      textAlign: 'center',
      marginTop: 20,
      fontSize: 16,
    },
    historyCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      borderRadius: 24,
      padding: 20,
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
    historyItem: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    historyIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: isRTL ? 0 : 16,
      marginLeft: isRTL ? 16 : 0,
    },
    historyContent: {
      flex: 1,
    },
    historyDate: {
      fontSize: 14,
      color: 'rgba(255,255,255,0.6)',
      marginBottom: 4,
      textAlign: isRTL ? 'right' : 'left',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    historyRange: {
      fontSize: 16,
      fontWeight: '600',
      color: '#ffffff',
      marginBottom: 2,
      textAlign: isRTL ? 'right' : 'left',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    historyVerses: {
      fontSize: 14,
      color: 'rgba(255,255,255,0.6)',
      textAlign: isRTL ? 'right' : 'left',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    rightContainer: {
      alignItems: isRTL ? 'flex-start' : 'flex-end',
      gap: 8,
    },
    syncStatusContainer: {
      alignItems: isRTL ? 'flex-start' : 'flex-end',
      gap: 6,
    },
    historyStatus: {
      fontSize: 14,
      fontWeight: '600',
      marginLeft: isRTL ? 0 : 12,
      marginRight: isRTL ? 12 : 0,
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    syncIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    actionButtons: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      gap: 8,
    },
    actionButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(255,255,255,0.1)',
      justifyContent: 'center',
      alignItems: 'center',
    },
  });