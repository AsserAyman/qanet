import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Calendar } from '../../components/Calendar';
import { CategoryBreakdownChart } from '../../components/CategoryBreakdownChart';
import { StatsOverview } from '../../components/StatsOverview';
import { WeeklyTrendsChart } from '../../components/WeeklyTrendsChart';
import { YearlyGraph } from '../../components/YearlyGraph';

import { useI18n } from '../../contexts/I18nContext';
import { useAuth } from '../../hooks/useAuth';
import {
  useOfflineData,
  useOfflineStats,
  usePrayerLogs,
} from '../../hooks/useOfflineData';
import { getGradientColors } from '../../utils/quranData';

export default function HistoryScreen() {
  const { session, loading: authLoading } = useAuth();
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
    refresh: refreshStats,
  } = useOfflineStats();

  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [refreshing, setRefreshing] = React.useState(false);

  // Force dark styles
  const styles = createStyles(isRTL);

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

  const lastEntry = logs.length > 0 ? logs[0] : null;
  const gradientColors = React.useMemo(() => {
    const totalVerses = lastEntry?.total_ayahs || 0;
    return getGradientColors(totalVerses);
  }, [lastEntry]);

  if (authLoading || !isInitialized || logsLoading || statsLoading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <LinearGradient colors={gradientColors} style={styles.background} />
        <Text
          style={{
            color: '#ffffff',
            fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
          }}
        >
          {t('loading')}
        </Text>
      </View>
    );
  }

  if (statsError) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <LinearGradient colors={gradientColors} style={styles.background} />
        <Text
          style={[
            styles.errorText,
            {
              color: '#ff6b6b',
              fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
            },
          ]}
        >
          {statsError}
        </Text>
      </View>
    );
  }

  const totalNights = logs.length;

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradientColors} style={styles.background} />

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
        <Calendar
          date={selectedDate}
          markedDates={monthlyData}
          onDateChange={setSelectedDate}
        />
        <YearlyGraph data={yearlyData} />

        <View style={{ height: 100 }} />
      </ScrollView>
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
  });
