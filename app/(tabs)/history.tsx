import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Calendar } from '../../components/Calendar';
import { CategoryBreakdownChart } from '../../components/CategoryBreakdownChart';
import { DailyBreakdownChart } from '../../components/DailyBreakdownChart';
import { StatsOverview } from '../../components/StatsOverview';
import { WeeklyTrendsChart } from '../../components/WeeklyTrendsChart';
import { YearlyGraph } from '../../components/YearlyGraph';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../hooks/useAuth';
import {
  getCurrentStreak,
  getMonthlyData,
  getPrayerLogs,
  getStatusStats,
  getYearlyData,
  PrayerLog,
} from '../../utils/supabase';

export default function HistoryScreen() {
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();
  const { theme } = useTheme();
  const [logs, setLogs] = useState<PrayerLog[]>([]);
  const [stats, setStats] = useState<{ status: string; count: number }[]>([]);
  const [streak, setStreak] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [yearlyData, setYearlyData] = useState<{
    [key: string]: { verses: number; status: string };
  }>({});
  const [monthlyData, setMonthlyData] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const styles = createStyles(theme);

  useEffect(() => {
    if (authLoading) return;

    if (!session) {
      router.replace('/(auth)/sign-in');
      return;
    }

    async function loadData() {
      try {
        const [logsData, statsData, streakData, yearData, monthData] =
          await Promise.all([
            getPrayerLogs(),
            getStatusStats(),
            getCurrentStreak(),
            getYearlyData(),
            getMonthlyData(),
          ]);
        setLogs(logsData);
        setStats(statsData);
        setStreak(streakData);
        setYearlyData(yearData);
        setMonthlyData(monthData);
      } catch (err: any) {
        setError(err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [session, authLoading]);

  if (authLoading || loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
      </View>
    );
  }

  const totalNights = logs.length;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={{
            uri: 'https://images.pexels.com/photos/1624496/pexels-photo-1624496.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
          }}
          style={styles.backgroundImage}
        />
        <View style={styles.overlay} />
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Prayer History</Text>
          <Text style={styles.headerSubtitle}>
            Track your progress and consistency
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
          <Text style={styles.sectionTitle}>Recent History</Text>
          {logs.map((log) => (
            <View key={log.id} style={styles.historyItem}>
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
                  {new Date(log.date).toLocaleDateString()}
                </Text>
                <Text style={styles.historyRange}>
                  {log.start_surah} {log.start_ayah} → {log.end_surah}{' '}
                  {log.end_ayah}
                </Text>
                <Text style={styles.historyVerses}>
                  {log.total_ayahs} verses
                </Text>
              </View>
              <Text
                style={[
                  styles.historyStatus,
                  { color: getStatusColor(log.status) },
                ]}
              >
                {log.status}
              </Text>
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

const createStyles = (theme: any) =>
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
    },
    headerSubtitle: {
      fontSize: 16,
      color: '#e2e8f0',
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
    },
    historyItem: {
      flexDirection: 'row',
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
      marginRight: 12,
    },
    historyContent: {
      flex: 1,
    },
    historyDate: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: 2,
    },
    historyRange: {
      fontSize: 16,
      color: theme.text,
      marginBottom: 2,
    },
    historyVerses: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    historyStatus: {
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 12,
    },
  });
