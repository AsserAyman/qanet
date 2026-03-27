import React from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AnimatedGradientBackground } from '../../components/AnimatedGradientBackground';
import { Calendar } from '../../components/Calendar';
import { CategoryBreakdownChart } from '../../components/CategoryBreakdownChart';
import { StatsOverview } from '../../components/StatsOverview';
import { YearlyGraph } from '../../components/YearlyGraph';

import { useI18n } from '../../contexts/I18nContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  useExemptPeriods,
  useLastNightStats,
  useOfflineData,
  useOfflineStats,
  usePrayerLogs,
} from '../../hooks/useOfflineData';

export default function HistoryScreen() {
  const { t, isRTL } = useI18n();
  const { themedColorsEnabled } = useTheme();
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
  const { periods } = useExemptPeriods();

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

  const { gradientColors } = useLastNightStats(themedColorsEnabled);

  // Merge prayer statuses + period dates for calendar display
  const calendarMarkedDates = React.useMemo(() => {
    const merged = { ...monthlyData };
    for (const period of periods) {
      const start = new Date(period.start_date + 'T00:00:00Z');
      const end = new Date(period.end_date + 'T00:00:00Z');
      for (
        let d = new Date(start);
        d <= end;
        d.setUTCDate(d.getUTCDate() + 1)
      ) {
        const dateStr = d.toISOString().split('T')[0];
        // Only mark as period if there's no prayer log for that day
        if (!merged[dateStr]) {
          merged[dateStr] = 'Period';
        }
      }
    }
    return merged;
  }, [monthlyData, periods]);

  // Merge period dates into yearly graph data
  const yearlyGraphData = React.useMemo(() => {
    const merged = { ...yearlyData };
    for (const period of periods) {
      const start = new Date(period.start_date + 'T00:00:00Z');
      const end = new Date(period.end_date + 'T00:00:00Z');
      for (
        let d = new Date(start);
        d <= end;
        d.setUTCDate(d.getUTCDate() + 1)
      ) {
        const dateStr = d.toISOString().split('T')[0];
        if (!merged[dateStr]) {
          merged[dateStr] = { verses: 0, status: 'Period' };
        }
      }
    }
    return merged;
  }, [yearlyData, periods]);

  const totalNights = React.useMemo(() => {
    return stats.reduce((acc, curr) => acc + curr.count, 0);
  }, [stats]);

  const totalVerses = React.useMemo(() => {
    return Object.values(yearlyData).reduce((sum, day) => sum + day.verses, 0);
  }, [yearlyData]);

  if (!isInitialized || logsLoading || statsLoading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <AnimatedGradientBackground colors={gradientColors} />
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
        <AnimatedGradientBackground colors={gradientColors} />
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

  return (
    <View style={styles.container}>
      <AnimatedGradientBackground colors={gradientColors} />

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
          totalVerses={totalVerses}
          data={Object.fromEntries(
            Object.entries(yearlyData).map(([date, dayData]) => [
              date,
              dayData.verses,
            ]),
          )}
          stats={stats}
        />

        <CategoryBreakdownChart stats={stats} />

        <Calendar
          date={selectedDate}
          markedDates={calendarMarkedDates}
          onDateChange={setSelectedDate}
        />
        <YearlyGraph data={yearlyGraphData} />

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
    scrollView: {
      flex: 1,
    },
    contentContainer: {
      padding: 24,
      paddingTop: 80,
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
