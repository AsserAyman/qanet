import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Image, ScrollView, StyleSheet, Text, View, RefreshControl } from 'react-native';
import { Calendar } from '../../components/Calendar';
import { CategoryBreakdownChart } from '../../components/CategoryBreakdownChart';
import { DailyBreakdownChart } from '../../components/DailyBreakdownChart';
import { StatsOverview } from '../../components/StatsOverview';
import { WeeklyTrendsChart } from '../../components/WeeklyTrendsChart';
import { YearlyGraph } from '../../components/YearlyGraph';

import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';
import { useAuth } from '../../hooks/useAuth';
import { usePrayerLogs, useOfflineStats, useOfflineData } from '../../hooks/useOfflineData';

export default function HistoryScreen() {
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();
  const { theme } = useTheme();
  const { t, isRTL } = useI18n();
  const { isInitialized } = useOfflineData();
  const { logs, loading: logsLoading, refresh: refreshLogs } = usePrayerLogs();
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

  const styles = createStyles(theme, isRTL);


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

  if (authLoading || !isInitialized || logsLoading || statsLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text, fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined }}>
          {t('loading')}
        </Text>
      </View>
    );
  }

  if (statsError) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorText, { color: theme.error, fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined }]}>
          {statsError}
        </Text>
      </View>
    );
  }

  const totalNights = logs.length;

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={theme.primary}
          colors={[theme.primary]}
        />
      }
    >
      
      <View style={styles.header}>
        <Image
          source={{
            uri: 'https://images.pexels.com/photos/1624496/pexels-photo-1624496.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
          }}
          style={styles.backgroundImage}
        />
        <View style={styles.overlay} />
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{t('prayerHistory')}</Text>
          <Text style={styles.headerSubtitle}>
            {t('trackYourProgressAndConsistency')}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
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
                  {log.start_surah} {log.start_ayah} → {log.end_surah}{' '}
                  {log.end_ayah}
                </Text>
                <Text style={styles.historyVerses}>
                  {log.total_ayahs} {t('verses')}
                </Text>
              </View>
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
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'Mokantar':
      return '#15803d';
    case 'Qanet':
      return '#2563eb';
    case 'Not Negligent':
      return '#ca8a04';
    default:
      return '#dc2626';
  }
}

function getSyncStatusColor(syncStatus: string): string {
  switch (syncStatus) {
    case 'pending':
      return '#ca8a04';
    case 'error':
      return '#dc2626';
    case 'conflict':
      return '#f97316';
    default:
      return '#22c55e';
  }
}

const createStyles = (theme: any, isRTL: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      height: 200,
      position: 'relative',
    },
    backgroundImage: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.overlay,
    },
    headerContent: {
      flex: 1,
      justifyContent: 'center',
      padding: 24,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#ffffff',
      marginBottom: 8,
      textAlign: isRTL ? 'right' : 'left',
      fontFamily: isRTL ? 'NotoNaskhArabic-Bold' : undefined,
    },
    headerSubtitle: {
      fontSize: 16,
      color: '#e2e8f0',
      textAlign: isRTL ? 'right' : 'left',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    content: {
      flex: 1,
      marginTop: -24,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      backgroundColor: theme.background,
      padding: 24,
    },
    errorText: {
      textAlign: 'center',
      marginTop: 20,
    },
    historyCard: {
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 16,
      textAlign: isRTL ? 'right' : 'left',
      fontFamily: isRTL ? 'NotoNaskhArabic-Bold' : undefined,
    },
    historyItem: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    historyIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: isRTL ? 0 : 12,
      marginLeft: isRTL ? 12 : 0,
    },
    historyContent: {
      flex: 1,
    },
    historyDate: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: 2,
      textAlign: isRTL ? 'right' : 'left',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    historyRange: {
      fontSize: 16,
      color: theme.text,
      marginBottom: 2,
      textAlign: isRTL ? 'right' : 'left',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    historyVerses: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: isRTL ? 'right' : 'left',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    syncStatusContainer: {
      alignItems: 'flex-end',
      gap: 4,
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
  });